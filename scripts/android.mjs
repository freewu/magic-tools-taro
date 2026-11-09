#!/usr/bin/env node
// Android（React Native）打包 / 安装工具
//
// 用法：
//   node scripts/android.mjs doctor                 检查 JDK / Android SDK / adb / 已连接设备
//   node scripts/android.mjs devices                列出已连接的真机 / 模拟器
//   node scripts/android.mjs emulator [avd]         启动模拟器（不带名字时列出可选 AVD）
//   node scripts/android.mjs sync                   只同步 JS bundle + 图片资源进 android 工程
//   node scripts/android.mjs apk                    只打 release APK（产物 android/app/build/outputs）
//   node scripts/android.mjs install                安装已打好的 APK 并启动
//   node scripts/android.mjs run                    同步 + 打包 + 安装 + 启动（just android 用的就是它）
//   node scripts/android.mjs dev                    打 debug APK（走 Metro 热更新）并启动
//
// 常用环境变量：
//   ANDROID_HOME / ANDROID_SDK_ROOT   Android SDK 路径（Windows 路径或 WSL 路径都行）
//   JAVA_HOME / ANDROID_JAVA_HOME     JDK 17 路径（Gradle 用）
//   RN_NDK_VERSION                    指定 NDK 版本（默认对齐 RN 0.73：25.1.8937393）
//   SKIP_BUNDLE=1                     跳过 taro build --type rn，直接复用 dist/rn 里已有的 bundle
//
// 背景：Taro 的 RN 方案只把业务代码打成 JS bundle，原生壳由本仓库的 android/ 提供
// （移植自 taro-native-shell 0.73 分支）。android/app/build.gradle 里
// debuggableVariants 含 release，所以 Gradle 不会自己打包 JS，bundle 由本脚本同步进去。

import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const androidDir = path.join(root, 'android')
const bundleDir = path.join(root, 'dist', 'rn')
const bundleFile = path.join(bundleDir, 'index.android.bundle')
const assetsDir = path.join(androidDir, 'app', 'src', 'main', 'assets')
const resDir = path.join(androidDir, 'app', 'src', 'main', 'res')
const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')
const debugApkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')

const APP_ID = 'com.magictools'
const MAIN_ACTIVITY = `${APP_ID}/.MainActivity`

// ---------------------------------------------------------------- 平台适配

const IS_WINDOWS = process.platform === 'win32'
const IS_WSL =
  process.platform === 'linux' &&
  (fs.existsSync('/proc/version') ? /microsoft|wsl/i.test(fs.readFileSync('/proc/version', 'utf8')) : false)

/** WSL 里把 /mnt/c/... 换成 C:\...；其它平台原样返回 */
function toWindowsPath(p) {
  if (!p) return p
  if (!IS_WSL) return p
  if (!p.startsWith('/mnt/')) return p
  const [, , drive, ...rest] = p.split('/')
  return `${drive.toUpperCase()}:\\${rest.join('\\')}`
}

/** Windows 路径换成 WSL 可访问的 /mnt/... 路径；其它平台原样返回 */
function toUnixPath(p) {
  if (!p) return p
  if (!IS_WSL) return p
  const m = /^([A-Za-z]):[\\/](.*)$/.exec(p)
  if (!m) return p
  return `/mnt/${m[1].toLowerCase()}/${m[2].replace(/\\/g, '/')}`
}

/** 读 Windows 侧环境变量（WSL 里 bash 拿不到 %LOCALAPPDATA%） */
function windowsEnv(name) {
  const out = spawnSync('cmd.exe', ['/d', '/c', `echo %${name}%`], { encoding: 'utf8' })
  const value = (out.stdout || '').trim()
  if (!value || value === `%${name}%`) return ''
  return value
}

const exists = (p) => !!p && fs.existsSync(toUnixPath(p))

/** 在目录里按通配符前缀挑一个最匹配的子目录（版本号越大越好） */
function pickDir(dir, pattern) {
  const unixDir = toUnixPath(dir)
  if (!fs.existsSync(unixDir)) return null
  const re = new RegExp(`^${pattern}$`, 'i')
  const matches = fs
    .readdirSync(unixDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && re.test(d.name))
    .map((d) => d.name)
    .sort((a, b) => (naturalCompare(a, b) > 0 ? -1 : 1))
  if (!matches.length) return null
  const sep = dir.includes('\\') ? '\\' : '/'
  return `${dir.replace(/[\\/]+$/, '')}${sep}${matches[0]}`
}

function naturalCompare(a, b) {
  const split = (s) => s.split(/(\d+)/).filter(Boolean)
  const pa = split(a)
  const pb = split(b)
  for (let i = 0; i < Math.min(pa.length, pb.length); i++) {
    const na = Number(pa[i])
    const nb = Number(pb[i])
    if (!Number.isNaN(na) && !Number.isNaN(nb)) {
      if (na !== nb) return na - nb
    } else if (pa[i] !== pb[i]) {
      return pa[i].localeCompare(pb[i])
    }
  }
  return pa.length - pb.length
}

// ---------------------------------------------------------------- 定位工具链

function findSdk() {
  const fromEnv = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT].filter(Boolean)
  for (const candidate of fromEnv) if (exists(candidate)) return candidate

  const bases = IS_WSL
    ? [windowsEnv('LOCALAPPDATA'), windowsEnv('USERPROFILE')]
    : IS_WINDOWS
      ? [process.env.LOCALAPPDATA, process.env.USERPROFILE]
      : []

  function candidates() {
    return [
      ...bases.filter(Boolean).map((b) => `${b}\\Android\\Sdk`),
      ...(IS_WINDOWS ? [path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk')] : []),
      path.join(os.homedir(), 'Android', 'Sdk'),
      path.join(os.homedir(), 'Library', 'Android', 'sdk'),
      '/usr/lib/android-sdk'
    ]
  }

  for (const candidate of candidates()) if (exists(candidate)) return candidate
  return null
}

function findJavaHome() {
  const fromEnv = [process.env.ANDROID_JAVA_HOME, process.env.JAVA_HOME].filter(Boolean)
  for (const candidate of fromEnv) if (exists(path.join(candidate, 'bin'))) return candidate

  const searched = []
  if (IS_WSL || IS_WINDOWS) {
    const userProfile = IS_WSL ? windowsEnv('USERPROFILE') : process.env.USERPROFILE
    const programFiles = IS_WSL ? windowsEnv('ProgramFiles') : process.env.ProgramFiles
    const localAppData = IS_WSL ? windowsEnv('LOCALAPPDATA') : process.env.LOCALAPPDATA
    const roots = [
      [userProfile && `${userProfile}\\jdks`, 'jdk-17[^\\\\]*'],
      [programFiles && `${programFiles}\\Java`, 'jdk-17[^\\\\]*'],
      [programFiles && `${programFiles}\\Eclipse Adoptium`, 'jdk-17[^\\\\]*'],
      [programFiles && `${programFiles}\\Android\\Android Studio`, 'jbr'],
      [localAppData && `${localAppData}\\Programs\\Android Studio`, 'jbr']
    ]
    for (const [dir, pattern] of roots) {
      if (!dir) continue
      const picked = pickDir(dir, pattern)
      if (picked) searched.push(picked)
    }
  } else {
    const picked = pickDir('/usr/lib/jvm', '[^/]*(17|21)[^/]*')
    if (picked) searched.push(picked)
  }

  for (const candidate of searched) if (exists(path.join(candidate, 'bin'))) return candidate
  return null
}

function toolPathSuffix(bin) {
  if (IS_WINDOWS || IS_WSL) return `${bin}.exe`
  return bin
}

function findAdb(sdk) {
  if (!sdk) return null
  const adb = path.join(sdk, 'platform-tools', toolPathSuffix('adb'))
  return exists(adb) ? adb : null
}

function findEmulator(sdk) {
  if (!sdk) return null
  const emulator = path.join(sdk, 'emulator', toolPathSuffix('emulator'))
  return exists(emulator) ? emulator : null
}

const env = {
  get sdk() {
    return findSdk()
  },
  get javaHome() {
    return findJavaHome()
  },
  get adb() {
    return findAdb(this.sdk)
  }
}

// ---------------------------------------------------------------- 子进程

/** WSL 里执行 Windows 下的绝对路径 exe，要先换成 /mnt/... 形式 */
function normalizeExe(cmd) {
  if (!IS_WSL) return cmd
  return /^[A-Za-z]:[\\/]/.test(cmd) ? toUnixPath(cmd) : cmd
}

function run(cmd, args, options = {}) {
  const childEnv = { ...process.env, ...(options.env || {}) }
  const result = spawnSync(normalizeExe(cmd), args, {
    cwd: options.cwd,
    env: childEnv,
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    encoding: 'utf8'
  })
  if (result.error) throw result.error
  if (result.status !== 0 && !options.allowFailure) {
    const detail = options.capture ? `${result.stdout || ''}${result.stderr || ''}`.trim() : ''
    throw new Error(`${path.basename(cmd)} ${args.join(' ')} 失败（exit ${result.status}）${detail ? `\n${detail}` : ''}`)
  }
  return { status: result.status, stdout: result.stdout || '', stderr: result.stderr || '' }
}

function runQuiet(cmd, args) {
  const result = spawnSync(normalizeExe(cmd), args, { encoding: 'utf8' })
  return { status: result.status ?? 1, stdout: (result.stdout || '').trim(), stderr: (result.stderr || '').trim() }
}

/** Gradle 在 WSL / Windows 下都要跑在 Windows 侧（JDK 与 Android SDK 都是 Windows 版） */
function gradleTask(tasks, flags = []) {
  const sdk = env.sdk
  const javaHome = env.javaHome
  if (!sdk) throw new Error('找不到 Android SDK，请设置 ANDROID_HOME（或装 Android Studio）')
  if (!javaHome) throw new Error('找不到 JDK 17，请设置 JAVA_HOME / ANDROID_JAVA_HOME')

  writeLocalProperties(sdk)

  const gradleEnv = {
    JAVA_HOME: toWindowsPath(javaHome),
    ANDROID_HOME: toWindowsPath(sdk),
    ANDROID_SDK_ROOT: toWindowsPath(sdk)
  }
  const args = [...tasks, ...flags, '--console=plain']

  console.log(`▶ Gradle：${tasks.join(' ')} ${flags.join(' ')}`.trim())
  if (IS_WINDOWS || IS_WSL) {
    // WSL 里给 cmd.exe 传同名环境变量不生效（Windows 侧已有 JAVA_HOME 会赢），
    // 而 `set "VAR=..." && cmd` 在 cmd /c 下的引号又会丢，所以生成一个一次性 .bat：
    // 里面 set 好 JDK 17 / SDK 再 call gradlew.bat，参数原样透传。
    const runner = path.join(androidDir, '.gradle-run.bat')
    fs.writeFileSync(
      runner,
      [
        '@echo off',
        `cd /d "%~dp0"`,
        `set "JAVA_HOME=${gradleEnv.JAVA_HOME}"`,
        `set "ANDROID_HOME=${gradleEnv.ANDROID_HOME}"`,
        `set "ANDROID_SDK_ROOT=${gradleEnv.ANDROID_SDK_ROOT}"`,
        'call gradlew.bat %*',
        'exit /b %ERRORLEVEL%',
        ''
      ].join('\r\n')
    )
    run('cmd.exe', ['/d', '/c', 'call', toWindowsPath(runner), ...args], { cwd: androidDir })
  } else {
    run('sh', ['gradlew', ...args], { cwd: androidDir, env: gradleEnv })
  }
}

function writeLocalProperties(sdk) {
  const file = path.join(androidDir, 'local.properties')
  const content = `# 由 scripts/android.mjs 自动生成（勿提交）\nsdk.dir=${toWindowsPath(sdk).replace(/\\/g, '\\\\')}\n`
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
  if (current !== content) fs.writeFileSync(file, content)
}

// ---------------------------------------------------------------- JS bundle 同步

function ensureBundle() {
  if (process.env.SKIP_BUNDLE === '1' && fs.existsSync(bundleFile)) {
    console.log('↷ 跳过 JS 打包（SKIP_BUNDLE=1）')
    return
  }
  console.log('▶ 打包 JS bundle：taro build --type rn')
  run(IS_WINDOWS ? 'npm.cmd' : 'npm', ['run', 'build:rn'], { cwd: root })
  if (!fs.existsSync(bundleFile)) throw new Error(`打包后仍找不到 ${bundleFile}`)
}

function syncBundle() {
  if (!fs.existsSync(bundleFile)) throw new Error(`找不到 ${bundleFile}，先执行 just build-rn（或 just android）`)
  fs.mkdirSync(assetsDir, { recursive: true })
  fs.copyFileSync(bundleFile, path.join(assetsDir, 'index.android.bundle'))

  // dist/rn/drawable-* → app/src/main/res/drawable-*
  const copied = []
  for (const entry of fs.readdirSync(bundleDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith('drawable-')) continue
    const target = path.join(resDir, entry.name)
    fs.rmSync(target, { recursive: true, force: true })
    fs.cpSync(path.join(bundleDir, entry.name), target, { recursive: true })
    copied.push(entry.name)
  }
  const size = (fs.statSync(bundleFile).size / 1024).toFixed(1)
  console.log(`✓ JS bundle 已同步：${size} KB${copied.length ? `，图片目录 ${copied.length} 个` : ''}`)
}

// ---------------------------------------------------------------- 设备

function listDevices() {
  const adb = env.adb
  if (!adb) throw new Error('找不到 adb，请设置 ANDROID_HOME（或装 Android Studio）')
  // adb 的 server 偶尔会自己重启（例如 Gradle 构建期间），失败时重试一次而不是直接报错
  let out = run(adb, ['devices'], { capture: true, allowFailure: true }).stdout
  if (!out.includes('\n')) {
    spawnSync(normalizeExe(adb), ['start-server'], { encoding: 'utf8' })
    out = run(adb, ['devices'], { capture: true, allowFailure: true }).stdout
  }
  return out
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [serial, state] = line.split(/\s+/)
      return { serial, state }
    })
    .filter((d) => d.state === 'device')
}

function pickDevice() {
  const devices = listDevices()
  if (!devices.length) {
    throw new Error(
      '没有已连接的设备。请：\n  1) 手机开 USB 调试并授权（adb devices 能看到 device）；或\n  2) 执行 just android-emulator 启动模拟器后再试'
    )
  }
  const wanted = process.env.ANDROID_SERIAL
  if (wanted) {
    const hit = devices.find((d) => d.serial === wanted)
    if (!hit) throw new Error(`ANDROID_SERIAL=${wanted} 不在设备列表里`)
    return hit
  }
  if (devices.length > 1) {
    console.log(`! 检测到多个设备，默认用第一个：${devices.map((d) => d.serial).join(', ')}（可用 ANDROID_SERIAL 指定）`)
  }
  return devices[0]
}

/** 真机的 ABI 决定只打一个架构，APK 小、装得快 */
function deviceAbi(serial) {
  const adb = env.adb
  const { stdout } = run(adb, ['-s', serial, 'shell', 'getprop', 'ro.product.cpu.abi'], { capture: true, allowFailure: true })
  const abi = stdout.trim()
  return ['arm64-v8a', 'armeabi-v7a', 'x86_64', 'x86'].includes(abi) ? abi : 'arm64-v8a'
}

// ---------------------------------------------------------------- 命令实现

function cmdDoctor() {
  const sdk = env.sdk
  const javaHome = env.javaHome
  const adb = env.adb
  const emulator = findEmulator(sdk)

  console.log('Android 打包环境检查')
  console.log(`  平台        : ${IS_WSL ? 'WSL（调用 Windows 侧工具链）' : IS_WINDOWS ? 'Windows' : process.platform}`)
  console.log(`  JDK         : ${javaHome || '✗ 未找到（设置 JAVA_HOME 指向 JDK 17）'}`)
  console.log(`  Android SDK : ${sdk || '✗ 未找到（设置 ANDROID_HOME）'}`)
  console.log(`  adb         : ${adb ? toUnixPath(adb) : '✗ 未找到'}`)
  console.log(`  模拟器      : ${emulator ? toUnixPath(emulator) : '✗ 未找到'}`)
  if (sdk) {
    const ndkDir = toUnixPath(path.join(sdk, 'ndk'))
    const ndk = fs.existsSync(ndkDir) ? fs.readdirSync(ndkDir).join(', ') : '（无）'
    const platforms = (() => {
      const dir = toUnixPath(path.join(sdk, 'platforms'))
      return fs.existsSync(dir) ? fs.readdirSync(dir).join(', ') : '（无）'
    })()
    console.log(`  已装 NDK    : ${ndk}`)
    console.log(`  已装平台    : ${platforms}`)
  }
  if (javaHome) {
    const java = path.join(javaHome, 'bin', toolPathSuffix('java'))
    const v = runQuiet(java, ['-version'])
    const first = (v.stderr || v.stdout).split('\n')[0]
    console.log(`  java 版本   : ${first || '（读取失败）'}`)
  }
  if (adb) {
    const devices = listDevices()
    console.log(`  设备        : ${devices.length ? devices.map((d) => d.serial).join(', ') : '（无）'}`)
    if (emulator) {
      const avds = runQuiet(emulator, ['-list-avds']).stdout.split('\n').filter(Boolean)
      console.log(`  AVD         : ${avds.length ? avds.join(', ') : '（无，可用 avdmanager 创建）'}`)
    }
  }
  if (!sdk || !javaHome || !adb) {
    console.log('\n补齐方式：装 Android Studio（自带 SDK + JDK）或在环境变量里指定 ANDROID_HOME / JAVA_HOME')
    process.exitCode = 1
  }
}

function cmdDevices() {
  const devices = listDevices()
  if (!devices.length) {
    console.log('没有已连接的设备（adb devices 为空）')
    return
  }
  for (const d of devices) {
    const model = runQuiet(env.adb, ['-s', d.serial, 'shell', 'getprop', 'ro.product.model']).stdout
    console.log(`${d.serial}  ${model || '(未知型号)'}`)
  }
}

function cmdEmulator(name) {
  const sdk = env.sdk
  const emulator = findEmulator(sdk)
  if (!emulator) throw new Error('找不到 emulator，请设置 ANDROID_HOME')
  const avds = runQuiet(emulator, ['-list-avds']).stdout.split('\n').filter(Boolean)
  if (!name) {
    console.log(avds.length ? `可用 AVD：\n  ${avds.join('\n  ')}\n用法：just android-emulator <AVD 名>` : '没有可用 AVD')
    return
  }
  if (avds.length && !avds.includes(name)) throw new Error(`AVD ${name} 不存在，可用：${avds.join(', ')}`)

  const running = listDevices()
  if (running.length) {
    console.log(`! 已有设备在线（${running.map((d) => d.serial).join(', ')}），仍会尝试启动 ${name}`)
  }
  console.log(`▶ 启动模拟器：${name}`)
  spawn(normalizeExe(emulator), ['-avd', name, '-netdelay', 'none', '-netspeed', 'full'], {
    cwd: path.dirname(toUnixPath(emulator)),
    detached: true,
    stdio: 'ignore'
  }).unref()
  console.log('  首次启动可能较慢，等待设备上线……')
  runQuiet(env.adb, ['wait-for-device'])
  const deadline = Date.now() + 180000
  while (Date.now() < deadline) {
    const booted = runQuiet(env.adb, ['shell', 'getprop', 'sys.boot_completed']).stdout.trim()
    if (booted === '1') {
      console.log('✓ 模拟器已就绪')
      return
    }
    spawnSync(process.platform === 'win32' ? 'cmd.exe' : 'sleep', process.platform === 'win32' ? ['/c', 'timeout', '2'] : ['2'])
  }
  console.log('! 等待模拟器启动超时，可稍后执行 just android')
}

function cmdSync() {
  syncBundle()
}

function buildApk({ debug = false, abi } = {}) {
  // 有设备就按设备的 ABI 只打一个架构（APK 更小、装得更快），探测失败就退回 arm64-v8a
  let targetAbi = abi
  if (!targetAbi) {
    try {
      const [device] = listDevices()
      targetAbi = device ? deviceAbi(device.serial) : 'arm64-v8a'
    } catch {
      targetAbi = 'arm64-v8a'
    }
  }
  const flags = debug
    ? [`-PreactNativeArchitectures=${targetAbi}`]
    : [`-PreactNativeArchitectures=${targetAbi}`, '-x', 'lintVitalRelease']
  console.log(`▶ 目标 ABI：${targetAbi}`)
  gradleTask([debug ? 'assembleDebug' : 'assembleRelease'], flags)
  const apk = debug ? debugApkPath : apkPath
  if (!fs.existsSync(apk)) throw new Error(`构建结束但找不到 APK：${apk}`)
  const size = (fs.statSync(apk).size / 1024 / 1024).toFixed(1)
  console.log(`✓ APK：${path.relative(root, apk)}（${size} MB）`)
  return apk
}

function installAndLaunch(apk, { debug = false } = {}) {
  const device = pickDevice()
  const adb = env.adb
  console.log(`▶ 安装到 ${device.serial}`)
  // adb 是 Windows 侧的可执行文件，APK 路径要换成 Windows 形式
  run(adb, ['-s', device.serial, 'install', '-r', '-g', toWindowsPath(apk)])
  if (debug) {
    console.log('▶ adb reverse tcp:8081（Metro 调试用）')
    run(adb, ['-s', device.serial, 'reverse', 'tcp:8081', 'tcp:8081'], { allowFailure: true })
  }
  run(adb, ['-s', device.serial, 'shell', 'am', 'start', '-n', MAIN_ACTIVITY], { allowFailure: true })
  console.log(`✓ 已启动 ${APP_ID}`)
  if (debug) {
    console.log('\n提示：debug 包走 Metro 热更新，需要另开终端执行 just dev-rn 启动 Metro（8081）')
  }
}

function cmdApk() {
  ensureBundle()
  syncBundle()
  buildApk()
}

function cmdInstall() {
  if (!fs.existsSync(apkPath)) throw new Error('还没有 release APK，先执行 just android-apk')
  installAndLaunch(apkPath)
}

function cmdRun() {
  ensureBundle()
  syncBundle()
  const apk = buildApk()
  installAndLaunch(apk)
}

function cmdDev() {
  // debug 包不内嵌 bundle，反而更快：直接装壳，JS 从 Metro 拉
  buildApk({ debug: true })
  installAndLaunch(debugApkPath, { debug: true })
}

// ---------------------------------------------------------------- 入口

const [command = 'run', ...rest] = process.argv.slice(2)

try {
  switch (command) {
    case 'doctor':
      cmdDoctor()
      break
    case 'devices':
      cmdDevices()
      break
    case 'emulator':
      cmdEmulator(rest[0])
      break
    case 'sync':
      cmdSync()
      break
    case 'apk':
      cmdApk()
      break
    case 'install':
      cmdInstall()
      break
    case 'run':
      cmdRun()
      break
    case 'dev':
      cmdDev()
      break
    default:
      console.error(`未知命令：${command}`)
      console.error('可用：doctor | devices | emulator [avd] | sync | apk | install | run | dev')
      process.exitCode = 1
  }
} catch (error) {
  console.error(`\n✗ ${error.message}`)
  process.exitCode = 1
}

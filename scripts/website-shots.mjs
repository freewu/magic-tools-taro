#!/usr/bin/env node
// 官网截图：用无头 Chrome 逐页渲染 H5 产物，截图到 docs/screenshots/
//
// 用法：
//   node scripts/website-shots.mjs              # 截图全部页面（先跑 just build-h5）
//   node scripts/website-shots.mjs --only=bmi,settings
//   node scripts/website-shots.mjs --list       # 只打印会截哪些页面
//
// 约定与实现说明：
// - H5 产物是 hash 路由（#/pages/xxx），所以脚本自带一个只读静态服务器（未知路径回退 index.html）；
// - 浏览器走 CDP（Page.captureScreenshot，JPEG q=82），不依赖 puppeteer / playwright；
// - 视口固定 390×844、deviceScaleFactor=2，产物 780×1688，正好是手机截图的比例；
// - 在 WSL 里跑时自动转交给 Windows 侧 node：WSL 起的服务 Windows 的浏览器连不上，
//   反过来 Windows 的 127.0.0.1 互访没问题，所以服务端和浏览器必须同侧（Windows）；
// - 页面清单来自 src/pages/app/index.ts 的 appList（与首页登记保持一致）+ 3 个 tab 页，
//   文件名 slug 也与网站生成脚本 scripts/website.mjs 共用同一套规则。

import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import WebSocket from 'ws'

const scriptPath = fileURLToPath(import.meta.url)
const root = path.resolve(path.dirname(scriptPath), '..')
const h5Dir = path.join(root, 'dist', 'h5')
const shotDir = path.join(root, 'docs', 'screenshots')
const viewport = { width: 390, height: 844, deviceScaleFactor: 2 }
const quality = 82

// ---------------------------------------------------------------- WSL 转交

const isWSL =
  process.platform === 'linux' &&
  fs.existsSync('/proc/version') &&
  /microsoft/i.test(fs.readFileSync('/proc/version', 'utf8'))

if (isWSL && process.env.MAGIC_SHOTS_WIN !== '1') {
  const toWinPath = (p) => p.replace(/^\/mnt\/([a-zA-Z])\//, (_, d) => `${d.toUpperCase()}:\\`).replace(/\//g, '\\')
  const result = spawnSync('cmd.exe', ['/c', 'node', toWinPath(scriptPath), ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, MAGIC_SHOTS_WIN: '1' }
  })
  if (result.error) {
    console.error(`转交 Windows node 失败：${result.error.message}`)
    console.error('可直接在 Windows 侧执行：node scripts\\website-shots.mjs')
    process.exit(1)
  }
  process.exit(result.status ?? 1)
}

// ---------------------------------------------------------------- 页面清单

/** 与 scripts/website.mjs 保持一致：把 appList 的一条记录转成截图文件名 */
export function shotSlug(pathname, query) {
  const base = pathname.replace(/\/index$/, '').replace(/\//g, '-')
  if (!query) {
    return base
  }
  const params = new URLSearchParams(query)
  const id = params.get('id')
  return id ? `${base}-${id}` : base
}

function readAppList() {
  const source = fs.readFileSync(path.join(root, 'src', 'pages', 'app', 'index.ts'), 'utf8')
  const entries = []
  const entry = /\{\s*name:\s*'([^']*)',\s*icon:\s*'([^']*)',\s*desc:\s*'([^']*)',\s*path:\s*'([^']*)',\s*query:\s*'([^']*)'\s*\}/g
  let match = entry.exec(source)
  while (match) {
    entries.push({ name: match[1], icon: match[2], desc: match[3], path: match[4], query: match[5] })
    match = entry.exec(source)
  }
  return entries
}

/** 要截图的页面：tab 页 + appList 里的每个工具（含 convert 的 8 个分类） */
function buildTargets() {
  const targets = [
    { slug: 'appstore', name: '应用商店', url: '/pages/appstore/index' },
    { slug: 'settings', name: '设置', url: '/pages/settings/index' },
    { slug: 'about', name: '关于', url: '/pages/about/index' }
  ]
  for (const app of readAppList()) {
    targets.push({
      slug: shotSlug(app.path, app.query),
      name: app.name,
      url: app.query ? `/pages/app/${app.path}?${app.query}` : `/pages/app/${app.path}`
    })
  }
  return targets
}

// ---------------------------------------------------------------- 静态服务器

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
    let file = path.join(h5Dir, urlPath)
    if (!file.startsWith(h5Dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(h5Dir, 'index.html')
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    })
    fs.createReadStream(file).pipe(res)
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }))
  })
}

// ---------------------------------------------------------------- 浏览器

function findChrome() {
  const candidates = []
  if (process.env.CHROME_PATH) {
    candidates.push(process.env.CHROME_PATH)
  }
  if (process.platform === 'win32') {
    const bases = [process.env['PROGRAMFILES'], process.env['PROGRAMFILES(X86)'], 'C:\\Program Files', 'C:\\Program Files (x86)']
    for (const base of bases) {
      if (!base) continue
      candidates.push(path.join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'))
      candidates.push(path.join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe'))
    }
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    candidates.push('/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge')
  } else {
    candidates.push('/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium')
  }
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }
  return null
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function freePort() {
  return new Promise((resolve) => {
    const probe = net.createServer()
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address()
      probe.close(() => resolve(port))
    })
  })
}

/** 极简 CDP 客户端：send(method, params) + 事件监听（flatten 模式，一个 ws 复用多个 target） */
class CDP {
  constructor(wsUrl) {
    this.wsUrl = wsUrl
    this.nextId = 0
    this.pending = new Map()
    this.handlers = new Set()
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl, { perMessageDeflate: false, maxPayload: 256 * 1024 * 1024 })
    this.ws.on('message', (raw) => {
      const message = JSON.parse(raw.toString())
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id)
        this.pending.delete(message.id)
        if (message.error) {
          reject(new Error(`${message.error.message} (${JSON.stringify(message.error)})`))
        } else {
          resolve(message.result)
        }
        return
      }
      for (const handler of this.handlers) {
        handler(message)
      }
    })
    await new Promise((resolve, reject) => {
      this.ws.once('open', resolve)
      this.ws.once('error', reject)
    })
  }

  send(method, params = {}, sessionId) {
    const id = ++this.nextId
    const payload = { id, method, params }
    if (sessionId) {
      payload.sessionId = sessionId
    }
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify(payload))
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id)
          reject(new Error(`CDP 超时：${method}`))
        }
      }, 30000)
    })
  }

  onEvent(handler) {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  /** 等到指定会话的 Page.loadEventFired */
  waitForLoad(sessionId, timeout = 20000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        off()
        reject(new Error('等待页面加载超时'))
      }, timeout)
      const off = this.onEvent((message) => {
        if (message.method === 'Page.loadEventFired' && message.sessionId === sessionId) {
          clearTimeout(timer)
          off()
          resolve()
        }
      })
    })
  }

  close() {
    this.ws?.close()
  }
}

/** 等 React 渲染完成：根节点出现 + 字体与图片就绪 + 一小段稳定期 */
async function waitForRender(cdp, sessionId) {
  const deadline = Date.now() + 15000
  while (Date.now() < deadline) {
    const { result } = await cdp.send(
      'Runtime.evaluate',
      {
        expression: `(() => {
          const page = document.querySelector('.taro_page')
          if (!page || page.children.length === 0) return false
          const images = [...document.images]
          return images.every((img) => img.complete)
        })()`,
        returnByValue: true
      },
      sessionId
    )
    if (result?.value === true) {
      break
    }
    await sleep(120)
  }
  await cdp.send(
    'Runtime.evaluate',
    { expression: 'document.fonts ? document.fonts.ready.then(() => true) : true', awaitPromise: true },
    sessionId
  )
  // 转盘 / 进度条这类有过渡动画的页面，等一小段让首帧稳定下来
  await sleep(500)
}

// ---------------------------------------------------------------- 主流程

async function main() {
  const argv = process.argv.slice(2)
  const onlyArg = argv.find((arg) => arg.startsWith('--only='))
  const only = onlyArg ? onlyArg.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean) : []
  for (const arg of argv) {
    if (arg !== '--list' && !arg.startsWith('--only=')) {
      console.error(`未知参数：${arg}`)
      process.exit(1)
    }
  }

  let targets = buildTargets()
  if (only.length > 0) {
    targets = targets.filter((target) => only.includes(target.slug))
    if (targets.length === 0) {
      console.error(`--only 没有匹配到页面，可选：${buildTargets().map((t) => t.slug).join(', ')}`)
      process.exit(1)
    }
  }

  if (argv.includes('--list')) {
    for (const target of targets) {
      console.log(`${target.slug.padEnd(22)} ${target.name.padEnd(12)} ${target.url}`)
    }
    return
  }

  if (!fs.existsSync(path.join(h5Dir, 'index.html'))) {
    console.error('缺少 dist/h5/index.html，先执行 `just build-h5`')
    process.exit(1)
  }
  fs.mkdirSync(shotDir, { recursive: true })

  const { server, port } = await startServer()
  const debugPort = await freePort()
  const executable = findChrome()
  if (!executable) {
    server.close()
    console.error('找不到 Chrome / Edge，可用 CHROME_PATH 环境变量指定可执行文件')
    process.exit(1)
  }
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'magic-shots-'))
  console.log(`浏览器：${executable}`)
  console.log(`静态服务：http://127.0.0.1:${port}/（dist/h5）`)
  console.log(`截图输出：${path.join('docs', 'screenshots')}/ 共 ${targets.length} 张`)

  const chrome = spawn(
    executable,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
      '--mute-audio',
      `--user-data-dir=${profileDir}`,
      `--remote-debugging-port=${debugPort}`,
      `--window-size=${viewport.width},${viewport.height}`,
      'about:blank'
    ],
    { stdio: 'ignore' }
  )

  let cdp
  try {
    const wsUrl = await waitForDebugger(debugPort)
    cdp = new CDP(wsUrl)
    await cdp.connect()
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' })
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true })
    await cdp.send('Page.enable', {}, sessionId)
    await cdp.send('Runtime.enable', {}, sessionId)
    await cdp.send(
      'Emulation.setDeviceMetricsOverride',
      {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: viewport.deviceScaleFactor,
        mobile: true
      },
      sessionId
    )

    let index = 0
    for (const target of targets) {
      index += 1
      // 加一个变化的自定义参数，避免 hash 变化被当成「同一文档内的路由跳转」而不重新加载
      const url = `http://127.0.0.1:${port}/?_=${index}#${target.url}`
      const loaded = cdp.waitForLoad(sessionId)
      await cdp.send('Page.navigate', { url }, sessionId)
      await loaded
      await waitForRender(cdp, sessionId)
      const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality }, sessionId)
      const file = path.join(shotDir, `${target.slug}.jpg`)
      fs.writeFileSync(file, Buffer.from(shot.data, 'base64'))
      const size = (fs.statSync(file).size / 1024).toFixed(0)
      console.log(`  ✓ ${`${index}/${targets.length}`.padEnd(8)} ${target.slug.padEnd(22)} ${target.name.padEnd(12)} ${size} KB`)
    }
  } finally {
    cdp?.close()
    chrome.kill()
    server.close()
    await sleep(300)
    fs.rmSync(profileDir, { recursive: true, force: true })
  }

  console.log(`\n完成，${targets.length} 张截图。生成官网：node scripts/website.mjs（或 just website）`)
}

async function waitForDebugger(port, timeout = 20000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`)
      const info = await response.json()
      if (info.webSocketDebuggerUrl) {
        return info.webSocketDebuggerUrl
      }
    } catch {
      // 浏览器还没起来，继续轮询
    }
    await sleep(200)
  }
  throw new Error('等待 Chrome 调试端口超时')
}

main().catch((error) => {
  console.error(`\n截图失败：${error.message}`)
  process.exit(1)
})

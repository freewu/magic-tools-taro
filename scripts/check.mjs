#!/usr/bin/env node
// 结构自检：页面路由 / tabBar 图标 / 应用商店注册的工具页 / 静态资源引用
//
// 用法：node scripts/check.mjs（或 just check）

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = path.join(root, 'src')

let errors = 0
let warnings = 0

const fail = (msg) => {
  errors++
  console.error(`  ✗ ${msg}`)
}

const warn = (msg) => {
  warnings++
  console.warn(`  ! ${msg}`)
}

const exists = (rel) => fs.existsSync(path.join(srcDir, rel))

// ---------------------------------------------------------------- 页面路由

const appConfigPath = path.join(srcDir, 'app.config.ts')
const appConfig = fs.readFileSync(appConfigPath, 'utf8')
const pagePaths = [...appConfig.matchAll(/^\s*'([^']+)',?\s*$/gm)].map((m) => m[1]).filter((p) => p.startsWith('pages/'))

console.log(`检查页面路由：共 ${pagePaths.length} 个`)

for (const pagePath of pagePaths) {
  const base = `./${pagePath}`
  if (!exists(`${base}.tsx`) && !exists(`${base}.ts`) && !exists(`${base}.jsx`)) {
    fail(`页面入口缺失：src/${pagePath}.tsx`)
  }
  if (!exists(`${base}.config.ts`)) {
    fail(`页面配置缺失：src/${pagePath}.config.ts`)
  }
}

// ---------------------------------------------------------------- tabBar 图标

console.log('检查 tabBar 图标：')
const tabIcons = [...appConfig.matchAll(/(?:iconPath|selectedIconPath):\s*'([^']+)'/g)].map((m) => m[1])
for (const icon of tabIcons) {
  if (!exists(icon)) {
    fail(`tabBar 图标缺失：src/${icon}`)
  }
}
if (tabIcons.length === 0) {
  warn('app.config.ts 中未找到 tabBar 图标配置')
}

// ---------------------------------------------------------------- 应用商店注册的工具页

console.log('检查应用商店注册的工具页：')
const registry = fs.readFileSync(path.join(srcDir, 'pages/app/index.ts'), 'utf8')
const appPaths = [...registry.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1])
for (const appPath of appPaths) {
  const pagePath = `pages/app/${appPath}`
  if (!pagePaths.includes(pagePath)) {
    fail(`应用未在 app.config.ts 注册：${pagePath}`)
  }
  if (!exists(`./${pagePath}.tsx`)) {
    fail(`应用页面缺失：src/${pagePath}.tsx`)
  }
}

// ---------------------------------------------------------------- 静态资源引用

console.log('检查静态资源引用：')
const walk = (dir) => {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walk(full))
    } else if (/\.(tsx|ts)$/.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

for (const file of walk(srcDir)) {
  const text = fs.readFileSync(file, 'utf8')
  for (const match of text.matchAll(/['"`]\/(static\/[^'"`]+)['"`]/g)) {
    if (!exists(match[1])) {
      fail(`${path.relative(root, file)} 引用了不存在的资源：src/${match[1]}`)
    }
  }
}

// ---------------------------------------------------------------- 结果

console.log('')
if (errors === 0) {
  console.log(`✓ 自检通过（${warnings} 条警告）`)
  process.exit(0)
}
console.error(`✗ 自检失败：${errors} 个错误，${warnings} 条警告`)
process.exit(1)

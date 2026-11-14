#!/usr/bin/env node
// 官网生成：把应用登记（src/pages/app/index.ts）+ 截图（docs/screenshots/）
// 渲染成静态官网 docs/index.html（GitHub Pages 直接托管 docs/ 目录）。
//
// 用法：node scripts/website.mjs      # 或 just website
//
// 说明：
// - 工具列表的唯一数据源是 src/pages/app/index.ts 的 appList，新工具登记后重跑即可；
// - 截图由 scripts/website-shots.mjs 生成（just shots），文件名规则与它共用 shotSlug；
// - 样式 / 交互分别在 docs/style.css 与 docs/main.js，手写维护，本脚本不覆盖它们。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const docsDir = path.join(root, 'docs')
const shotDir = path.join(docsDir, 'screenshots')

const SITE = {
  name: 'Magic 工具箱',
  tagline: '30 个常用工具，一个应用全搞定',
  description:
    '人民币大小写、BMI、房贷 / 个税 / 复利、单位换算、二维码、世界时间……全部本地计算，不上传、不登录、断网也能用。',
  repo: 'https://github.com/freewu/magic-tools-taro',
  license: 'MIT'
}

/** 截图文件名：与 scripts/website-shots.mjs 的 shotSlug 保持一致 */
function shotSlug(pathname, query) {
  const base = pathname.replace(/\/index$/, '').replace(/\//g, '-')
  if (!query) {
    return base
  }
  const id = new URLSearchParams(query).get('id')
  return id ? `${base}-${id}` : base
}

/** 从 appList 读取工具登记（结构简单，正则足够，避免为生成官网引入 TS 编译） */
function readAppList() {
  const source = fs.readFileSync(path.join(root, 'src', 'pages', 'app', 'index.ts'), 'utf8')
  const entries = []
  const entry =
    /\{\s*name:\s*'([^']*)',\s*icon:\s*'([^']*)',\s*desc:\s*'([^']*)',\s*path:\s*'([^']*)',\s*query:\s*'([^']*)'\s*\}/g
  let match = entry.exec(source)
  while (match) {
    entries.push({ name: match[1], icon: match[2], desc: match[3], path: match[4], query: match[5] })
    match = entry.exec(source)
  }
  return entries
}

// 分类用于官网分组展示（新增工具没归类时自动落到「其他」）
const CATEGORIES = [
  {
    id: 'money',
    name: '财务计算',
    intro: '工资、房贷、存款、退休金，输入数字直接出结果',
    paths: [
      'rmb-converter/index',
      'income-tax/index',
      'mortgage/index',
      'compound-interest/index',
      'rate-calc/index',
      'retirement-age/index',
      'pension/index',
      'hourly/index'
    ]
  },
  {
    id: 'health',
    name: '健康与身体',
    intro: '体重、代谢、生理周期与遗传概率，日常自查够用',
    paths: ['bmi/index', 'bmr/index', 'safe-period/index', 'due-date/index', 'blood-type/index']
  },
  {
    id: 'time',
    name: '时间与历法',
    intro: '节假日、时区、干支、朝代，年月日相关一次查完',
    paths: ['holiday2027/index', 'world-time/index', 'ganzhi/index', 'dynasties/index']
  },
  {
    id: 'convert',
    name: '单位换算',
    intro: '8 类换算器：公制 / 英制 / 市制一键对比，结果点击即复制',
    paths: [
      'convert/index?id=distance',
      'convert/index?id=area',
      'convert/index?id=volume',
      'convert/index?id=weight',
      'convert/index?id=temperature',
      'convert/index?id=energy',
      'convert/index?id=pressure',
      'convert/index?id=speed'
    ]
  },
  {
    id: 'lookup',
    name: '查询工具',
    intro: '车牌归属地、身份证信息，号码规则本地校验',
    paths: ['plate-city/index', 'id-card/index']
  },
  {
    id: 'utility',
    name: '实用小工具',
    intro: '二维码、世界时间这类随手要用的东西',
    paths: ['qrcode/index']
  },
  {
    id: 'fun',
    name: '趣味玩法',
    intro: '昵称装饰与抽奖转盘，聚会和社交场景用得上',
    paths: ['fuzzy-nickname/index', 'lucky-wheel/index']
  }
]

const PLATFORMS = [
  { icon: '💬', name: '微信小程序', note: '主推渠道，project.config.json 直接导入' },
  { icon: '🛒', name: '京东小程序', note: '同一套代码编译' },
  { icon: '🐾', name: '百度智能小程序', note: '产物 dist/swan' },
  { icon: '🐜', name: '支付宝小程序', note: '产物 dist/alipay' },
  { icon: '🎵', name: '抖音小程序', note: '字节跳动小程序平台' },
  { icon: '🐧', name: 'QQ 小程序', note: '产物 dist/qq' },
  { icon: '🦉', name: '飞书小程序', note: '社区插件注册 lark 平台' },
  { icon: '🌐', name: 'H5 网页版', note: '手机浏览器直接打开' },
  { icon: '🤖', name: 'Android App', note: 'React Native 0.73 原生打包' }
]

const FEATURES = [
  { icon: '🔒', title: '纯本地计算', text: '所有工具都在设备上算，不请求接口、不上传输入内容，号码类数据也只在本机解析。' },
  { icon: '📴', title: '断网可用', text: '没有网络依赖，小程序 / App 离线打开即可用；偏好设置与置顶存在本地存储里。' },
  { icon: '🧩', title: '一套代码多端', text: 'Taro 4 + React 18 + TypeScript，编译到 7 个小程序平台、H5 与 Android。' },
  { icon: '⚡', title: '打开就能算', text: '每个工具一屏完成输入与结果，不做多级跳转；换算结果点击即复制。' }
]

// ---------------------------------------------------------------- HTML

const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const shotExists = (slug) => fs.existsSync(path.join(shotDir, `${slug}.jpg`))

function buildTools() {
  const apps = readAppList().map((app) => ({
    ...app,
    slug: shotSlug(app.path, app.query),
    key: app.query ? `${app.path}?${app.query}` : app.path
  }))

  const used = new Set()
  const groups = []
  for (const category of CATEGORIES) {
    const items = []
    for (const key of category.paths) {
      const app = apps.find((candidate) => candidate.key === key)
      if (app && !used.has(app.key)) {
        items.push(app)
        used.add(app.key)
      }
    }
    if (items.length > 0) {
      groups.push({ ...category, items })
    }
  }
  const rest = apps.filter((app) => !used.has(app.key))
  if (rest.length > 0) {
    groups.push({ id: 'other', name: '其他', intro: '还没归类的工具', items: rest })
  }
  return { apps, groups }
}

function toolCard(app, categoryName) {
  const hasShot = shotExists(app.slug)
  const shot = hasShot
    ? `<img src="screenshots/${app.slug}.jpg" alt="${escapeHtml(app.name)} 界面截图" loading="lazy" width="390" height="844" />`
    : `<div class="shot-missing">${app.icon}</div>`
  return `
        <article class="tool" data-category="${escapeHtml(categoryName)}" data-keywords="${escapeHtml(
          `${app.name} ${app.desc} ${categoryName}`
        )}" data-slug="${app.slug}" data-name="${escapeHtml(app.name)}" data-desc="${escapeHtml(app.desc)}">
          <button class="tool-shot${hasShot ? '' : ' is-missing'}" type="button" aria-label="放大查看 ${escapeHtml(app.name)} 截图">
            ${shot}
            <span class="shot-flag">点击放大</span>
          </button>
          <div class="tool-body">
            <div class="tool-head">
              <span class="tool-icon">${app.icon}</span>
              <h4 class="tool-name">${escapeHtml(app.name)}</h4>
            </div>
            <p class="tool-desc">${escapeHtml(app.desc)}</p>
            <span class="tool-tag">${escapeHtml(categoryName)}</span>
          </div>
        </article>`
}

function buildHtml() {
  const { apps, groups } = buildTools()
  const convertCount = apps.filter((app) => app.path.startsWith('convert/')).length
  const categories = groups.map((group) => ({ id: group.id, name: group.name }))

  const toolSections = groups
    .map(
      (group) => `
      <section class="group" id="group-${group.id}" data-group="${escapeHtml(group.name)}">
        <header class="group-head">
          <h3>${escapeHtml(group.name)}</h3>
          <p>${escapeHtml(group.intro)}</p>
        </header>
        <div class="tool-grid">${group.items.map((app) => toolCard(app, group.name)).join('')}
        </div>
      </section>`
    )
    .join('\n')

  const mainPages = [
    {
      slug: 'appstore',
      title: '应用商店',
      text: '全部工具按网格排列，支持名称 / 简介搜索与置顶收藏，置顶的工具会固定在最前面。'
    },
    {
      slug: 'settings',
      title: '设置',
      text: 'BMI 默认单位、单位换算的默认体系与结果体系、常见参照物开关，改一次全站生效。'
    },
    {
      slug: 'about',
      title: '关于',
      text: '应用说明与更新记录，每个版本新增、修复了什么一目了然。'
    }
  ]
    .map(
      (page) => `
          <figure class="page-card">
            <div class="phone">
              <div class="phone-notch"></div>
              <div class="phone-screen">
                ${shotExists(page.slug) ? `<img src="screenshots/${page.slug}.jpg" alt="${page.title}页面截图" loading="lazy" width="390" height="844" />` : `<div class="shot-missing">${page.title}</div>`}
              </div>
            </div>
            <figcaption>
              <h3>${page.title}</h3>
              <p>${page.text}</p>
            </figcaption>
          </figure>`
    )
    .join('')

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${SITE.name} · ${SITE.tagline}</title>
<meta name="description" content="${SITE.description}" />
<meta name="theme-color" content="#0a7cff" />
<meta property="og:title" content="${SITE.name} · ${SITE.tagline}" />
<meta property="og:description" content="${SITE.description}" />
<meta property="og:image" content="screenshots/appstore.jpg" />
<link rel="icon" type="image/png" href="assets/logo.png" />
<link rel="apple-touch-icon" href="assets/logo.png" />
<link rel="stylesheet" href="style.css" />
</head>
<body>
<!-- 本文件由 scripts/website.mjs 生成，请改脚本或 src 里的数据，不要直接改这里 -->
<header class="site-header">
  <a class="brand" href="#top">
    <img src="assets/logo.png" alt="${SITE.name} 图标" width="36" height="36" />
    <span>${SITE.name}</span>
  </a>
  <nav class="site-nav">
    <a href="#pages">主要页面</a>
    <a href="#tools">全部工具</a>
    <a href="#platforms">支持平台</a>
    <a href="#features">技术特性</a>
  </nav>
  <a class="ghost-btn" href="${SITE.repo}" target="_blank" rel="noopener">GitHub</a>
</header>

<main id="top">
  <section class="hero">
    <div class="hero-text">
      <p class="eyebrow">Taro 4 · React 18 · TypeScript</p>
      <h1>${SITE.name}</h1>
      <p class="hero-tagline">${SITE.tagline}</p>
      <p class="hero-desc">${SITE.description}</p>
      <div class="hero-actions">
        <a class="primary-btn" href="#tools">查看 ${apps.length} 个工具</a>
        <a class="ghost-btn" href="#pages">看界面截图</a>
      </div>
      <ul class="platform-badges">
        ${PLATFORMS.map((platform) => `<li>${platform.icon} ${platform.name}</li>`).join('\n        ')}
      </ul>
    </div>
    <div class="hero-visual">
      <div class="phone phone-lg">
        <div class="phone-notch"></div>
        <div class="phone-screen">
          ${shotExists('appstore') ? '<img src="screenshots/appstore.jpg" alt="应用商店首页截图" width="390" height="844" />' : '<div class="shot-missing">应用商店</div>'}
        </div>
      </div>
    </div>
  </section>

  <section class="stats">
    <div><strong>${apps.length}</strong><span>个工具</span></div>
    <div><strong>${convertCount}</strong><span>类单位换算</span></div>
    <div><strong>${PLATFORMS.length}</strong><span>个运行平台</span></div>
    <div><strong>100%</strong><span>本地计算</span></div>
  </section>

  <section class="section" id="pages">
    <header class="section-head">
      <h2>主要页面</h2>
      <p>首页、设置、关于三个 tab 页构成应用骨架，其余都是独立工具页。</p>
    </header>
    <div class="page-grid">${mainPages}
    </div>
  </section>

  <section class="section" id="tools">
    <header class="section-head">
      <h2>全部工具</h2>
      <p>按分类浏览，或直接搜索关键词（如「月供」「换算」「编号」）。</p>
    </header>
    <div class="tool-controls">
      <div class="chips" id="chips">
        <button class="chip is-active" type="button" data-filter="all">全部</button>
        ${categories.map((category) => `<button class="chip" type="button" data-filter="${escapeHtml(category.name)}">${escapeHtml(category.name)}</button>`).join('\n        ')}
      </div>
      <input id="search" class="search" type="search" placeholder="搜索工具名称或用途…" aria-label="搜索工具" />
    </div>
    <p class="search-empty" id="empty" hidden>没有匹配的工具，换个关键词试试。</p>
    <div id="groups">${toolSections}
    </div>
  </section>

  <section class="section" id="platforms">
    <header class="section-head">
      <h2>支持平台</h2>
      <p>同一套代码编译到 7 个小程序平台、H5 与 Android App（React Native）。</p>
    </header>
    <div class="platform-grid">
      ${PLATFORMS.map(
        (platform) => `<div class="platform-card"><span class="platform-icon">${platform.icon}</span><h3>${platform.name}</h3><p>${platform.note}</p></div>`
      ).join('\n      ')}
    </div>
  </section>

  <section class="section" id="features">
    <header class="section-head">
      <h2>技术特性</h2>
      <p>从 uni-app x 版 magic-tools-lite 迁移重构而来，业务逻辑与交互保持一致。</p>
    </header>
    <div class="feature-grid">
      ${FEATURES.map(
        (feature) => `<div class="feature-card"><span class="feature-icon">${feature.icon}</span><h3>${feature.title}</h3><p>${feature.text}</p></div>`
      ).join('\n      ')}
    </div>
  </section>
</main>

<footer class="site-footer">
  <div class="footer-brand">
    <img src="assets/logo.png" alt="" width="28" height="28" />
    <span>${SITE.name}</span>
  </div>
  <p>开源项目，${SITE.license} License · 截图由无头 Chrome 渲染 H5 产物自动生成</p>
  <p><a href="${SITE.repo}" target="_blank" rel="noopener">${SITE.repo.replace('https://', '')}</a></p>
</footer>

<div class="lightbox" id="lightbox" hidden>
  <div class="lightbox-inner" role="dialog" aria-modal="true" aria-labelledby="lightbox-name">
    <button class="lightbox-close" id="lightbox-close" type="button" aria-label="关闭">×</button>
    <button class="lightbox-nav prev" id="lightbox-prev" type="button" aria-label="上一张">‹</button>
    <figure>
      <img id="lightbox-img" alt="" width="390" height="844" />
      <figcaption>
        <strong id="lightbox-name"></strong>
        <span id="lightbox-desc"></span>
      </figcaption>
    </figure>
    <button class="lightbox-nav next" id="lightbox-next" type="button" aria-label="下一张">›</button>
  </div>
</div>

<script src="main.js"></script>
</body>
</html>
`
}

// ---------------------------------------------------------------- 输出

fs.mkdirSync(path.join(docsDir, 'assets'), { recursive: true })

const logoSrc = path.join(root, 'src', 'static', 'logo.png')
if (fs.existsSync(logoSrc)) {
  fs.copyFileSync(logoSrc, path.join(docsDir, 'assets', 'logo.png'))
} else {
  console.warn('未找到 src/static/logo.png，官网图标留空')
}

const html = buildHtml()
fs.writeFileSync(path.join(docsDir, 'index.html'), html)

const { apps } = buildTools()
const missing = apps.filter((app) => !shotExists(app.slug))
console.log(`官网已生成：docs/index.html（${apps.length} 个工具，${(html.length / 1024).toFixed(1)} KB）`)
if (missing.length > 0) {
  console.warn(`缺少截图 ${missing.length} 张：${missing.map((app) => app.slug).join(', ')}`)
  console.warn('先跑 `just build-h5 && just shots` 再重新生成。')
}

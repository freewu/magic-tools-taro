// Magic 工具箱官网交互：主题切换 / 首屏截图热点 / 工具搜索 / 分类筛选 / 截图灯箱
// （docs/index.html 由 scripts/website.mjs 生成，本文件手写维护）

(function () {
  // ---------------------------------------------------------------- 主题

  // 首帧的主题已在 index.html 的内联脚本里定好（此处只负责切换与跟随系统）
  const THEME_KEY = 'magic-tools-docs-theme'
  const root = document.documentElement
  const themeToggle = document.getElementById('theme-toggle')
  const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null

  function applyTheme(theme) {
    root.dataset.theme = theme
    root.style.colorScheme = theme
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false')
    }
  }

  function currentTheme() {
    return root.dataset.theme === 'dark' ? 'dark' : 'light'
  }

  function savedTheme() {
    try {
      const value = localStorage.getItem(THEME_KEY)
      return value === 'dark' || value === 'light' ? value : ''
    } catch (error) {
      return ''
    }
  }

  if (themeToggle) {
    applyTheme(currentTheme())
    themeToggle.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      try {
        localStorage.setItem(THEME_KEY, next)
      } catch (error) {
        // 隐私模式下写入失败也不影响本次切换
      }
    })
  }

  // 没有手动选过时，系统主题变了就跟着变
  if (media) {
    const onSystemChange = (event) => {
      if (savedTheme() === '') {
        applyTheme(event.matches ? 'dark' : 'light')
      }
    }
    if (media.addEventListener) {
      media.addEventListener('change', onSystemChange)
    } else if (media.addListener) {
      media.addListener(onSystemChange)
    }
  }

  // ---------------------------------------------------------------- 首屏热点

  // 首屏手机里是应用商店首页的截图，每个工具图标都是一个热点：
  // 点了把手机画面切成那个工具的截图，底部小字同步显示名称与简介。
  const heroShot = document.getElementById('hero-shot')
  const heroPhone = document.getElementById('hero-phone')
  const heroHotspots = Array.from(document.querySelectorAll('#hero-hotspots .hotspot'))
  const captionIcon = document.getElementById('hero-caption-icon')
  const captionText = document.getElementById('hero-caption-text')
  const captionBack = document.getElementById('hero-caption-back')

  // 默认画面（应用商店首页）与提示文案
  const HOME_SHOT = { src: 'screenshots/appstore.jpg', alt: '应用商店首页截图' }
  const HINT_ICON = '👆'
  const HINT_TEXT = '点图标，直接看对应工具的界面'

  /** 预览某个工具：换图 + 收起热点（此时热点位置已经对不上新图了） */
  function previewTool(hotspot) {
    heroShot.src = hotspot.dataset.shot
    heroShot.alt = `${hotspot.dataset.name} 界面截图`
    captionIcon.textContent = hotspot.dataset.icon || '📱'
    captionText.textContent = `${hotspot.dataset.name} · ${hotspot.dataset.desc}`
    captionBack.hidden = false
    heroPhone.classList.add('is-preview')
  }

  /** 回到应用商店首页 */
  function previewHome() {
    heroShot.src = HOME_SHOT.src
    heroShot.alt = HOME_SHOT.alt
    captionIcon.textContent = HINT_ICON
    captionText.textContent = HINT_TEXT
    captionBack.hidden = true
    heroPhone.classList.remove('is-preview')
  }

  // 悬停 / 聚焦就预取，点下去立刻出图
  const preloaded = new Set()
  function preload(hotspot) {
    const src = hotspot.dataset.shot
    if (!src || preloaded.has(src)) {
      return
    }
    preloaded.add(src)
    const img = new Image()
    img.src = src
  }

  if (heroShot && heroHotspots.length > 0) {
    for (const hotspot of heroHotspots) {
      hotspot.addEventListener('click', () => previewTool(hotspot))
      hotspot.addEventListener('pointerenter', () => preload(hotspot))
      hotspot.addEventListener('focus', () => preload(hotspot))
    }
    if (captionBack) {
      captionBack.addEventListener('click', previewHome)
    }
  }

  // ---------------------------------------------------------------- 筛选
  const chips = Array.from(document.querySelectorAll('#chips .chip'))
  const search = document.getElementById('search')
  const empty = document.getElementById('empty')
  const groups = Array.from(document.querySelectorAll('.group'))
  const cards = Array.from(document.querySelectorAll('.tool'))

  let activeFilter = 'all'
  let keyword = ''

  /** 按分类 + 关键词过滤卡片，空分类整组隐藏 */
  function applyFilter() {
    let visible = 0
    for (const card of cards) {
      const category = card.dataset.category || ''
      const keywords = (card.dataset.keywords || '').toLowerCase()
      const matchCategory = activeFilter === 'all' || category === activeFilter
      const matchKeyword = keyword === '' || keywords.indexOf(keyword) >= 0
      const show = matchCategory && matchKeyword
      card.hidden = !show
      if (show) {
        visible += 1
      }
    }
    for (const group of groups) {
      const hasVisible = group.querySelector('.tool:not([hidden])') !== null
      group.hidden = !hasVisible
    }
    if (empty) {
      empty.hidden = visible > 0
    }
  }

  for (const chip of chips) {
    chip.addEventListener('click', () => {
      activeFilter = chip.dataset.filter || 'all'
      for (const item of chips) {
        item.classList.toggle('is-active', item === chip)
      }
      applyFilter()
    })
  }

  if (search) {
    search.addEventListener('input', () => {
      keyword = search.value.trim().toLowerCase()
      applyFilter()
    })
  }

  // ---------------------------------------------------------------- 灯箱

  const lightbox = document.getElementById('lightbox')
  const lightboxImg = document.getElementById('lightbox-img')
  const lightboxName = document.getElementById('lightbox-name')
  const lightboxDesc = document.getElementById('lightbox-desc')
  const btnClose = document.getElementById('lightbox-close')
  const btnPrev = document.getElementById('lightbox-prev')
  const btnNext = document.getElementById('lightbox-next')

  let current = -1

  /** 当前可见（筛选后）的、有截图的卡片，作为上一张 / 下一张的顺序 */
  const visibleCards = () => cards.filter((card) => !card.hidden && !card.querySelector('.tool-shot.is-missing'))

  function show(index) {
    const list = visibleCards()
    if (list.length === 0) {
      return
    }
    current = (index + list.length) % list.length
    const card = list[current]
    const slug = card.dataset.slug
    lightboxImg.src = 'screenshots/' + slug + '.jpg'
    lightboxImg.alt = card.dataset.name + ' 界面截图'
    lightboxName.textContent = card.dataset.name
    lightboxDesc.textContent = card.dataset.desc
    const showNav = list.length > 1
    btnPrev.hidden = !showNav
    btnNext.hidden = !showNav
  }

  function open(card) {
    const list = visibleCards()
    show(list.indexOf(card))
    lightbox.hidden = false
    document.body.classList.add('is-lightbox-open')
    btnClose.focus()
  }

  function close() {
    lightbox.hidden = true
    document.body.classList.remove('is-lightbox-open')
    current = -1
  }

  for (const card of cards) {
    const shot = card.querySelector('.tool-shot')
    if (!shot || shot.classList.contains('is-missing')) {
      continue
    }
    shot.addEventListener('click', () => open(card))
  }

  btnClose.addEventListener('click', close)
  btnPrev.addEventListener('click', () => show(current - 1))
  btnNext.addEventListener('click', () => show(current + 1))
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      close()
    }
  })

  document.addEventListener('keydown', (event) => {
    if (lightbox.hidden) {
      return
    }
    if (event.key === 'Escape') {
      close()
    } else if (event.key === 'ArrowLeft') {
      show(current - 1)
    } else if (event.key === 'ArrowRight') {
      show(current + 1)
    }
  })

  // 触摸左右滑
  let touchX = null
  lightbox.addEventListener('touchstart', (event) => {
    touchX = event.touches[0].clientX
  })
  lightbox.addEventListener('touchend', (event) => {
    if (touchX === null) {
      return
    }
    const delta = event.changedTouches[0].clientX - touchX
    touchX = null
    if (Math.abs(delta) > 50) {
      show(current + (delta < 0 ? 1 : -1))
    }
  })

  applyFilter()
})()

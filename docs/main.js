// Magic 工具箱官网交互：主题切换 / 工具搜索 / 分类筛选 / 截图灯箱
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

export default defineAppConfig({
  pages: [
    'pages/appstore/index',
    'pages/ad/index',
    'pages/settings/index',
    'pages/about/index',
    'pages/app/rmb-converter/index',
    'pages/app/bmi/index',
    'pages/app/world-time/index',
    'pages/app/holiday2027/index',
    'pages/app/fuzzy-nickname/index',
    'pages/app/income-tax/index',
    'pages/app/mortgage/index',
    'pages/app/compound-interest/index',
    'pages/app/ganzhi/index',
    'pages/app/dynasties/index',
    'pages/app/safe-period/index',
    'pages/app/due-date/index',
    'pages/app/rate-calc/index',
    'pages/app/retirement-age/index',
    'pages/app/pension/index',
    'pages/app/blood-type/index',
    'pages/app/plate-city/index',
    'pages/app/id-card/index',
    'pages/app/lucky-wheel/index',
    'pages/app/bmr/index',
    'pages/app/hourly/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#007AFF',
    navigationBarTitleText: 'MagicToolsLite',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F8F8F8'
  },
  tabBar: {
    color: '#7A7E83',
    selectedColor: '#007AFF',
    borderStyle: 'black',
    backgroundColor: '#F8F8F8',
    list: [
      {
        pagePath: 'pages/appstore/index',
        iconPath: 'static/app-deactive.png',
        selectedIconPath: 'static/app-active.png',
        text: '应用'
      },
      {
        pagePath: 'pages/ad/index',
        iconPath: 'static/ad-deactive.png',
        selectedIconPath: 'static/ad-active.png',
        text: '广告'
      },
      {
        pagePath: 'pages/settings/index',
        iconPath: 'static/setting-deactive.png',
        selectedIconPath: 'static/setting-active.png',
        text: '设置'
      },
      {
        pagePath: 'pages/about/index',
        iconPath: 'static/about-deactive.png',
        selectedIconPath: 'static/about-active.png',
        text: '关于'
      }
    ]
  }
})

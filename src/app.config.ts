export default defineAppConfig({
  pages: [
    'pages/appstore/index',
    'pages/ad/index',
    'pages/settings/index',
    'pages/about/index',
    'pages/app/rmb-converter/index',
    'pages/app/bmi/index'
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

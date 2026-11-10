// 工具页底部菜单的数据：复制首页 tabBar 的其余各项，方便在任意应用内直接切换
// （广告入口当前隐藏，与 app.config.ts 的 tabBar 保持一致；恢复时把注释打开）

import appIcon from '../../static/app-deactive.png'
// import adIcon from '../../static/ad-deactive.png'
import aboutIcon from '../../static/about-deactive.png'
import settingIcon from '../../static/setting-deactive.png'

export type MenuItem = {
  label: string
  icon: string
  url: string
}

export const menuItems: MenuItem[] = [
  { label: '应用', icon: appIcon, url: '/pages/appstore/index' },
  // { label: '广告', icon: adIcon, url: '/pages/ad/index' },
  { label: '设置', icon: settingIcon, url: '/pages/settings/index' },
  { label: '关于', icon: aboutIcon, url: '/pages/about/index' }
]

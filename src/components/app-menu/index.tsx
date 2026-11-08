// 工具页底部菜单：复制首页 tabBar 的四项，方便在任意应用内直接切换

import Taro from '@tarojs/taro'
import { Image, Text, View } from '@tarojs/components'

import aboutIcon from '../../static/about-deactive.png'
import adIcon from '../../static/ad-deactive.png'
import appIcon from '../../static/app-deactive.png'
import settingIcon from '../../static/setting-deactive.png'

import './index.scss'

type MenuItem = {
  label: string
  icon: string
  url: string
}

const menuItems: MenuItem[] = [
  { label: '应用', icon: appIcon, url: '/pages/appstore/index' },
  { label: '广告', icon: adIcon, url: '/pages/ad/index' },
  { label: '设置', icon: settingIcon, url: '/pages/settings/index' },
  { label: '关于', icon: aboutIcon, url: '/pages/about/index' }
]

export default function AppMenu() {
  // tabBar 页面必须用 switchTab 切换，navigateTo 会失败
  const open = (url: string) => {
    Taro.switchTab({ url })
  }

  return (
    <View className='app-menu'>
      {menuItems.map((item) => (
        <View className='menu-cell' key={item.url} hoverClass='menu-cell-hover' onClick={() => open(item.url)}>
          <Image className='menu-icon' src={item.icon} mode='aspectFit' />
          <Text className='menu-label'>{item.label}</Text>
        </View>
      ))}
    </View>
  )
}

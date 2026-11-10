import Taro from '@tarojs/taro'
import { Image, Text, View } from '@tarojs/components'

import { menuItems } from './items'

import './index.scss'

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

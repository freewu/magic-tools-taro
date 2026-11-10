import Taro from '@tarojs/taro'
import { Image, Text, View } from '@tarojs/components'

import { menuItems } from './items'

import './index.scss'

/**
 * RN 版本：RN（Yoga）不支持 `position: fixed`，写成 fixed 会被当成 relative
 * 排进正常布局流，菜单就会「卡在页面内容中间」。所以 RN 端改成普通 flex 子节点，
 * 由 components/page-with-menu 的 RN 版本负责把内容区撑开、让菜单贴在屏幕底部。
 */
export default function AppMenu() {
  // tabBar 页面必须用 switchTab 切换，navigateTo 会失败
  const open = (url: string) => {
    Taro.switchTab({ url })
  }

  return (
    <View className='app-menu-rn'>
      {menuItems.map((item) => (
        <View className='menu-cell' key={item.url} hoverClass='menu-cell-hover' onClick={() => open(item.url)}>
          <Image className='menu-icon' src={item.icon} mode='aspectFit' />
          <Text className='menu-label'>{item.label}</Text>
        </View>
      ))}
    </View>
  )
}

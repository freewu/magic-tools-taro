import { useNavigation } from '@react-navigation/native'
import Taro from '@tarojs/taro'
import { Image, Text, View } from '@tarojs/components'
import { StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { menuItems } from './items'

// 尺寸全部对齐 Taro RN 端的系统 tabBar（@tarojs/router-rn/dist/view/TabBar.js + TabBarItem.js），
// 保证工具页底部菜单和首页 tabBar 长得一模一样：
// 高度 55 + 底部安全区（最少 5）、图标 25、标签 12 号字 + 上间距 5、顶部 hairline 边框。
const TAB_BAR_HEIGHT = 55
const ICON_SIZE = 25
const LABEL_SIZE = 12
const MIN_BOTTOM_PADDING = 5
const INACTIVE_COLOR = '#7A7E83'

const cellStyle = {
  flex: 1,
  height: '100%',
  marginTop: 5,
  alignItems: 'center',
  justifyContent: 'center'
} as const

// Taro 的 View style 类型是 Web 的 CSSProperties，不认识 RN 专有的 elevation，这里放宽类型
const barStyle: any = {
  flexDirection: 'row',
  backgroundColor: '#F8F8F8',
  borderTopWidth: StyleSheet.hairlineWidth,
  borderTopColor: '#000000',
  elevation: 8
}

/**
 * RN 版本：RN（Yoga）不支持 `position: fixed`，写成 fixed 会被当成 relative
 * 排进正常布局流，菜单就会「卡在页面内容中间」。所以 RN 端改成普通 flex 子节点，
 * 由 components/page-with-menu 的 RN 版本负责把内容区撑开、让菜单贴在屏幕底部。
 */
export default function AppMenu() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const paddingBottom = Math.max(insets.bottom, MIN_BOTTOM_PADDING)

  // tabBar 页面必须用 switchTab 切换，navigateTo 会失败
  const open = (url: string) => {
    // Taro 从工具页切 tab 的做法是 popToTop + replace('tabNav')，默认会播一次关闭（滑动）
    // 动画；而首页点 tab 是瞬时切换。这里先把当前页的关闭动画时长设为 0，切起来就和 tabBar 一致。
    try {
      ;(navigation as any).setOptions({
        transitionSpec: { close: { animation: 'timing', config: { duration: 0 } } }
      })
    } catch {
      // 拿不到 navigation（例如不在 stack 里）就保持默认动画，不影响切换
    }
    // 让 setOptions 先生效，再发起跳转
    setTimeout(() => Taro.switchTab({ url }), 0)
  }

  return (
    <View
      style={{
        ...barStyle,
        height: TAB_BAR_HEIGHT + paddingBottom,
        paddingBottom
      }}
    >
      {menuItems.map((item) => (
        <View key={item.url} style={cellStyle} onClick={() => open(item.url)}>
          <Image src={item.icon} style={{ width: ICON_SIZE, height: ICON_SIZE }} />
          <Text style={{ fontSize: LABEL_SIZE, marginTop: 5, color: INACTIVE_COLOR }}>{item.label}</Text>
        </View>
      ))}
    </View>
  )
}

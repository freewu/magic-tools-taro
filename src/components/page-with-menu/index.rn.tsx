import type { PropsWithChildren } from 'react'
import { ScrollView, View } from '@tarojs/components'

import AppMenu from '../app-menu'

/**
 * 工具页外壳（RN 版）。
 *
 * RN 的 Yoga 只支持 position: relative / absolute，写 `position: fixed` 会被当成
 * relative 排进内容流——底部导航因此「卡」在页面中间。RN 的正确做法是把页面拆成
 * 上下两块：内容区自己滚动（flex: 1），底部导航作为固定高度的兄弟节点。
 *
 * 配套要求：这些页面在 RN 端的 pageConfig 里设置了 disableScroll: true，
 * 否则 Taro 会给整个页面套一层 ScrollView，里面再套 ScrollView 就撑不起高度了
 * （见各页面 index.config.ts）。
 */
export default function PageWithMenu({ children }: PropsWithChildren<any>) {
  return (
    <View className='page-with-menu-rn'>
      <ScrollView className='page-with-menu-body' scrollY>
        {children}
      </ScrollView>
      <AppMenu />
    </View>
  )
}

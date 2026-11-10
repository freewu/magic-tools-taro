import type { PropsWithChildren } from 'react'
import { View } from '@tarojs/components'

import AppMenu from '../app-menu'

/**
 * 工具页外壳：内容区 + 固定在底部的 AppMenu。
 * 非 RN 端（小程序 / H5）就是一层普通容器，AppMenu 自己用 position: fixed 贴底。
 * RN 端见 index.rn.tsx（RN 没有 fixed，得换成 flex 布局）。
 */
export default function PageWithMenu({ children }: PropsWithChildren<any>) {
  return (
    <View className='page-with-menu'>
      {children}
      <AppMenu />
    </View>
  )
}

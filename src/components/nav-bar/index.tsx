// 顶部导航栏：H5 没有原生导航栏，这里补一条「返回 + 标题」；
// 小程序 / RN 有系统导航栏，组件直接不渲染，避免出现双标题。

import Taro from '@tarojs/taro'
import { Text, View } from '@tarojs/components'

import './index.scss'

type NavBarProps = {
  /** 标题文案，一般与页面 config 的 navigationBarTitleText 一致 */
  title: string
  /** 是否显示返回箭头；tab 页传 false */
  back?: boolean
}

/** 首页路由：没有历史记录时（例如直接打开 H5 链接）回退到它 */
const HOME_URL = '/pages/appstore/index'

export default function NavBar({ title, back = true }: NavBarProps) {
  // 只有 H5 需要自己画导航栏
  if (process.env.TARO_ENV !== 'h5') {
    return null
  }

  const goBack = () => {
    // 从首页直接进来时没有上一页，navigateBack 会失败，退回首页
    if (Taro.getCurrentPages().length > 1) {
      Taro.navigateBack()
      return
    }
    Taro.switchTab({ url: HOME_URL })
  }

  return (
    <>
      {/* 固定定位的导航栏 + 等高的占位块，页面内容不会被盖住 */}
      <View className='nav-bar'>
        <View className='nav-side' onClick={back ? goBack : undefined}>
          {back && <View className='nav-back' />}
        </View>
        <Text className='nav-title'>{title}</Text>
        <View className='nav-side' />
      </View>
      <View className='nav-placeholder' />
    </>
  )
}

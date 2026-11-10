import type { PropsWithChildren } from 'react'
import Provider from '@ant-design/react-native/lib/provider'

/**
 * RN 端专门的一层 Ant Design Provider。
 *
 * Taro RN 的 Picker / DatePicker 底层是 @ant-design/react-native 的 Picker，
 * 它弹出的选择面板走 antd 自己的 Portal（ModalView 默认 modalType='portal'），
 * 而 Portal 需要有 Portal.Host 才能渲染——没有 Provider 包裹时 PortalConsumer
 * 直接抛错、弹层渲染成 null，表现出来就是「点击选择器完全没反应」。
 *
 * Provider 内部会在缺少 Portal.Host 时自动挂一个，顺带提供主题 / 语言上下文。
 * 小程序 / H5 端用 index.tsx 的透传实现，不会被打进包里。
 */
export default function AntdProvider({ children }: PropsWithChildren<any>) {
  return <Provider>{children}</Provider>
}

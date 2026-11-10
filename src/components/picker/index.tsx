import { cloneElement, isValidElement, type ReactNode } from 'react'
import { Picker, View } from '@tarojs/components'

interface TriggerProps {
  onPress?: (e?: any) => void
  children?: ReactNode
}

/**
 * Ant Design 的 Picker 通过 React.cloneElement 给子元素注入 onPress 来展开弹层
 * （见 @tarojs/components-rn/dist/components/Picker 的注释：子组件要支持绑定 onPress），
 * 而 Taro RN 的 View 只实现了 onClick，onPress 会被直接丢掉。
 *
 * 这里作为 antd Picker 的「子元素」接住它注入的 onPress，再转成 onClick。
 * 非 RN 端（小程序 / H5）不会注入 onPress，此时原样返回 children，不影响布局。
 */
function Trigger({ onPress, children }: TriggerProps) {
  if (!onPress) {
    return <>{children}</>
  }

  if (isValidElement(children)) {
    return cloneElement(children as any, { onClick: onPress })
  }

  return <View onClick={onPress}>{children}</View>
}

/**
 * Picker 的统一出口：只用加一层 Trigger 把 onPress 转成 onClick，
 * 其余 props 与 children 原样透传给 Taro 的 Picker，各端行为保持一致。
 */
export default function AppPicker(props: any) {
  const { children, ...rest } = props

  return (
    <Picker {...rest}>
      <Trigger>{children}</Trigger>
    </Picker>
  )
}

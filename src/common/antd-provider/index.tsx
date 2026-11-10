import type { PropsWithChildren } from 'react'

// 非 RN 端（小程序 / H5）用的是各平台原生选择器，不涉及 Ant Design 的弹层，
// 所以这里保持透传，不影响布局（真实实现在 index.rn.tsx）。
export default function AntdProvider({ children }: PropsWithChildren<any>) {
  return <>{children}</>
}

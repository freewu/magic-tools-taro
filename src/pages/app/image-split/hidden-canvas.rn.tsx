// RN 端占位：@tarojs/components-rn 没有 Canvas 组件，图片分割在 RN 直接不支持，
// 页面里也用不到这块离屏画布，这里渲染 null 即可（保持页面代码两端一致）。

type Props = {
  /** 画布 id：小程序 / H5 端用，RN 端忽略 */
  canvasId: string
}

export default function HiddenCanvas(_props: Props) {
  return null
}

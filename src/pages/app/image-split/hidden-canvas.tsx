// 小程序 / H5 端的分割用离屏画布。
//
// 单独抽成一个组件，是为了让 RN 端能换成 hidden-canvas.rn.tsx：
// @tarojs/components-rn 里没有 Canvas 组件，直接在页面里 import Canvas
// 会让 Metro 解析不到模块、整个包打不出来。所以页面只引入本文件，
// Metro 会优先命中 .rn.tsx，小程序 / H5 走这里。

import { Canvas } from '@tarojs/components'

type Props = {
  /** 画布 id：取 canvas node 时用 */
  canvasId: string
}

export default function HiddenCanvas({ canvasId }: Props) {
  return (
    <Canvas className='hidden-canvas' id={canvasId} canvasId={canvasId} type='2d' />
  )
}

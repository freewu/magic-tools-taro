// RN 端的切片实现：@tarojs/components-rn 与 @tarojs/taro-rn 都没有 canvas / 媒体能力
// （taro-rn 的 media、canvasToTempFilePath 依赖 expo-image-picker、expo-camera 等原生模块，
// 本项目没有引入），所以 Android 端只做展示与参数预览，不真正切图。
//
// 这里保持与 slice.ts 一致的导出，页面代码两端共用；isRN 为 true 时页面会把
// 生成结果区域换成提示文案。

export type SliceOptions = {
  sourcePath: string
  rects: SplitRectLike[]
  outWidth: number
  format: number
  prefix: string
  numberMode: number
  ext: string
  /** 隐藏 canvas 的选择器（小程序 / App 用） */
  canvasId: string
}

type SplitRectLike = {
  index: number
  x: number
  y: number
  width: number
  height: number
}

type PieceLike = {
  index: number
  name: string
  width: number
  height: number
  path: string
}

const notSupported = 'Android 端暂不支持切图，请用微信小程序或网页版'

export const isWeb = false
export const isRN = true

/** RN 端拿不到图片尺寸，交给页面提示重新选图（选图本身也不可用） */
export function imageSizeOf(_path: string): Promise<{ width: number; height: number }> {
  return Promise.reject(new Error(notSupported))
}

/** RN 端不提供选图 */
export function pickImagePath(): Promise<string> {
  return Promise.reject(new Error(notSupported))
}

/** RN 端不切图 */
export function sliceImage(_options: SliceOptions): Promise<PieceLike[]> {
  return Promise.reject(new Error(notSupported))
}

/** RN 端不能保存图片 */
export function savePieceImage(_piece: PieceLike): Promise<string> {
  return Promise.reject(new Error(notSupported))
}

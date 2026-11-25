// 图片切片的平台实现：lib.ts 只算矩形与文件名，这里负责真正把像素裁出来。
//
// · H5：走 DOM canvas（document.createElement），导出 data URL，可直接点链接下载。
// · 小程序 / App（weapp / jd / tt / qq / ...）：页面里放一张隐藏的 2d canvas，
//   用 SelectorQuery 拿到 node，逐块 drawImage 后 canvasToTempFilePath 导出临时文件。
// · RN：没有任何 canvas 能力，生成切片直接给出提示（尺寸、矩形、编号照常展示）。

import Taro from '@tarojs/taro'

import { FORMAT_JPEG, JPEG_QUALITY, outputSizeOf, pieceName } from './lib'
import type { Piece, SplitRect } from './lib'

export type SliceOptions = {
  sourcePath: string
  rects: SplitRect[]
  outWidth: number
  format: number
  prefix: string
  numberMode: number
  ext: string
  /** 隐藏 canvas 的选择器（小程序 / App 用） */
  canvasId: string
}

const isWeb = process.env.TARO_ENV === 'h5'
const isRN = process.env.TARO_ENV === 'rn'

/** 读原图尺寸；失败时抛错 */
export async function imageSizeOf(path: string): Promise<{ width: number; height: number }> {
  const info = await Taro.getImageInfo({ src: path })
  return { width: info.width, height: info.height }
}

/** 选一张图，返回临时路径 / blob URL；取消时返回空字符串 */
export async function pickImagePath(): Promise<string> {
  const res = await Taro.chooseImage({ count: 1 })
  const paths = res.tempFilePaths ?? []
  if (paths.length === 0) {
    return ''
  }
  return paths[0]
}

// ---------------------------------------------------------------- H5

function drawOnDomCanvas(source: HTMLImageElement, rect: SplitRect, outWidth: number, format: number): Piece {
  const out = outputSizeOf(rect, outWidth)
  const canvas = document.createElement('canvas')
  canvas.width = out.width
  canvas.height = out.height
  const ctx = canvas.getContext('2d')
  if (ctx == null) {
    throw new Error('浏览器不支持 canvas，换个浏览器试试')
  }
  let path = ''
  if (format === FORMAT_JPEG) {
    // JPEG 没有透明通道，先铺白底，避免透明区域变黑
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, out.width, out.height)
    ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, out.width, out.height)
    path = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  } else {
    ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, out.width, out.height)
    path = canvas.toDataURL('image/png')
  }
  return { index: rect.index, name: '', width: out.width, height: out.height, path }
}

function sliceOnWeb(options: SliceOptions): Promise<Piece[]> {
  return new Promise<Piece[]>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        const list: Piece[] = []
        for (let i = 0; i < options.rects.length; i++) {
          const rect = options.rects[i]
          const piece = drawOnDomCanvas(img, rect, options.outWidth, options.format)
          piece.name = pieceName(options.prefix, rect, options.rects.length, options.numberMode, options.ext)
          list.push(piece)
        }
        resolve(list)
      } catch (error) {
        reject(error instanceof Error ? error : new Error('切图失败，换张图试试'))
      }
    }
    img.onerror = () => reject(new Error('图片加载失败，重新选一次图片'))
    img.src = options.sourcePath
  })
}

// ---------------------------------------------------------------- 小程序 / App

/** 取隐藏 canvas 的 2d 节点；node 还没挂载好时重试几次 */
function canvasNodeOf(canvasId: string, retries: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const query = Taro.createSelectorQuery()
    query
      .select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec((res) => {
        const node = res && res[0] ? (res[0] as { node?: unknown }).node : null
        if (node != null) {
          resolve(node)
          return
        }
        if (retries <= 0) {
          reject(new Error('画布初始化失败，返回重进这一页再试'))
          return
        }
        setTimeout(() => {
          canvasNodeOf(canvasId, retries - 1)
            .then(resolve)
            .catch(reject)
        }, 100)
      })
  })
}

type MiniCanvas = {
  width: number
  height: number
  getContext: (type: string) => unknown
  createImage: () => {
    src: string
    onload: () => void
    onerror: () => void
  }
}

type MiniContext = {
  fillStyle: string
  fillRect: (x: number, y: number, w: number, h: number) => void
  drawImage: (...args: unknown[]) => void
}

async function sliceOnMini(options: SliceOptions): Promise<Piece[]> {
  const node = (await canvasNodeOf(options.canvasId, 20)) as MiniCanvas
  const ctx = node.getContext('2d') as MiniContext | null
  if (ctx == null) {
    throw new Error('画布初始化失败，返回重进这一页再试')
  }
  const list: Piece[] = []
  for (let i = 0; i < options.rects.length; i++) {
    const rect = options.rects[i]
    const out = outputSizeOf(rect, options.outWidth)
    node.width = out.width
    node.height = out.height
    if (options.format === FORMAT_JPEG) {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, out.width, out.height)
    }
    // 小程序 2d canvas 的 drawImage 直接吃图片路径
    ctx.drawImage(options.sourcePath, rect.x, rect.y, rect.width, rect.height, 0, 0, out.width, out.height)
    const res = await Taro.canvasToTempFilePath({
      // Taro 的类型要求 Canvas 实例，运行时其实就是上面拿到的 canvas node
      canvas: node as never,
      x: 0,
      y: 0,
      width: out.width,
      height: out.height,
      destWidth: out.width,
      destHeight: out.height,
      fileType: options.format === FORMAT_JPEG ? 'jpg' : 'png',
      quality: JPEG_QUALITY
    })
    list.push({
      index: rect.index,
      name: pieceName(options.prefix, rect, options.rects.length, options.numberMode, options.ext),
      width: out.width,
      height: out.height,
      path: res.tempFilePath
    })
  }
  return list
}

// ---------------------------------------------------------------- 对外

/** 按矩形切图，返回每块的文件名与路径 */
export function sliceImage(options: SliceOptions): Promise<Piece[]> {
  if (isRN) {
    return Promise.reject(new Error('RN 端暂不支持切图，请用小程序或网页版'))
  }
  if (isWeb) {
    return sliceOnWeb(options)
  }
  return sliceOnMini(options)
}

/** 保存一块图：H5 触发浏览器下载，小程序 / App 存进相册 */
export async function savePieceImage(piece: Piece): Promise<string> {
  if (isWeb) {
    const link = document.createElement('a')
    link.href = piece.path
    link.download = piece.name
    link.click()
    return `已开始下载 ${piece.name}`
  }
  await Taro.saveImageToPhotosAlbum({ filePath: piece.path })
  return '已保存到相册'
}

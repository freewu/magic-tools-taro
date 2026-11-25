// 图片分割：把一张图按 2 / 3 / 4 / 6 / 9 份切成整齐的小图。
// 纯逻辑，不依赖界面：只算「切多少行多少列」「每块的像素矩形」「输出文件名」，真正的裁剪在 slice.ts 里用 canvas 完成。
//
// 尺寸约定（参考常见实现）：
//   · 宽 / 高不能整除时，余数像素按四舍五入分配到前几块，各块最多相差 1 像素，
//     把所有块按顺序拼回去与原图完全一致（不丢像素、不重叠）。
//   · 每块输出宽度 0 表示保持原分辨率；填正整数时等比缩放到该宽度。

import { readStorage, writeStorage } from '../../../common/storage'

/** 可选拆分份数 */
export const SPLIT_COUNTS: number[] = [2, 3, 4, 6, 9]

/** 一种拆分方式：几行几列 + 展示名 */
export type SplitLayout = {
  rows: number
  cols: number
  name: string
}

/** 份数对应的可选方向；2 / 3 / 6 份有两种切法，4 / 9 份只有一种 */
export function layoutsOf(count: number): SplitLayout[] {
  if (count === 2) {
    return [
      { rows: 1, cols: 2, name: '左右' },
      { rows: 2, cols: 1, name: '上下' }
    ]
  }
  if (count === 3) {
    return [
      { rows: 1, cols: 3, name: '一行三列' },
      { rows: 3, cols: 1, name: '一列三行' }
    ]
  }
  if (count === 4) {
    return [{ rows: 2, cols: 2, name: '两行两列' }]
  }
  if (count === 6) {
    return [
      { rows: 2, cols: 3, name: '两行三列' },
      { rows: 3, cols: 2, name: '三行两列' }
    ]
  }
  if (count === 9) {
    return [{ rows: 3, cols: 3, name: '三行三列' }]
  }
  return [{ rows: 1, cols: 1, name: '不分割' }]
}

/** 一块的输出矩形（原图像素坐标） */
export type SplitRect = {
  index: number
  row: number
  col: number
  x: number
  y: number
  width: number
  height: number
}

/** 把 total 像素切成 parts 段：商均分，余数四舍五入后分给前几段 */
export function segmentSizes(total: number, parts: number): number[] {
  const sizes: number[] = []
  if (parts <= 0) {
    return sizes
  }
  const base = Math.floor(total / parts)
  const rest = total - base * parts
  for (let i = 0; i < parts; i++) {
    sizes.push(base + (i < rest ? 1 : 0))
  }
  return sizes
}

/** 按行优先（从左到右、从上到下）算出每块的矩形 */
export function splitRects(imageWidth: number, imageHeight: number, rows: number, cols: number): SplitRect[] {
  const rects: SplitRect[] = []
  if (imageWidth <= 0 || imageHeight <= 0 || rows <= 0 || cols <= 0) {
    return rects
  }
  const widths = segmentSizes(imageWidth, cols)
  const heights = segmentSizes(imageHeight, rows)
  let index = 0
  let y = 0
  for (let r = 0; r < rows; r++) {
    let x = 0
    for (let c = 0; c < cols; c++) {
      rects.push({ index, row: r + 1, col: c + 1, x, y, width: widths[c], height: heights[r] })
      index += 1
      x += widths[c]
    }
    y += heights[r]
  }
  return rects
}

/** 「640 × 480」这类尺寸文本 */
export function sizeTextOf(width: number, height: number): string {
  if (width <= 0 || height <= 0) {
    return '未知尺寸'
  }
  return `${width} × ${height}`
}

// ---------------------------------------------------------------- 命名

/** 编号方式 */
export const NUMBER_SEQUENTIAL = 0
export const NUMBER_ROW_COL = 1
export const NUMBER_NAMES: string[] = ['顺序编号', '行列编号']

/** 去掉文件名里不能用的字符，并丢掉可能带的扩展名 */
export function sanitizePrefix(text: string): string {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    const c = text.substring(i, i + 1)
    if (
      c === '/' ||
      c === '\\' ||
      c === ':' ||
      c === '*' ||
      c === '?' ||
      c === '"' ||
      c === '<' ||
      c === '>' ||
      c === '|' ||
      c === '\n' ||
      c === '\r' ||
      c === '\t'
    ) {
      continue
    }
    out += c
  }
  // 去掉扩展名
  const dot = out.lastIndexOf('.')
  if (dot > 0 && out.length - dot <= 5) {
    out = out.substring(0, dot)
  }
  out = out.trim()
  return out === '' ? 'image' : out
}

/** 补零：总块数超过 9 时编号补成两位 */
export function padIndex(index: number, total: number): string {
  if (total > 9 && index < 10) {
    return `0${index}`
  }
  return `${index}`
}

/** 一块的文件名：顺序编号 image_1.png / 行列编号 image_r1c1.png */
export function pieceName(prefix: string, rect: SplitRect, total: number, numberMode: number, ext: string): string {
  const safe = sanitizePrefix(prefix)
  if (numberMode === NUMBER_ROW_COL) {
    return `${safe}_r${rect.row}c${rect.col}.${ext}`
  }
  return `${safe}_${padIndex(rect.index + 1, total)}.${ext}`
}

// ---------------------------------------------------------------- 输出

export const FORMAT_PNG = 0
export const FORMAT_JPEG = 1
export const FORMAT_NAMES: string[] = ['PNG', 'JPEG']
export const FORMAT_EXTS: string[] = ['png', 'jpg']
/** JPEG 质量（固定值，和原项目一致） */
export const JPEG_QUALITY = 0.92

/** 缩放：输出宽度 0 表示原尺寸；否则等比缩到该宽度（至少 1 像素） */
export function outputSizeOf(rect: SplitRect, outWidth: number): SplitRect {
  const target = Math.round(outWidth)
  if (target <= 0 || target === rect.width) {
    return rect
  }
  const ratio = target / rect.width
  const height = Math.max(Math.round(rect.height * ratio), 1)
  return { index: rect.index, row: rect.row, col: rect.col, x: rect.x, y: rect.y, width: target, height }
}

/** 图块间隔：预览时分割线的粗细（0-12） */
export const GAP_OPTIONS: number[] = [0, 2, 4, 6]

// ---------------------------------------------------------------- 上次设置

const KEY_COUNT = 'img-split-count'
const KEY_LAYOUT = 'img-split-layout'
const KEY_GAP = 'img-split-gap'
const KEY_WIDTH = 'img-split-width'
const KEY_FORMAT = 'img-split-format'
const KEY_NUMBER = 'img-split-number'
const KEY_PREFIX = 'img-split-prefix'

/** 上次的设置 */
export type ImageSplitDraft = {
  count: number
  layout: number
  gap: number
  outWidth: number
  format: number
  numberMode: number
  prefix: string
}

/** 默认设置：3 份、一行三列、2px 分割线、原尺寸、PNG、顺序编号 */
export function defaultImageSplitDraft(): ImageSplitDraft {
  return {
    count: 3,
    layout: 0,
    gap: 2,
    outWidth: 0,
    format: FORMAT_PNG,
    numberMode: NUMBER_SEQUENTIAL,
    prefix: 'image'
  }
}

/** 只认纯数字（可带负号），其余一律当未保存 */
function isIntegerText(text: string): boolean {
  if (text === '') {
    return false
  }
  for (let i = 0; i < text.length; i++) {
    const c = text.substring(i, i + 1)
    if (i === 0 && c === '-') {
      continue
    }
    if (!'0123456789'.includes(c)) {
      return false
    }
  }
  return true
}

function savedNumber(key: string, fallback: number): number {
  const text = readStorage(key)
  if (!isIntegerText(text)) {
    return fallback
  }
  const value = parseInt(text, 10)
  if (value < -1000000 || value > 100000000) {
    return fallback
  }
  return value
}

export function loadImageSplitDraft(): ImageSplitDraft {
  const draft = defaultImageSplitDraft()
  const count = savedNumber(KEY_COUNT, draft.count)
  if (SPLIT_COUNTS.indexOf(count) >= 0) {
    draft.count = count
  }
  const layouts = layoutsOf(draft.count)
  const layout = savedNumber(KEY_LAYOUT, 0)
  if (layout >= 0 && layout < layouts.length) {
    draft.layout = layout
  }
  const gap = savedNumber(KEY_GAP, draft.gap)
  if (GAP_OPTIONS.indexOf(gap) >= 0) {
    draft.gap = gap
  }
  const width = savedNumber(KEY_WIDTH, 0)
  if (width >= 0) {
    draft.outWidth = width
  }
  const format = savedNumber(KEY_FORMAT, draft.format)
  if (format >= 0 && format < FORMAT_NAMES.length) {
    draft.format = format
  }
  const numberMode = savedNumber(KEY_NUMBER, draft.numberMode)
  if (numberMode === NUMBER_SEQUENTIAL || numberMode === NUMBER_ROW_COL) {
    draft.numberMode = numberMode
  }
  const prefix = readStorage(KEY_PREFIX)
  if (prefix !== '') {
    draft.prefix = prefix
  }
  return draft
}

export function saveImageSplitDraft(draft: ImageSplitDraft): void {
  writeStorage(KEY_COUNT, `${draft.count}`)
  writeStorage(KEY_LAYOUT, `${draft.layout}`)
  writeStorage(KEY_GAP, `${draft.gap}`)
  writeStorage(KEY_WIDTH, `${draft.outWidth}`)
  writeStorage(KEY_FORMAT, `${draft.format}`)
  writeStorage(KEY_NUMBER, `${draft.numberMode}`)
  writeStorage(KEY_PREFIX, draft.prefix)
}

// ---------------------------------------------------------------- 切片结果

/** 一块切出来的图：文件名 / 输出尺寸 / 图片路径（H5 是 data URL，小程序 / App 是临时文件路径） */
export type Piece = {
  index: number
  name: string
  width: number
  height: number
  path: string
}

export function pieceSizeText(piece: Piece): string {
  return `${piece.width} × ${piece.height}`
}

// ---------------------------------------------------------------- 预览叠层

/** 预览里的一条分割线：位置百分比 + 方向（竖线在 left，横线在 top） */
export type OverlayLine = {
  percent: number
  /** 竖线定位（left + 宽度） */
  verticalStyle: string
  /** 横线定位（top + 高度） */
  horizontalStyle: string
}

/** 预览里的序号：位置百分比 + 文字 + 定位样式 */
export type OverlayLabel = {
  text: string
  /** 定位样式（left + top） */
  style: string
}

function lineOf(percent: number, gapRpx: number): OverlayLine {
  return {
    percent,
    verticalStyle: `left:${percent.toFixed(3)}%;width:${gapRpx}rpx`,
    horizontalStyle: `top:${percent.toFixed(3)}%;height:${gapRpx}rpx`
  }
}

/** 每块中心的百分比位置（用于叠加序号） */
export function labelsOf(
  rects: SplitRect[],
  imageWidth: number,
  imageHeight: number,
  numberMode: number,
  total: number
): OverlayLabel[] {
  const labels: OverlayLabel[] = []
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i]
    const left = ((rect.x + rect.width / 2) / imageWidth) * 100
    const top = ((rect.y + rect.height / 2) / imageHeight) * 100
    let text = padIndex(rect.index + 1, total)
    if (numberMode === NUMBER_ROW_COL) {
      text = `r${rect.row}c${rect.col}`
    }
    labels.push({ text, style: `left:${left.toFixed(3)}%;top:${top.toFixed(3)}%` })
  }
  return labels
}

/** 分割线的百分比位置（内部边界，不含最外圈） */
export function verticalLinesOf(rects: SplitRect[], imageWidth: number, rows: number, cols: number): OverlayLine[] {
  const lines: OverlayLine[] = []
  if (cols <= 1 || imageWidth <= 0) {
    return lines
  }
  // 每列第一块的右边界即分割线
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const rect = rects[r * cols + c]
      const percent = ((rect.x + rect.width) / imageWidth) * 100
      let exists = false
      for (let k = 0; k < lines.length; k++) {
        if (Math.abs(lines[k].percent - percent) < 0.0001) {
          exists = true
          break
        }
      }
      if (!exists) {
        lines.push(lineOf(percent, 0))
      }
    }
  }
  return lines
}

export function horizontalLinesOf(rects: SplitRect[], imageHeight: number, rows: number, cols: number): OverlayLine[] {
  const lines: OverlayLine[] = []
  if (rows <= 1 || imageHeight <= 0) {
    return lines
  }
  for (let r = 0; r < rows - 1; r++) {
    const rect = rects[r * cols]
    lines.push(lineOf(((rect.y + rect.height) / imageHeight) * 100, 0))
  }
  return lines
}

/** 分割线叠层：竖线 / 横线 / 序号，gap 按 rpx 换算（1px = 2rpx） */
export type SplitOverlay = {
  verticals: string[]
  horizontals: string[]
  labels: OverlayLabel[]
}

export function overlayOf(
  imageWidth: number,
  imageHeight: number,
  layout: SplitLayout,
  gap: number,
  numberMode: number,
  total: number
): SplitOverlay {
  const rects = splitRects(imageWidth, imageHeight, layout.rows, layout.cols)
  const gapRpx = gap * 2
  const verticals = verticalLinesOf(rects, imageWidth, layout.rows, layout.cols).map((line) =>
    lineOf(line.percent, gapRpx).verticalStyle
  )
  const horizontals = horizontalLinesOf(rects, imageHeight, layout.rows, layout.cols).map((line) =>
    lineOf(line.percent, gapRpx).horizontalStyle
  )
  return {
    verticals,
    horizontals,
    labels: labelsOf(rects, imageWidth, imageHeight, numberMode, total)
  }
}

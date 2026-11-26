// 图片分割：把一张图按 2 / 3 / 4 / 6 / 9 份切成整齐的小图（本地处理，不上传）

import { useEffect, useMemo, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { Image, Input, Text, View } from '@tarojs/components'

import PageWithMenu from '../../../components/page-with-menu'
import NavBar from '../../../components/nav-bar'
import {
  FORMAT_EXTS,
  FORMAT_NAMES,
  FORMAT_PNG,
  GAP_OPTIONS,
  NUMBER_NAMES,
  NUMBER_ROW_COL,
  NUMBER_SEQUENTIAL,
  SPLIT_COUNTS,
  layoutsOf,
  loadImageSplitDraft,
  outputSizeOf,
  overlayOf,
  pieceSizeText,
  sanitizePrefix,
  saveImageSplitDraft,
  sizeTextOf,
  splitRects
} from './lib'
import type { Piece, SplitLayout } from './lib'
import HiddenCanvas from './hidden-canvas'
import { imageSizeOf, pickImagePath, savePieceImage, sliceImage } from './slice'

import sampleSource from '../../../static/sample-split.png'

import './index.scss'

const CANVAS_ID = 'is-canvas'
const isRN = process.env.TARO_ENV === 'rn'

export default function ImageSplit() {
  const draft = loadImageSplitDraft()

  const [sourcePath, setSourcePath] = useState('')
  const [imageWidth, setImageWidth] = useState(0)
  const [imageHeight, setImageHeight] = useState(0)

  const [count, setCount] = useState(() => draft.count)
  const [layoutOptions, setLayoutOptions] = useState<SplitLayout[]>(() => layoutsOf(draft.count))
  const [layout, setLayout] = useState(() => draft.layout)
  const [gap, setGap] = useState(() => draft.gap)
  const [outWidth, setOutWidth] = useState(() => draft.outWidth)
  const [outWidthText, setOutWidthText] = useState(() => `${draft.outWidth}`)
  const [format, setFormat] = useState(() => draft.format)
  const [numberMode, setNumberMode] = useState(() => draft.numberMode)
  const [prefix, setPrefix] = useState(() => draft.prefix)

  const [pieces, setPieces] = useState<Piece[]>([])
  const [generating, setGenerating] = useState(false)
  const [errorText, setErrorText] = useState('')

  // 每次选图 +1，用于丢弃过期的尺寸读取结果
  const loadToken = useRef(0)

  useEffect(() => {
    saveImageSplitDraft({ count, layout, gap, outWidth, format, numberMode, prefix })
  }, [count, layout, gap, outWidth, format, numberMode, prefix])

  const currentLayout = layoutOptions[layout] ?? layoutOptions[0] ?? { rows: 1, cols: 1, name: '不分割' }

  const overlay = useMemo(
    () => overlayOf(imageWidth, imageHeight, currentLayout, gap, numberMode, count),
    [imageWidth, imageHeight, currentLayout, gap, numberMode, count]
  )

  // ------------------------------------------------------------ 文案

  const imageText = useMemo(() => {
    if (sourcePath === '') {
      return '还没有选图片'
    }
    if (imageWidth <= 0 || imageHeight <= 0) {
      return '正在读取图片尺寸…'
    }
    return `原图 ${sizeTextOf(imageWidth, imageHeight)}`
  }, [sourcePath, imageWidth, imageHeight])

  const planText = count <= 1 ? '' : `${currentLayout.name} · ${count} 份`

  const nameHint = useMemo(() => {
    const ext = FORMAT_EXTS[format]
    const safe = sanitizePrefix(prefix)
    if (count <= 1) {
      return `输出：${safe}.${ext}`
    }
    if (numberMode === NUMBER_ROW_COL) {
      const tail =
        currentLayout.cols >= 2
          ? ` … ${safe}_r${currentLayout.rows}c${currentLayout.cols}.${ext}`
          : ` … ${safe}_r${currentLayout.rows}c1.${ext}`
      return `输出：${safe}_r1c1.${ext}${tail}`
    }
    const first = count > 9 ? '01' : '1'
    const last = count > 9 && count < 10 ? `0${count}` : `${count}`
    return `输出：${safe}_${first}.${ext} … ${safe}_${last}.${ext}`
  }, [count, format, prefix, numberMode, currentLayout])

  const resultText = useMemo(() => {
    if (pieces.length === 0) {
      return ''
    }
    let total = 0
    for (let i = 0; i < pieces.length; i++) {
      total += pieces[i].width * pieces[i].height
    }
    return `${pieces.length} 块 · 合计 ${total} 像素 · ${FORMAT_NAMES[format]}`
  }, [pieces, format])

  // ------------------------------------------------------------ 选图

  const applyImage = async (path: string) => {
    loadToken.current += 1
    const token = loadToken.current
    setSourcePath(path)
    setImageWidth(0)
    setImageHeight(0)
    setPieces([])
    setErrorText('')
    try {
      const size = await imageSizeOf(path)
      if (token !== loadToken.current) {
        return
      }
      setImageWidth(size.width)
      setImageHeight(size.height)
    } catch (e) {
      if (token !== loadToken.current) {
        return
      }
      setErrorText(e instanceof Error ? e.message : '图片读取失败，换一张试试')
    }
  }

  const onPickImage = () => {
    pickImagePath()
      .then((path) => {
        if (path === '') {
          setErrorText('没有选中图片')
          return
        }
        applyImage(path)
      })
      .catch((error: unknown) =>
        setErrorText(error instanceof Error ? error.message : '没有选中图片')
      )
  }

  const onUseSample = () => {
    applyImage(sampleSource)
  }

  const onRemove = () => {
    loadToken.current += 1
    setSourcePath('')
    setImageWidth(0)
    setImageHeight(0)
    setPieces([])
    setErrorText('')
  }

  // ------------------------------------------------------------ 设置项

  const onPickCount = (value: number) => {
    setCount(value)
    setLayoutOptions(layoutsOf(value))
    setLayout(0)
    setPieces([])
  }

  const onPickLayout = (index: number) => {
    setLayout(index)
    setPieces([])
  }

  const onPickGap = (value: number) => {
    setGap(value)
  }

  const onPickFormat = (index: number) => {
    setFormat(index)
    setPieces([])
  }

  const onPickNumber = (index: number) => {
    setNumberMode(index)
    setPieces([])
  }

  const onWidthBlur = () => {
    const text = outWidthText.trim()
    let value = 0
    if (text !== '' && /^\d+$/.test(text)) {
      value = parseInt(text, 10)
    }
    if (value < 0) {
      value = 0
    }
    if (value > 20000) {
      value = 20000
    }
    setOutWidth(value)
    setOutWidthText(`${value}`)
    setPieces([])
  }

  const onPrefixBlur = () => {
    setPrefix(sanitizePrefix(prefix))
    setPieces([])
  }

  // ------------------------------------------------------------ 生成切片

  const onGenerate = () => {
    if (generating) {
      return
    }
    if (sourcePath === '') {
      setErrorText('先选一张图片吧')
      return
    }
    if (imageWidth <= 0 || imageHeight <= 0) {
      setErrorText('还没读到图片尺寸，稍等一下再试')
      return
    }
    const rects = splitRects(imageWidth, imageHeight, currentLayout.rows, currentLayout.cols)
    if (rects.length === 0) {
      setErrorText('这张图太小了，切不动')
      return
    }
    setGenerating(true)
    setErrorText('')
    setPieces([])
    sliceImage({
      sourcePath,
      rects,
      outWidth,
      format,
      prefix,
      numberMode,
      ext: FORMAT_EXTS[format],
      canvasId: CANVAS_ID
    })
      .then((list) => {
        setPieces(list)
        setGenerating(false)
      })
      .catch((error: unknown) => {
        setErrorText(error instanceof Error ? error.message : '生成切片失败，换个格式试试')
        setGenerating(false)
      })
  }

  // ------------------------------------------------------------ 保存

  const onSaveOne = (piece: Piece) => {
    savePieceImage(piece)
      .then((title) => Taro.showToast({ title, icon: 'none' }))
      .catch(() => Taro.showToast({ title: '保存失败，检查相册权限', icon: 'none' }))
  }

  const onSaveAll = () => {
    if (pieces.length === 0) {
      return
    }
    for (let i = 0; i < pieces.length; i++) {
      savePieceImage(pieces[i])
        .then((title) => Taro.showToast({ title, icon: 'none' }))
        .catch(() => Taro.showToast({ title: '保存失败，检查相册权限', icon: 'none' }))
    }
  }

  // ------------------------------------------------------------ 渲染

  const chipClass = (active: boolean) => (active ? 'chip chip-on' : 'chip')
  const chipTextClass = (active: boolean) => (active ? 'chip-text chip-text-on' : 'chip-text')

  return (
    <PageWithMenu>
      <NavBar title='图片分割' />
      <View className='container'>
        {/* 原图 */}
        <View className='card'>
          <View className='card-head'>
            <Text className='card-title'>原图</Text>
            {sourcePath !== '' && (
              <Text className='head-action' onClick={onRemove}>
                移除
              </Text>
            )}
          </View>

          {sourcePath === '' ? (
            <View className='picker' hoverClass='chip-hover' onClick={onPickImage}>
              <Text className='picker-icon'>🖼️</Text>
              <Text className='picker-title'>点这里选择一张图片</Text>
              <Text className='picker-hint'>在本地处理，不会上传</Text>
            </View>
          ) : (
            <View className='preview-wrap'>
              <Image className='preview-img' src={sourcePath} mode='widthFix' />
              {overlay.verticals.map((style, index) => (
                <View className='grid-line-v' key={`v${index}`} style={style} />
              ))}
              {overlay.horizontals.map((style, index) => (
                <View className='grid-line-h' key={`h${index}`} style={style} />
              ))}
              {overlay.labels.map((label, index) => (
                <View className='grid-index-box' key={`l${index}`} style={label.style}>
                  <Text className='grid-index'>{label.text}</Text>
                </View>
              ))}
            </View>
          )}

          <Text className='stat-text'>{imageText}</Text>
          {errorText !== '' && <Text className='error-text'>{errorText}</Text>}

          <View className='btn-row'>
            <View className='btn btn-primary' hoverClass='chip-hover' onClick={onPickImage}>
              <Text className='btn-text btn-text-primary'>{sourcePath === '' ? '选择图片' : '换一张'}</Text>
            </View>
            <View className='btn' hoverClass='chip-hover' onClick={onUseSample}>
              <Text className='btn-text'>用示例图片</Text>
            </View>
          </View>
        </View>

        {/* 分割设置 */}
        <View className='card'>
          <View className='card-head'>
            <Text className='card-title'>分割设置</Text>
            <Text className='card-sub'>{planText}</Text>
          </View>

          <Text className='label'>分成几份</Text>
          <View className='chip-row'>
            {SPLIT_COUNTS.map((item) => (
              <View className={chipClass(count === item)} key={item} onClick={() => onPickCount(item)}>
                <Text className={chipTextClass(count === item)}>{item} 份</Text>
              </View>
            ))}
          </View>

          <Text className='label'>分割方向</Text>
          <View className='chip-row'>
            {layoutOptions.map((item, index) => (
              <View className={chipClass(layout === index)} key={item.name} onClick={() => onPickLayout(index)}>
                <Text className={chipTextClass(layout === index)}>{item.name}</Text>
              </View>
            ))}
          </View>

          <Text className='label'>预览分割线（{gap} px，0 为无缝）</Text>
          <View className='chip-row'>
            {GAP_OPTIONS.map((item) => (
              <View className={chipClass(gap === item)} key={item} onClick={() => onPickGap(item)}>
                <Text className={chipTextClass(gap === item)}>{item}</Text>
              </View>
            ))}
          </View>

          <Text className='label'>每块输出宽度（0 = 保持原尺寸）</Text>
          <View className='input-row'>
            <Input
              className='input'
              type='number'
              value={outWidthText}
              placeholder='0'
              onInput={(event) => setOutWidthText(String(event.detail.value ?? ''))}
              onBlur={onWidthBlur}
            />
            <Text className='input-unit'>px</Text>
          </View>

          <Text className='label'>输出格式</Text>
          <View className='chip-row'>
            {FORMAT_NAMES.map((item, index) => (
              <View className={chipClass(format === index)} key={item} onClick={() => onPickFormat(index)}>
                <Text className={chipTextClass(format === index)}>{item}</Text>
              </View>
            ))}
          </View>

          <Text className='label'>文件名前缀</Text>
          <View className='input-row'>
            <Input
              className='input'
              value={prefix}
              placeholder='image'
              onInput={(event) => setPrefix(String(event.detail.value ?? ''))}
              onBlur={onPrefixBlur}
            />
          </View>

          <Text className='label'>编号方式</Text>
          <View className='chip-row'>
            {NUMBER_NAMES.map((item, index) => (
              <View className={chipClass(numberMode === index)} key={item} onClick={() => onPickNumber(index)}>
                <Text className={chipTextClass(numberMode === index)}>{item}</Text>
              </View>
            ))}
          </View>

          <Text className='hint'>{nameHint}</Text>

          <View className='btn-row'>
            <View className='btn btn-primary' hoverClass='chip-hover' onClick={onGenerate}>
              <Text className='btn-text btn-text-primary'>{generating ? '正在生成…' : '✂️ 生成切片'}</Text>
            </View>
          </View>
        </View>

        {/* 切片结果 */}
        {pieces.length > 0 && (
          <View className='card'>
            <View className='card-head'>
              <Text className='card-title'>切片结果</Text>
              <Text className='head-action' onClick={onSaveAll}>
                保存全部
              </Text>
            </View>
            <Text className='stat-text'>{resultText}</Text>

            {pieces.map((item) => (
              <View className='piece' key={item.index}>
                <Image className='piece-img' src={item.path} mode='aspectFit' />
                <View className='piece-info'>
                  <Text className='piece-name'>{item.name}</Text>
                  <Text className='piece-size'>{pieceSizeText(item)}</Text>
                </View>
                <View className='piece-btn' hoverClass='chip-hover' onClick={() => onSaveOne(item)}>
                  <Text className='piece-btn-text'>保存</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 说明 */}
        <View className='card'>
          <Text className='card-title'>说明</Text>
          <Text className='note'>· 切图完全在本地完成，图片不会上传到任何服务器。</Text>
          <Text className='note'>
            · 宽高除不尽时，余下的像素按四舍五入分给前几块，每块最多相差 1 像素；按顺序拼回去与原图完全一致。
          </Text>
          <Text className='note'>· PNG 无损、支持透明背景；JPEG 体积更小，质量固定 0.92。</Text>
          <Text className='note'>· 每块输出宽度留 0 表示保持原分辨率，填数字则等比缩放。</Text>
          {isRN && <Text className='note'>· Android（RN）端暂不支持切图，请在微信小程序或网页版使用。</Text>}
        </View>

        {/* 切图用的隐藏画布（小程序 / App 需要，H5 走 DOM canvas） */}
        <HiddenCanvas canvasId={CANVAS_ID} />
      </View>
    </PageWithMenu>
  )
}

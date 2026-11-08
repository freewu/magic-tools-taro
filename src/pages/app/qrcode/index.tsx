// 二维码：字节模式生成（版本 1–15），用绝对定位色块渲染，不依赖 canvas

import { useEffect, useMemo, useRef, useState } from 'react'
import { Text, Textarea, View } from '@tarojs/components'

import AppMenu from '../../../components/app-menu'
import { QR_EC_LEVELS, QR_MAX_VERSION, buildQr, qrMaxBytes } from './lib'
import type { QrBuild, QrRun } from './lib'

import './index.scss'

/** 展示宽度上限（rpx），模块尺寸取整避免相邻色块出现缝隙 */
const FRAME_MAX_RPX = 600

const SAMPLES: string[] = [
  'https://github.com/freewu/magic-tools-lite',
  'mailto:bluefrog.wu@gmail.com',
  'WIFI:T:WPA;S:magic-tools;P:12345678;;'
]

const SAMPLE_LABELS: string[] = ['网址', '邮箱', 'WIFI']

const EC_LABELS: string[] = QR_EC_LEVELS.map((level) => level.label)

/** 连续黑块转换为绝对定位的样式（整块整数 rpx，避免行间白缝） */
function toCellStyles(runs: QrRun[], moduleRpx: number): string[] {
  const styles: string[] = []
  for (let i = 0; i < runs.length; i++) {
    const run = runs[i]
    styles.push(
      `position:absolute;left:${run.x * moduleRpx}rpx;top:${run.y * moduleRpx}rpx;width:${
        run.w * moduleRpx
      }rpx;height:${moduleRpx}rpx;background-color:#000`
    )
  }
  return styles
}

function frameOf(build: QrBuild): { frame: string; cells: string[] } {
  let moduleRpx = Math.floor(FRAME_MAX_RPX / build.modulesTotal)
  if (moduleRpx < 2) {
    moduleRpx = 2
  }
  const size = moduleRpx * build.modulesTotal
  return {
    frame: `width:${size}rpx;height:${size}rpx;background-color:#FFF`,
    cells: toCellStyles(build.runs, moduleRpx)
  }
}

export default function Qrcode() {
  const [text, setText] = useState('')
  // 防抖后的内容才真正参与编码，避免每敲一个字都重建矩阵
  const [committed, setCommitted] = useState('')
  const [ecIndex, setEcIndex] = useState(1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  const onTextInput = (value: string) => {
    setText(value)
    if (timerRef.current != null) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      setCommitted(value)
    }, 180)
  }

  const commit = (value: string) => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setText(value)
    setCommitted(value)
  }

  const build = useMemo(
    () => (committed === '' ? null : buildQr(committed, ecIndex, QR_MAX_VERSION)),
    [committed, ecIndex]
  )
  const view = useMemo(() => (build != null && build.ok ? frameOf(build) : null), [build])

  const maxBytes = qrMaxBytes(QR_MAX_VERSION, ecIndex)
  const hasQr = build != null && build.ok && view != null

  let emptyText = '输入内容后自动生成二维码'
  if (build != null && !build.ok) {
    emptyText = `${build.message}，请精简内容或降低纠错级别`
  }

  return (
    <View className='page-with-menu'>
      <View className='container'>
        <View className='card'>
          <Text className='card-title'>二维码内容</Text>
          <Textarea
            className='input-area'
            maxlength={-1}
            value={text}
            placeholder='输入文本、网址、名片或 WIFI 信息'
            onInput={(event) => onTextInput(String(event.detail.value ?? ''))}
          />
          <View className='chips'>
            {SAMPLE_LABELS.map((label, index) => (
              <View className='chip' key={label} hoverClass='chip-hover' onClick={() => commit(SAMPLES[index])}>
                <Text className='chip-text'>{label}</Text>
              </View>
            ))}
          </View>
          <View className='field-row'>
            <Text className='field-label'>纠错</Text>
            <View className='segments'>
              {EC_LABELS.map((label, index) => (
                <View
                  className={index === ecIndex ? 'segment segment-active' : 'segment'}
                  key={label}
                  hoverClass='segment-hover'
                  onClick={() => setEcIndex(index)}
                >
                  <Text className={index === ecIndex ? 'segment-text segment-text-active' : 'segment-text'}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <Text className='hint-text'>
            纠错级别越高越耐污损，可容纳的内容越少；当前最多 {maxBytes} 字节，最大版本 V{QR_MAX_VERSION}。
          </Text>
        </View>

        {hasQr && build != null && view != null ? (
          <View className='card'>
            <Text className='card-title'>二维码</Text>
            <View className='qr-stage'>
              <View className='qr-frame' style={view.frame}>
                {view.cells.map((cellStyle, index) => (
                  <View key={index} style={cellStyle} />
                ))}
              </View>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>版本 / 尺寸</Text>
              <Text className='metric-value'>
                V{build.version} / {build.size}×{build.size} 模块
              </Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>纠错级别</Text>
              <Text className='metric-value'>
                {QR_EC_LEVELS[ecIndex].label}（可纠错约 {QR_EC_LEVELS[ecIndex].hint}）
              </Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>内容字节</Text>
              <Text className='metric-value'>{build.bytes} 字节</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>掩码 / 黑块</Text>
              <Text className='metric-value'>
                掩码 {build.mask} / {build.runs.length} 块
              </Text>
            </View>
          </View>
        ) : (
          <View className='card'>
            <Text className='empty-text'>{emptyText}</Text>
          </View>
        )}

        <Text className='tip-text page-tip'>
          二维码按 ISO/IEC 18004 字节模式生成，中文按 UTF-8 编码（每个汉字 3
          字节）；纯文本即可离线计算，内容不会上传。请用手机相机或扫码工具识别。
        </Text>
      </View>
      <AppMenu />
    </View>
  )
}

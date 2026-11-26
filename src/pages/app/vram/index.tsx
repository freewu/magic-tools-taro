// 大模型显存估算：权重 + KV Cache + 开销 + 预留，支持推理 / 训练与多卡 TP

import { useEffect, useMemo, useState } from 'react'
import { Input, Text, View } from '@tarojs/components'

import PageWithMenu from '../../../components/page-with-menu'
import NavBar from '../../../components/nav-bar'
import {
  KV_PRECISIONS,
  MODEL_PRESETS,
  MODE_INFER,
  MODE_TRAIN,
  WEIGHT_PRECISIONS,
  cardFitsOf,
  computeVram,
  contextText,
  fmtGB,
  fmtPct,
  loadVramDraft,
  maxBatchOf,
  parseIntegerText,
  parseNumberText,
  saveVramDraft
} from './lib'
import type { ModelPreset, VramInput } from './lib'

import './index.scss'

const MODE_NAMES: string[] = ['推理显存', '训练显存']
const CONTEXT_OPTIONS: number[] = [2048, 8192, 32768, 131072, 1048576]
const CONTEXT_TEXTS: string[] = ['2K', '8K', '32K', '128K', '1M']
const TP_OPTIONS: number[] = [1, 2, 4, 8]

const TIPS: string[] = [
  '· 权重精度每参数字节：FP32 4 / BF16 2 / FP8 或 INT8 1 / INT4 0.5（量化还要带上元数据，实测略大）。',
  '· KV Cache 里 2 表示 Key 与 Value 各一份；GQA 模型的 KV 头数远小于注意力头数，这一项能省很多。',
  '· 训练按 AdamW 混合精度：梯度与权重同精度，优化器存主权重 + 一阶矩 + 二阶矩共 12 字节 / 参数，所以 BF16 全参训练约 16 字节 / 参数（≈ 8 倍 BF16 权重），激活另按比例估。',
  '· 激活开销随 batch × 序列长度增长很快，这里按权重比例粗估，实际请留足余量（经验值 10% ~ 20%）。',
  '· 单位按厂商标称 1e9 字节算，操作系统看到的 GiB 会小约 7%；显存卡位按整卡整除向上取整，多卡还需通信与镜像开销。'
]

/** 输入框里的数字（非法返回 fallback） */
function numberOr(text: string, fallback: number): number {
  const value = parseNumberText(text)
  return value < 0 ? fallback : value
}

function integerOr(text: string, fallback: number): number {
  const value = parseIntegerText(text)
  return value < 0 ? fallback : value
}

export default function Vram() {
  const saved = loadVramDraft()
  const savedTp = parseIntegerText(saved.tpText)

  const [modeIndex, setModeIndex] = useState(() => (saved.modeText === '1' ? 1 : 0))
  const [paramsInput, setParamsInput] = useState(() => saved.paramsText)
  const [layersInput, setLayersInput] = useState(() => saved.layersText)
  const [kvHeadsInput, setKvHeadsInput] = useState(() => saved.kvHeadsText)
  const [headDimInput, setHeadDimInput] = useState(() => saved.headDimText)
  const [presetName, setPresetName] = useState('')
  const [weightIndex, setWeightIndex] = useState(() => saved.weightPrecision)
  const [kvIndex, setKvIndex] = useState(() => saved.kvPrecision)
  const [contextLength, setContextLength] = useState(() => {
    const value = parseIntegerText(saved.contextText)
    return value > 0 ? value : 8192
  })
  const [batchInput, setBatchInput] = useState(() => saved.batchText)
  const [tpIndex, setTpIndex] = useState(() => (savedTp === 2 ? 1 : savedTp === 4 ? 2 : savedTp === 8 ? 3 : 0))
  const [overheadInput, setOverheadInput] = useState('8')
  const [reserveInput, setReserveInput] = useState('10')
  const [activationInput, setActivationInput] = useState('20')

  useEffect(() => {
    saveVramDraft({
      modeText: modeIndex === 1 ? '1' : '0',
      paramsText: paramsInput,
      weightPrecision: weightIndex,
      layersText: layersInput,
      kvHeadsText: kvHeadsInput,
      headDimText: headDimInput,
      contextText: `${contextLength}`,
      kvPrecision: kvIndex,
      batchText: batchInput,
      tpText: `${TP_OPTIONS[tpIndex]}`
    })
  }, [
    modeIndex,
    paramsInput,
    weightIndex,
    layersInput,
    kvHeadsInput,
    headDimInput,
    contextLength,
    kvIndex,
    batchInput,
    tpIndex
  ])

  const input: VramInput = useMemo(
    () => ({
      mode: modeIndex === 1 ? MODE_TRAIN : MODE_INFER,
      paramsB: numberOr(paramsInput, 0),
      layers: integerOr(layersInput, 0),
      kvHeads: integerOr(kvHeadsInput, 0),
      headDim: integerOr(headDimInput, 0),
      weightPrecision: weightIndex,
      kvPrecision: kvIndex,
      contextLength,
      batch: integerOr(batchInput, 1),
      tp: TP_OPTIONS[tpIndex],
      overheadPct: numberOr(overheadInput, 0),
      reservePct: numberOr(reserveInput, 0),
      activationPct: numberOr(activationInput, 0)
    }),
    [
      modeIndex,
      paramsInput,
      layersInput,
      kvHeadsInput,
      headDimInput,
      weightIndex,
      kvIndex,
      contextLength,
      batchInput,
      tpIndex,
      overheadInput,
      reserveInput,
      activationInput
    ]
  )

  const valid =
    input.paramsB > 0 &&
    input.layers > 0 &&
    input.kvHeads > 0 &&
    input.headDim > 0 &&
    input.contextLength > 0 &&
    input.batch > 0

  const view = useMemo(() => {
    if (!valid) {
      return null
    }
    const result = computeVram(input)
    const perCardText =
      input.tp > 1 ? `TP ${input.tp} 卡 · 单卡约 ${fmtGB(result.perCardGB)}` : '单卡运行'

    const detailRows: { label: string; value: string }[] = [
      {
        label: '权重显存',
        value: `${fmtGB(result.weightGB)} · ${fmtPct(result.weightGB, result.totalGB)}`
      },
      { label: 'KV Cache', value: `${fmtGB(result.kvGB)} · ${fmtPct(result.kvGB, result.totalGB)}` }
    ]
    if (input.mode === MODE_TRAIN) {
      detailRows.push({
        label: '梯度',
        value: `${fmtGB(result.gradGB)} · ${fmtPct(result.gradGB, result.totalGB)}`
      })
      detailRows.push({
        label: '优化器状态 (AdamW)',
        value: `${fmtGB(result.optimizerGB)} · ${fmtPct(result.optimizerGB, result.totalGB)}`
      })
      detailRows.push({
        label: `激活（按权重 ${input.activationPct}% 估）`,
        value: `${fmtGB(result.activationGB)} · ${fmtPct(result.activationGB, result.totalGB)}`
      })
    }
    detailRows.push({
      label: `激活 / 框架开销 (${input.overheadPct}%)`,
      value: `${fmtGB(result.overheadGB)} · ${fmtPct(result.overheadGB, result.totalGB)}`
    })
    detailRows.push({
      label: `预留余量 (${input.reservePct}%)`,
      value: `${fmtGB(result.reserveGB)} · ${fmtPct(result.reserveGB, result.totalGB)}`
    })

    // 单卡适配结论
    let fitText = ''
    let fitColor = '#1f9d55'
    let fitBg = '#e7f7ee'
    if (input.tp > 1) {
      fitText = `单卡需 ${fmtGB(result.perCardGB)}`
      fitColor = result.perCardGB <= 80 ? '#1f9d55' : '#d97706'
      fitBg = result.perCardGB <= 80 ? '#e7f7ee' : '#fef3e2'
    } else if (result.totalGB <= 24) {
      fitText = '消费级单卡可行'
    } else if (result.totalGB <= 80) {
      fitText = '需大显存卡'
      fitColor = '#d97706'
      fitBg = '#fef3e2'
    } else {
      fitText = '需多卡切分'
      fitColor = '#d93025'
      fitBg = '#fdecec'
    }

    // 单张 80 GB 卡在当前设置下最多能跑几个并发
    const maxBatch = maxBatchOf({ ...input, tp: 1 }, 80)
    const batchHint =
      maxBatch <= 0
        ? '当前设置单张 80 GB 卡放不下，需要减精度、缩上下文或上多卡。'
        : `参考：单张 80 GB 卡、上下文 ${contextText(input.contextLength)} 时，最多约 ${maxBatch} 路并发（含 ${input.overheadPct}% 开销与 ${input.reservePct}% 预留）。`

    return {
      totalText: fmtGB(result.totalGB),
      perCardText,
      detailRows,
      cardFits: cardFitsOf(result.totalGB),
      fitText,
      fitColor,
      fitBg,
      batchHint
    }
  }, [input, valid])

  const pickPreset = (preset: ModelPreset) => {
    setPresetName(preset.name)
    setParamsInput(`${Math.round(preset.paramsB * 10) / 10}`)
    setLayersInput(`${preset.layers}`)
    setKvHeadsInput(`${preset.kvHeads}`)
    setHeadDimInput(`${preset.headDim}`)
  }

  const editField = (setter: (value: string) => void) => (value: string) => {
    setter(value)
    setPresetName('')
  }

  return (
    <PageWithMenu>
      <NavBar title='大模型显存' />
      <View className='container'>
        <View className='card'>
          <Text className='card-title'>场景</Text>
          <View className='seg-row'>
            {MODE_NAMES.map((name, index) => (
              <View
                className={modeIndex === index ? 'seg-chip seg-chip-active' : 'seg-chip'}
                key={name}
                hoverClass='chip-hover'
                onClick={() => setModeIndex(index)}
              >
                <Text className={modeIndex === index ? 'seg-text seg-text-active' : 'seg-text'}>{name}</Text>
              </View>
            ))}
          </View>

          <Text className='field-label field-gap'>模型预设（点一下带入层数 / KV 头数 / 单头维度）</Text>
          <View className='chip-wrap'>
            {MODEL_PRESETS.map((preset) => (
              <View
                className={presetName === preset.name ? 'preset-chip preset-chip-active' : 'preset-chip'}
                key={preset.name}
                hoverClass='chip-hover'
                onClick={() => pickPreset(preset)}
              >
                <Text className={presetName === preset.name ? 'preset-text preset-text-active' : 'preset-text'}>
                  {preset.name}
                </Text>
              </View>
            ))}
          </View>

          <View className='input-grid'>
            <View className='input-cell'>
              <Text className='input-label'>参数量 (B)</Text>
              <Input
                className='num-input'
                type='digit'
                maxlength={6}
                value={paramsInput}
                onInput={(event) => editField(setParamsInput)(String(event.detail.value ?? ''))}
              />
            </View>
            <View className='input-cell'>
              <Text className='input-label'>层数</Text>
              <Input
                className='num-input'
                type='number'
                maxlength={4}
                value={layersInput}
                onInput={(event) => editField(setLayersInput)(String(event.detail.value ?? ''))}
              />
            </View>
            <View className='input-cell'>
              <Text className='input-label'>KV 头数</Text>
              <Input
                className='num-input'
                type='number'
                maxlength={4}
                value={kvHeadsInput}
                onInput={(event) => editField(setKvHeadsInput)(String(event.detail.value ?? ''))}
              />
            </View>
            <View className='input-cell'>
              <Text className='input-label'>单头维度</Text>
              <Input
                className='num-input'
                type='number'
                maxlength={4}
                value={headDimInput}
                onInput={(event) => editField(setHeadDimInput)(String(event.detail.value ?? ''))}
              />
            </View>
          </View>
        </View>

        <View className='card'>
          <Text className='card-title'>精度与规模</Text>

          <Text className='field-label field-gap'>权重精度</Text>
          <View className='chip-wrap'>
            {WEIGHT_PRECISIONS.map((precision, index) => (
              <View
                className={weightIndex === index ? 'preset-chip preset-chip-active' : 'preset-chip'}
                key={precision.key}
                hoverClass='chip-hover'
                onClick={() => setWeightIndex(index)}
              >
                <Text className={weightIndex === index ? 'preset-text preset-text-active' : 'preset-text'}>
                  {precision.label}
                </Text>
              </View>
            ))}
          </View>

          <Text className='field-label field-gap'>KV Cache 精度</Text>
          <View className='chip-wrap'>
            {KV_PRECISIONS.map((precision, index) => (
              <View
                className={kvIndex === index ? 'preset-chip preset-chip-active' : 'preset-chip'}
                key={precision.key}
                hoverClass='chip-hover'
                onClick={() => setKvIndex(index)}
              >
                <Text className={kvIndex === index ? 'preset-text preset-text-active' : 'preset-text'}>
                  {precision.label}
                </Text>
              </View>
            ))}
          </View>

          <Text className='field-label field-gap'>上下文长度</Text>
          <View className='chip-wrap'>
            {CONTEXT_OPTIONS.map((item, index) => (
              <View
                className={contextLength === item ? 'preset-chip preset-chip-active' : 'preset-chip'}
                key={item}
                hoverClass='chip-hover'
                onClick={() => setContextLength(item)}
              >
                <Text className={contextLength === item ? 'preset-text preset-text-active' : 'preset-text'}>
                  {CONTEXT_TEXTS[index]}
                </Text>
              </View>
            ))}
          </View>

          <View className='input-grid'>
            <View className='input-cell'>
              <Text className='input-label'>并发序列数</Text>
              <Input
                className='num-input'
                type='number'
                maxlength={3}
                value={batchInput}
                onInput={(event) => setBatchInput(String(event.detail.value ?? ''))}
              />
            </View>
            <View className='input-cell'>
              <Text className='input-label'>激活 / 框架开销 %</Text>
              <Input
                className='num-input'
                type='digit'
                maxlength={4}
                value={overheadInput}
                onInput={(event) => setOverheadInput(String(event.detail.value ?? ''))}
              />
            </View>
            <View className='input-cell'>
              <Text className='input-label'>预留余量 %</Text>
              <Input
                className='num-input'
                type='digit'
                maxlength={4}
                value={reserveInput}
                onInput={(event) => setReserveInput(String(event.detail.value ?? ''))}
              />
            </View>
            {modeIndex === 1 && (
              <View className='input-cell'>
                <Text className='input-label'>激活占权重 %</Text>
                <Input
                  className='num-input'
                  type='digit'
                  maxlength={4}
                  value={activationInput}
                  onInput={(event) => setActivationInput(String(event.detail.value ?? ''))}
                />
              </View>
            )}
          </View>

          <Text className='field-label field-gap'>张量并行 TP（多卡切分权重与 KV）</Text>
          <View className='chip-wrap'>
            {TP_OPTIONS.map((tp, index) => (
              <View
                className={tpIndex === index ? 'preset-chip preset-chip-active' : 'preset-chip'}
                key={tp}
                hoverClass='chip-hover'
                onClick={() => setTpIndex(index)}
              >
                <Text className={tpIndex === index ? 'preset-text preset-text-active' : 'preset-text'}>{tp} 卡</Text>
              </View>
            ))}
          </View>
        </View>

        {view ? (
          <View className='card'>
            <View className='result-head'>
              <View className='result-left'>
                <Text className='result-label'>预计总显存</Text>
                <Text className='result-total'>{view.totalText}</Text>
                <Text className='result-sub'>{view.perCardText}</Text>
              </View>
              <View className='status-box' style={{ backgroundColor: view.fitBg }}>
                <Text className='status-text' style={{ color: view.fitColor }}>
                  {view.fitText}
                </Text>
              </View>
            </View>

            {view.detailRows.map((row) => (
              <View className='metric-row' key={row.label}>
                <Text className='metric-label'>{row.label}</Text>
                <Text className='metric-value'>{row.value}</Text>
              </View>
            ))}

            <Text className='field-label field-gap'>单卡显存档位（按总量估算需要几张）</Text>
            <View className='chip-wrap'>
              {view.cardFits.map((fit) => (
                <View className='card-chip' key={fit.cardGB}>
                  <Text className={fit.fits ? 'card-chip-text card-chip-ok' : 'card-chip-text'}>{fit.text}</Text>
                </View>
              ))}
            </View>

            <Text className='hint-text'>{view.batchHint}</Text>
          </View>
        ) : (
          <View className='card'>
            <View className='empty-box'>
              <Text className='empty-icon'>🖥️</Text>
              <Text className='empty-text'>请输入正的参数量、层数、KV 头数与单头维度</Text>
            </View>
          </View>
        )}

        <View className='card'>
          <Text className='card-title'>公式</Text>
          <Text className='formula-line'>推理显存 = 权重 + KV Cache + 激活 / 框架开销 + 预留余量</Text>
          <Text className='formula-line'>权重 (GB) = 参数量 (B) × 每参数字节</Text>
          <Text className='formula-line'>
            KV (GB) = 2 × 层数 × KV 头数 × 单头维度 × 上下文长度 × KV 字节 × 并发 ÷ 1e9
          </Text>
          <Text className='formula-line'>训练显存 = 权重 + 梯度 + 优化器 + 激活 + KV + 开销 + 预留</Text>
          <Text className='formula-line'>单卡 (GB) = 总显存 ÷ TP</Text>
          {TIPS.map((tip) => (
            <Text className='tip-text' key={tip}>
              {tip}
            </Text>
          ))}
        </View>
      </View>
    </PageWithMenu>
  )
}

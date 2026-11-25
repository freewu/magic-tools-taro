// 大模型显存估算。纯逻辑，不依赖界面。
//
// 推理：总显存 = 权重 + KV Cache + 激活 / 框架开销 + 预留余量
//   · 权重 GB = 参数量(B) × 每参数字节数（FP32 4 / BF16 2 / INT8 1 / INT4 0.5）
//   · KV GB = 2 × 层数 × KV 头数 × head 维度 × 上下文长度 × KV 精度字节 × 并发 / 1e9
//   · 激活与框架开销、预留余量按比例叠加（CUDA 上下文、显存碎片、临时张量）
// 训练：总显存 = 权重 + 梯度 + 优化器状态 + 激活 + KV + 开销 + 预留
//   · 梯度与权重同精度，优化器按 AdamW FP32（主权重 4 + 一阶 4 + 二阶 4 = 12 字节 / 参数）
//   · BF16 + AdamW 全参训练 ≈ 16 字节 / 参数（不含激活），即约 8 倍 BF16 权重
// 多卡：权重与 KV 都按张量并行 TP 均分，单卡 ≈ 总量 / TP。
// 单位统一用 1e9 字节（厂商标称 GB），实际 GiB 会小 7% 左右。

import { readStorage, writeStorage } from '../../../common/storage'

export type Precision = {
  key: string
  label: string
  bytes: number
}

/** 权重量化精度 */
export const WEIGHT_PRECISIONS: Precision[] = [
  { key: 'fp32', label: 'FP32', bytes: 4 },
  { key: 'bf16', label: 'BF16 / FP16', bytes: 2 },
  { key: 'int8', label: 'FP8 / INT8', bytes: 1 },
  { key: 'int4', label: 'INT4', bytes: 0.5 }
]

/** KV Cache 精度 */
export const KV_PRECISIONS: Precision[] = [
  { key: 'bf16', label: 'BF16', bytes: 2 },
  { key: 'fp8', label: 'FP8', bytes: 1 }
]

/** 注意力结构预设（层数 / KV 头数 / 单头维度），KV 头数已按 GQA 填好 */
export type ModelPreset = {
  name: string
  paramsB: number
  layers: number
  kvHeads: number
  headDim: number
}

export const MODEL_PRESETS: ModelPreset[] = [
  { name: 'Llama 3.2 1B', paramsB: 1.2, layers: 16, kvHeads: 8, headDim: 64 },
  { name: 'Llama 3.2 3B', paramsB: 3, layers: 28, kvHeads: 8, headDim: 128 },
  { name: 'Llama 3.1 8B', paramsB: 8, layers: 32, kvHeads: 8, headDim: 128 },
  { name: 'Qwen2.5 7B', paramsB: 7, layers: 28, kvHeads: 4, headDim: 128 },
  { name: 'Qwen3 8B', paramsB: 8, layers: 36, kvHeads: 8, headDim: 128 },
  { name: 'GLM-4 9B', paramsB: 9, layers: 40, kvHeads: 4, headDim: 128 },
  { name: 'Gemma 2 27B', paramsB: 27, layers: 46, kvHeads: 16, headDim: 128 },
  { name: 'Qwen2.5 32B', paramsB: 32, layers: 64, kvHeads: 8, headDim: 128 },
  { name: 'Llama 3.1 70B', paramsB: 70, layers: 80, kvHeads: 8, headDim: 128 },
  { name: 'Qwen2.5 72B', paramsB: 72, layers: 80, kvHeads: 8, headDim: 128 }
]

// ---------------------------------------------------------------- 输入

export const MODE_INFER = 0
export const MODE_TRAIN = 1

export type VramInput = {
  /** 0 推理 / 1 训练 */
  mode: number
  paramsB: number
  weightPrecision: number
  layers: number
  kvHeads: number
  headDim: number
  contextLength: number
  kvPrecision: number
  /** 并发序列数 */
  batch: number
  /** 激活 / 框架开销（占 权重 + KV + 训练项 的比例，%） */
  overheadPct: number
  /** 预留余量（%） */
  reservePct: number
  /** 训练时的激活开销（占权重的比例，%） */
  activationPct: number
  /** 张量并行卡数 */
  tp: number
}

export function defaultVramInput(): VramInput {
  return {
    mode: MODE_INFER,
    paramsB: 7,
    weightPrecision: 1,
    layers: 28,
    kvHeads: 4,
    headDim: 128,
    contextLength: 8192,
    kvPrecision: 0,
    batch: 1,
    overheadPct: 8,
    reservePct: 10,
    activationPct: 20,
    tp: 1
  }
}

// ---------------------------------------------------------------- 结果

export type VramResult = {
  /** 各分项（GB） */
  weightGB: number
  kvGB: number
  gradGB: number
  optimizerGB: number
  activationGB: number
  overheadGB: number
  reserveGB: number
  totalGB: number
  /** 单卡（按 TP 均分） */
  perCardGB: number
  /** 训练总字节 / 参数，方便核对 */
  trainBytesPerParam: number
}

export function fmtGB(value: number): string {
  if (value < 0) {
    return '0 GB'
  }
  if (value >= 10) {
    return `${(Math.round(value * 10) / 10).toFixed(1)} GB`
  }
  return `${(Math.round(value * 100) / 100).toFixed(2)} GB`
}

export function fmtPct(part: number, total: number): string {
  if (total <= 0) {
    return '0%'
  }
  return `${(Math.round((part / total) * 1000) / 10).toFixed(1)}%`
}

export function computeVram(input: VramInput): VramResult {
  const weightBytes = WEIGHT_PRECISIONS[input.weightPrecision].bytes
  const kvBytes = KV_PRECISIONS[input.kvPrecision].bytes

  const result: VramResult = {
    weightGB: 0,
    kvGB: 0,
    gradGB: 0,
    optimizerGB: 0,
    activationGB: 0,
    overheadGB: 0,
    reserveGB: 0,
    totalGB: 0,
    perCardGB: 0,
    trainBytesPerParam: 0
  }

  // 权重：参数量(B) × 每参数字节
  result.weightGB = input.paramsB * weightBytes

  // KV Cache：2 × L × Hkv × Dhead × S × 字节 × 并发
  const kvBytesTotal =
    2 * input.layers * input.kvHeads * input.headDim * input.contextLength * kvBytes * input.batch
  result.kvGB = kvBytesTotal / 1000000000

  let base = result.weightGB + result.kvGB
  if (input.mode === MODE_TRAIN) {
    // 梯度与权重同精度
    result.gradGB = input.paramsB * weightBytes
    // AdamW：主权重 FP32 + 一阶矩 + 二阶矩，共 12 字节 / 参数
    result.optimizerGB = input.paramsB * 12
    // 激活按权重的比例粗估（随 batch、序列长度增长，差异很大）
    result.activationGB = (result.weightGB * input.activationPct) / 100
    result.trainBytesPerParam = weightBytes * 2 + 12
    base = base + result.gradGB + result.optimizerGB + result.activationGB
  }

  result.overheadGB = (base * input.overheadPct) / 100
  result.reserveGB = ((base + result.overheadGB) * input.reservePct) / 100
  result.totalGB = base + result.overheadGB + result.reserveGB
  const tp = input.tp >= 1 ? input.tp : 1
  result.perCardGB = result.totalGB / tp
  return result
}

/** 按单卡显存档位估算需要的卡数（向上取整，至少 1 张） */
export function cardsNeeded(totalGB: number, cardGB: number): number {
  if (cardGB <= 0) {
    return 1
  }
  const count = Math.ceil(totalGB / cardGB)
  return count < 1 ? 1 : count
}

/** 推荐在给定可用显存下，能放下的最佳并发数（KV Cache 线性增长，二分查找） */
export function maxBatchOf(input: VramInput, availableGB: number): number {
  let low = 1
  let high = 512
  if (computeVramOfBatch(input, 1) > availableGB) {
    return 0
  }
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2)
    if (computeVramOfBatch(input, mid) <= availableGB) {
      low = mid
    } else {
      high = mid - 1
    }
  }
  return low
}

function computeVramOfBatch(input: VramInput, batch: number): number {
  return computeVram({ ...input, batch }).totalGB
}

// ---------------------------------------------------------------- 数字解析

/** 解析正数（允许小数），非法返回 -1 */
export function parseNumberText(text: string): number {
  const s = text.trim()
  if (s.length === 0 || s.length > 12) {
    return -1
  }
  let dotCount = 0
  let digits = 0
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i)
    if (code === 46) {
      // 小数点
      dotCount++
      if (dotCount > 1) {
        return -1
      }
    } else if (code >= 48 && code <= 57) {
      digits++
    } else {
      return -1
    }
  }
  if (digits === 0) {
    return -1
  }
  const value = parseFloat(s)
  if (value < 0 || value > 1000000000) {
    return -1
  }
  return value
}

/** 解析正整数（层数、头数、上下文、并发、卡数），非法返回 -1 */
export function parseIntegerText(text: string): number {
  const s = text.trim()
  if (s.length === 0 || s.length > 9) {
    return -1
  }
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i)
    if (code < 48 || code > 57) {
      return -1
    }
  }
  const value = parseInt(s, 10)
  if (value <= 0 || value > 1000000000) {
    return -1
  }
  return value
}

/** 上下文长度 → 「128K」这种文案 */
export function contextText(length: number): string {
  if (length >= 1048576) {
    return `${Math.round((length / 1048576) * 10) / 10}M`
  }
  if (length >= 1024) {
    return `${Math.round(length / 1024)}K`
  }
  return `${length}`
}

/** 参数量 → 「70B」这种文案 */
export function paramsText(paramsB: number): string {
  return `${Math.round(paramsB * 10) / 10}B`
}

/** 显存档位推荐 */
export type CardFit = {
  cardGB: number
  cards: number
  fits: boolean
  text: string
}

export function cardFitsOf(totalGB: number): CardFit[] {
  const sizes: number[] = [24, 48, 80, 141]
  return sizes.map((size) => {
    const count = cardsNeeded(totalGB, size)
    return { cardGB: size, cards: count, fits: count === 1, text: `${count} × ${size} GB` }
  })
}

// ---------------------------------------------------------------- 记住上次输入

const VRAM_MODE_KEY = 'vram-mode'
const VRAM_PARAMS_KEY = 'vram-params'
const VRAM_WEIGHT_KEY = 'vram-weight-precision'
const VRAM_LAYERS_KEY = 'vram-layers'
const VRAM_KV_HEADS_KEY = 'vram-kv-heads'
const VRAM_HEAD_DIM_KEY = 'vram-head-dim'
const VRAM_CONTEXT_KEY = 'vram-context'
const VRAM_KV_PRECISION_KEY = 'vram-kv-precision'
const VRAM_BATCH_KEY = 'vram-batch'
const VRAM_TP_KEY = 'vram-tp'

export type VramDraft = {
  modeText: string
  paramsText: string
  weightPrecision: number
  layersText: string
  kvHeadsText: string
  headDimText: string
  contextText: string
  kvPrecision: number
  batchText: string
  tpText: string
}

export function defaultVramDraft(): VramDraft {
  return {
    modeText: '0',
    paramsText: '7',
    weightPrecision: 1,
    layersText: '28',
    kvHeadsText: '4',
    headDimText: '128',
    contextText: '8192',
    kvPrecision: 0,
    batchText: '1',
    tpText: '1'
  }
}

export function loadVramDraft(): VramDraft {
  const draft = defaultVramDraft()
  if (readStorage(VRAM_MODE_KEY) === '1') {
    draft.modeText = '1'
  }
  const params = readStorage(VRAM_PARAMS_KEY)
  if (params !== '') {
    draft.paramsText = params
  }
  const weight = parseIntegerText(readStorage(VRAM_WEIGHT_KEY))
  if (weight >= 0 && weight < WEIGHT_PRECISIONS.length) {
    draft.weightPrecision = weight
  }
  const layers = readStorage(VRAM_LAYERS_KEY)
  if (layers !== '') {
    draft.layersText = layers
  }
  const kvHeads = readStorage(VRAM_KV_HEADS_KEY)
  if (kvHeads !== '') {
    draft.kvHeadsText = kvHeads
  }
  const headDim = readStorage(VRAM_HEAD_DIM_KEY)
  if (headDim !== '') {
    draft.headDimText = headDim
  }
  const context = readStorage(VRAM_CONTEXT_KEY)
  if (context !== '') {
    draft.contextText = context
  }
  const kvPrecision = parseInt(readStorage(VRAM_KV_PRECISION_KEY), 10)
  if (kvPrecision >= 0 && kvPrecision < KV_PRECISIONS.length) {
    draft.kvPrecision = kvPrecision
  }
  const batch = readStorage(VRAM_BATCH_KEY)
  if (batch !== '') {
    draft.batchText = batch
  }
  const tp = readStorage(VRAM_TP_KEY)
  if (tp !== '') {
    draft.tpText = tp
  }
  return draft
}

export function saveVramDraft(draft: VramDraft): void {
  writeStorage(VRAM_MODE_KEY, draft.modeText)
  writeStorage(VRAM_PARAMS_KEY, draft.paramsText)
  writeStorage(VRAM_WEIGHT_KEY, `${draft.weightPrecision}`)
  writeStorage(VRAM_LAYERS_KEY, draft.layersText)
  writeStorage(VRAM_KV_HEADS_KEY, draft.kvHeadsText)
  writeStorage(VRAM_HEAD_DIM_KEY, draft.headDimText)
  writeStorage(VRAM_CONTEXT_KEY, draft.contextText)
  writeStorage(VRAM_KV_PRECISION_KEY, `${draft.kvPrecision}`)
  writeStorage(VRAM_BATCH_KEY, draft.batchText)
  writeStorage(VRAM_TP_KEY, draft.tpText)
}

// BMI 计算的业务逻辑、默认单位与上次输入（草稿）的存取

import { readStorage, writeStorage } from '../../../common/storage'

import { formatFixed } from '../../../common/format'
import { lengthUnitValues, weightUnitValues } from './data'

const LENGTH_UNIT_KEY = 'bmi-default-length-unit'
const WEIGHT_UNIT_KEY = 'bmi-default-weight-unit'
const DRAFT_KEY = 'bmi-draft'

/** 首次进入页面时的默认身体数据（170 cm / 65 kg，按当前默认单位换算后填充） */
const DEFAULT_HEIGHT_M = 1.7
const DEFAULT_WEIGHT_KG = 65

// ---------------------------------------------------------------- 分级

/** 一个 BMI 分级：名称、主色、浅色底（胶囊/建议卡）、描边色与建议文案 */
export type BmiLevelInfo = {
  text: string
  color: string
  tint: string
  border: string
  advice: string
}

/** 按中国成人 BMI 标准（WS/T 428—2013）分级：18.5 / 24 / 28 */
export function bmiLevelOf(bmi: number): BmiLevelInfo {
  if (bmi < 18.5) {
    return {
      text: '偏瘦',
      color: '#909399',
      tint: '#F2F3F5',
      border: '#D8DAE0',
      advice: '体重偏低，注意均衡饮食并适当增加力量训练。'
    }
  }
  if (bmi < 24) {
    return {
      text: '正常',
      color: '#07C160',
      tint: '#E8F8EF',
      border: '#A9E4C4',
      advice: '体重处于正常范围，保持现有作息与运动习惯即可。'
    }
  }
  if (bmi < 28) {
    return {
      text: '超重',
      color: '#FF9900',
      tint: '#FFF4E6',
      border: '#FFD8A6',
      advice: '体重偏高，建议控制精制碳水摄入并增加有氧运动。'
    }
  }
  return {
    text: '肥胖',
    color: '#FA5151',
    tint: '#FFECEC',
    border: '#FFBFBF',
    advice: '已进入肥胖区间，建议咨询医生或营养师制定减重方案。'
  }
}

// ---------------------------------------------------------------- 刻度条

/** 刻度条范围：14 ~ 34（与四段分级一一对应） */
export const BMI_GAUGE_MIN = 14
export const BMI_GAUGE_MAX = 34

/** 刻度条上的一段 */
export type BmiGaugeSegment = {
  label: string
  width: string
  color: string
}

/** 四段分级的宽度（百分比），边界正好落在 18.5 / 24 / 28 上 */
export function bmiGaugeSegments(): BmiGaugeSegment[] {
  return [
    { label: '偏瘦', width: '22.5', color: '#909399' },
    { label: '正常', width: '27.5', color: '#07C160' },
    { label: '超重', width: '20', color: '#FF9900' },
    { label: '肥胖', width: '30', color: '#FA5151' }
  ]
}

/** 刻度条下方的边界标注（分段宽度共用上面那份，最后一段留空） */
export function bmiGaugeLabels(): string[] {
  return ['18.5', '24', '28', '']
}

/** 当前 BMI 在刻度条上的位置（百分比字符串，用于定位游标） */
export function gaugePercent(bmi: number): string {
  const ratio = (bmi - BMI_GAUGE_MIN) / (BMI_GAUGE_MAX - BMI_GAUGE_MIN)
  if (!(ratio > 0)) {
    return '0'
  }
  if (ratio > 1) {
    return '100'
  }
  return (ratio * 100).toFixed(2)
}

// ---------------------------------------------------------------- 理想体重

/** 理想体重（按 BMI 21 反推，单位 kg） */
export function idealWeightKg(lengthM: number): number {
  return 21 * lengthM * lengthM
}

/** 公斤 → 目标体重单位（与 data.ts 的单位值对应） */
export function fromKilograms(kg: number, unit: string): number {
  if (unit === 'jin') {
    return kg * 2
  }
  if (unit === 'lb') {
    return kg / 0.45359237
  }
  return kg
}

/** 米 → 目标身高单位（与 data.ts 的单位值对应） */
export function fromMeters(m: number, unit: string): number {
  if (unit === 'cm') {
    return m * 100
  }
  if (unit === 'ft') {
    return m / 0.3048
  }
  return m
}

// ---------------------------------------------------------------- 默认单位

/** 设置默认身高单位 */
export function setDefaultLengthUnit(unit: string): void {
  writeStorage(LENGTH_UNIT_KEY, unit)
}

/** 获取默认身高单位 */
export function getDefaultLengthUnit(): string {
  const value = readStorage(LENGTH_UNIT_KEY)
  if (value === '') {
    return 'cm'
  }
  return value
}

/** 设置默认体重单位 */
export function setDefaultWeightUnit(unit: string): void {
  writeStorage(WEIGHT_UNIT_KEY, unit)
}

/** 获取默认体重单位 */
export function getDefaultWeightUnit(): string {
  const value = readStorage(WEIGHT_UNIT_KEY)
  if (value === '') {
    return 'kg'
  }
  return value
}

// ---------------------------------------------------------------- 上次输入

/** 上次输入的身高体重与所用单位 */
export type BmiDraft = {
  lengthInput: string
  weightInput: string
  lengthUnit: string
  weightUnit: string
}

function isKnownUnit(values: string[], unit: string): boolean {
  for (let i = 0; i < values.length; i++) {
    if (values[i] === unit) {
      return true
    }
  }
  return false
}

/** 草稿的存储文本（字段之间用换行分隔，便于校验与去重） */
export function bmiDraftText(draft: BmiDraft): string {
  return `${draft.lengthInput}\n${draft.weightInput}\n${draft.lengthUnit}\n${draft.weightUnit}`
}

/** 读取上次输入；没存过或不完整时返回默认值（170 cm / 65 kg 按默认单位换算） */
export function loadBmiDraft(): BmiDraft {
  const lengthUnit = getDefaultLengthUnit()
  const weightUnit = getDefaultWeightUnit()
  const draft: BmiDraft = {
    lengthInput: formatFixed(fromMeters(DEFAULT_HEIGHT_M, lengthUnit), 2),
    weightInput: formatFixed(fromKilograms(DEFAULT_WEIGHT_KG, weightUnit), 2),
    lengthUnit,
    weightUnit
  }
  const raw = readStorage(DRAFT_KEY)
  if (raw === '') {
    return draft
  }
  const parts = raw.split('\n')
  if (parts.length < 4) {
    return draft
  }
  // 逐个字段校验，坏数据只回落该字段，不整体丢弃
  const height = parseFloat(parts[0])
  if (isFinite(height) && height > 0) {
    draft.lengthInput = parts[0]
  }
  const weight = parseFloat(parts[1])
  if (isFinite(weight) && weight > 0) {
    draft.weightInput = parts[1]
  }
  if (isKnownUnit(lengthUnitValues, parts[2])) {
    draft.lengthUnit = parts[2]
  }
  if (isKnownUnit(weightUnitValues, parts[3])) {
    draft.weightUnit = parts[3]
  }
  return draft
}

/** 保存上次输入 */
export function saveBmiDraft(draft: BmiDraft): void {
  writeStorage(DRAFT_KEY, bmiDraftText(draft))
}

// ---------------------------------------------------------------- 单位换算

/** 把输入值换算成公斤（无法识别的单位返回 -1） */
export function toKilograms(value: number, unit: string): number {
  if (unit === 'kg') {
    return value
  }
  if (unit === 'jin') {
    return value / 2
  }
  if (unit === 'lb') {
    return value * 0.45359237
  }
  return -1
}

/** 把输入值换算成米（无法识别的单位返回 -1） */
export function toMeters(value: number, unit: string): number {
  if (unit === 'm') {
    return value
  }
  if (unit === 'cm') {
    return value / 100
  }
  if (unit === 'ft') {
    return value * 0.3048
  }
  return -1
}

/** 计算正常体重区间（按中国标准 BMI 18.5 - 23.9 反推，返回的是用户所选体重单位） */
export function calcStandardValue(lengthM: number, weightUnit: string): string[] {
  const min = 18.5 * lengthM * lengthM
  const max = 23.9 * lengthM * lengthM
  if (weightUnit === 'jin') {
    return [(min * 2).toFixed(1), (max * 2).toFixed(1)]
  }
  if (weightUnit === 'lb') {
    return [(min / 0.45359237).toFixed(1), (max / 0.45359237).toFixed(1)]
  }
  return [min.toFixed(1), max.toFixed(1)]
}

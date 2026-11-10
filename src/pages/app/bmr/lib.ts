// 基础代谢（BMR）与每日总消耗（TDEE）
//
// 公式用 Mifflin-St Jeor：
//   男：10 × 体重(kg) + 6.25 × 身高(cm) − 5 × 年龄 + 5
//   女：10 × 体重(kg) + 6.25 × 身高(cm) − 5 × 年龄 − 161

import { readStorage, writeStorage } from '../../../common/storage'

export type GenderOption = {
  code: string
  label: string
  /** 公式里的常数项（男 +5，女 −161） */
  offset: number
}

export const BMR_GENDERS: GenderOption[] = [
  { code: 'male', label: '男', offset: 5 },
  { code: 'female', label: '女', offset: -161 }
]

export type ActivityLevel = {
  code: string
  label: string
  /** 乘在 BMR 上的活动系数 */
  factor: number
}

export const BMR_ACTIVITIES: ActivityLevel[] = [
  { code: 'sedentary', label: '久坐（几乎不动）', factor: 1.2 },
  { code: 'light', label: '轻度活动（每周 1–3 次）', factor: 1.375 },
  { code: 'moderate', label: '中度活动（每周 3–5 次）', factor: 1.55 },
  { code: 'active', label: '高强度（每周 6–7 次）', factor: 1.725 },
  { code: 'very_active', label: '极高强度（体力工作 + 训练）', factor: 1.9 }
]

export function genderByCode(code: string): GenderOption | null {
  for (let i = 0; i < BMR_GENDERS.length; i++) {
    if (BMR_GENDERS[i].code === code) {
      return BMR_GENDERS[i]
    }
  }
  return null
}

export function activityByCode(code: string): ActivityLevel | null {
  for (let i = 0; i < BMR_ACTIVITIES.length; i++) {
    if (BMR_ACTIVITIES[i].code === code) {
      return BMR_ACTIVITIES[i]
    }
  }
  return null
}

export function genderIndexOf(code: string): number {
  for (let i = 0; i < BMR_GENDERS.length; i++) {
    if (BMR_GENDERS[i].code === code) {
      return i
    }
  }
  return 0
}

export function activityIndexOf(code: string): number {
  for (let i = 0; i < BMR_ACTIVITIES.length; i++) {
    if (BMR_ACTIVITIES[i].code === code) {
      return i
    }
  }
  return 0
}

export type BmrResult = {
  /** 基础代谢（千卡 / 天） */
  bmr: number
  genderCode: string
  /** 年龄（整岁） */
  age: number
  heightCm: number
  weightKg: number
  activityCode: string
  /** 当前活动水平的每日总消耗 */
  tdee: number
  /** 日常活动带来的额外消耗（TDEE − BMR） */
  activityCalories: number
  /** 各活动水平的 TDEE，顺序同 BMR_ACTIVITIES */
  tdeeByActivity: number[]
}

/**
 * 计算基础代谢；体重 0–500kg、年龄 1–120 岁、身高 30–300cm 之外返回 null。
 * 身高小于 3 时按「米」理解（如 1.75），与 BMI 工具一致。
 */
export function calculateBmr(
  genderCode: string,
  age: number,
  height: number,
  weightKg: number,
  activityCode: string
): BmrResult | null {
  if (!isFinite(weightKg) || weightKg <= 0 || weightKg > 500) {
    return null
  }
  if (!isFinite(age)) {
    return null
  }
  const years = Math.round(age)
  if (years < 1 || years > 120) {
    return null
  }
  if (!isFinite(height) || height <= 0) {
    return null
  }
  const cm = height < 3 ? height * 100 : height
  if (cm < 30 || cm > 300) {
    return null
  }
  const gender = genderByCode(genderCode)
  if (gender == null) {
    return null
  }
  const bmr = 10 * weightKg + 6.25 * cm - 5 * years + gender.offset
  if (!isFinite(bmr) || bmr <= 0) {
    return null
  }
  const activity = activityByCode(activityCode)
  const factor = activity == null ? 1 : activity.factor
  const tdee = bmr * factor
  const byActivity: number[] = []
  for (let i = 0; i < BMR_ACTIVITIES.length; i++) {
    byActivity.push(bmr * BMR_ACTIVITIES[i].factor)
  }
  return {
    bmr,
    genderCode,
    age: years,
    heightCm: cm,
    weightKg,
    activityCode,
    tdee,
    activityCalories: tdee - bmr,
    tdeeByActivity: byActivity
  }
}

// ---------------------------------------------------------------- 上次输入

/** 存储键：与其它工具一致，单独一个键 */
const BMR_DRAFT_KEY = 'bmr-draft'

/** 首次打开时的默认值（男 / 30 岁 / 175cm / 70kg / 轻度活动） */
export const DEFAULT_AGE_TEXT = '30'
export const DEFAULT_HEIGHT_TEXT = '175'
export const DEFAULT_WEIGHT_TEXT = '70'
export const DEFAULT_GENDER_CODE = 'male'
export const DEFAULT_ACTIVITY_CODE = 'light'

/** 页面输入的一份快照 */
export type BmrDraft = {
  genderCode: string
  /** 输入框原文，原样存回去，避免 1.75 被改写成 1.750 */
  ageText: string
  heightText: string
  weightText: string
  activityCode: string
}

export function defaultBmrDraft(): BmrDraft {
  return {
    genderCode: DEFAULT_GENDER_CODE,
    ageText: DEFAULT_AGE_TEXT,
    heightText: DEFAULT_HEIGHT_TEXT,
    weightText: DEFAULT_WEIGHT_TEXT,
    activityCode: DEFAULT_ACTIVITY_CODE
  }
}

/** 输入框原文是否是一个可用的正数 */
function isValidNumberText(text: string): boolean {
  if (text === '') {
    return false
  }
  const value = parseFloat(text)
  return isFinite(value) && value > 0
}

/** 读取上次输入：缺失或字段非法时逐项回落到默认值 */
export function loadBmrDraft(): BmrDraft {
  const draft = defaultBmrDraft()
  const raw = readStorage(BMR_DRAFT_KEY)
  if (raw === '') {
    return draft
  }
  const parts = raw.split(',')
  if (parts.length < 5) {
    return draft
  }
  if (genderByCode(parts[0]) != null) {
    draft.genderCode = parts[0]
  }
  if (isValidNumberText(parts[1])) {
    draft.ageText = parts[1]
  }
  if (isValidNumberText(parts[2])) {
    draft.heightText = parts[2]
  }
  if (isValidNumberText(parts[3])) {
    draft.weightText = parts[3]
  }
  if (activityByCode(parts[4]) != null) {
    draft.activityCode = parts[4]
  }
  return draft
}

/** 存成逗号串：性别,年龄,身高,体重,活动 */
export function saveBmrDraft(draft: BmrDraft): void {
  writeStorage(
    BMR_DRAFT_KEY,
    [draft.genderCode, draft.ageText, draft.heightText, draft.weightText, draft.activityCode].join(',')
  )
}

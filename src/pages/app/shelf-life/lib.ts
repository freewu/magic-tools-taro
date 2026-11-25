// 保质期计算：生产日期 + 保质期时长 → 到期日、剩余天数与进度。纯逻辑，不依赖界面。
//
// 日期一律用「年月日」三个数字表示（不用 Date，避免时区 / 夏令时把「+1 天」算成 23 或 25 小时），
// 天数差用自 1970-01-01 起的日序号（Howard Hinnant 的 civil_from_days 算法）。
//
// 时长单位：天 / 周 直接加天数；月 / 年 按日历顺延，月末自动回退
// （1 月 31 日 + 1 个月 = 2 月 28/29 日，2 月 29 日 + 1 年 = 2 月 28 日）。

import { readStorage, writeStorage } from '../../../common/storage'

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

export function daysInMonth(y: number, m: number): number {
  if (m === 2) {
    return isLeapYear(y) ? 29 : 28
  }
  if (m === 4 || m === 6 || m === 9 || m === 11) {
    return 30
  }
  return 31
}

export function isValidDate(y: number, m: number, d: number): boolean {
  if (!isFinite(y) || y < 1 || y > 9999) {
    return false
  }
  if (!isFinite(m) || m < 1 || m > 12) {
    return false
  }
  return d >= 1 && d <= daysInMonth(y, m)
}

/** 年月日 → 自 1970-01-01 起的天数（1970-01-01 = 0，可正可负） */
export function dayNumber(y: number, m: number, d: number): number {
  let year = y
  if (m <= 2) {
    year = year - 1
  }
  const era = Math.floor((year >= 0 ? year : year - 399) / 400)
  const yoe = year - era * 400
  const mp = m > 2 ? m - 3 : m + 9
  const doy = Math.floor((153 * mp + 2) / 5) + d - 1
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy
  return era * 146097 + doe - 719468
}

/** 天序号 → 年月日 [y, m, d] */
export function dateOfDayNumber(days: number): number[] {
  const z = days + 719468
  const era = Math.floor((z >= 0 ? z : z - 146096) / 146097)
  const doe = z - era * 146097
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365)
  const y = yoe + era * 400
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100))
  const mp = Math.floor((5 * doy + 2) / 153)
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1
  const m = mp < 10 ? mp + 3 : mp - 9
  const year = m <= 2 ? y + 1 : y
  return [year, m, d]
}

/** 星期：0 = 周日 */
export function weekdayOfDayNumber(days: number): number {
  // 1970-01-01 是周四
  return (((days + 4) % 7) + 7) % 7
}

export function weekdayText(weekday: number): string {
  const names: string[] = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return names[((weekday % 7) + 7) % 7]
}

/** 2026-12-08 这种格式 */
export function dateText(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`
}

export function dateTextOfDays(days: number): string {
  const parts = dateOfDayNumber(days)
  return dateText(parts[0], parts[1], parts[2])
}

/** 「2026-12-08」→ [2026, 12, 8]，非法返回空数组 */
export function parseDateText(text: string): number[] {
  const trimmed = text.trim()
  if (trimmed.length !== 10) {
    return []
  }
  const y = parseInt(trimmed.substring(0, 4), 10)
  const m = parseInt(trimmed.substring(5, 7), 10)
  const d = parseInt(trimmed.substring(8, 10), 10)
  if (!isValidDate(y, m, d)) {
    return []
  }
  return [y, m, d]
}

/** 日历顺延 N 个月，目标月天数不够时回退到月末 */
export function addMonths(y: number, m: number, d: number, months: number): number[] {
  const total = y * 12 + (m - 1) + months
  const nextYear = Math.floor(total / 12)
  const nextMonth = total - nextYear * 12 + 1
  const limit = daysInMonth(nextYear, nextMonth)
  const nextDay = d > limit ? limit : d
  return [nextYear, nextMonth, nextDay]
}

export function addYears(y: number, m: number, d: number, years: number): number[] {
  return addMonths(y, m, d, years * 12)
}

// ---------------------------------------------------------------- 保质期单位

export type ShelfUnit = {
  /** 稳定标识：day / week / month / year */
  code: string
  label: string
}

export const SHELF_UNITS: ShelfUnit[] = [
  { code: 'day', label: '天' },
  { code: 'week', label: '周' },
  { code: 'month', label: '月' },
  { code: 'year', label: '年' }
]

export function shelfUnitByCode(code: string): ShelfUnit {
  for (let i = 0; i < SHELF_UNITS.length; i++) {
    if (SHELF_UNITS[i].code === code) {
      return SHELF_UNITS[i]
    }
  }
  return SHELF_UNITS[0]
}

/** 常用保质期一键代入（片装 / 瓶装 / 冷冻食品常见的几档） */
export type ShelfPreset = {
  label: string
  value: number
  unit: string
}

export const SHELF_PRESETS: ShelfPreset[] = [
  { label: '7 天', value: 7, unit: 'day' },
  { label: '15 天', value: 15, unit: 'day' },
  { label: '30 天', value: 30, unit: 'day' },
  { label: '3 个月', value: 3, unit: 'month' },
  { label: '6 个月', value: 6, unit: 'month' },
  { label: '12 个月', value: 12, unit: 'month' },
  { label: '18 个月', value: 18, unit: 'month' },
  { label: '24 个月', value: 24, unit: 'month' },
  { label: '36 个月', value: 36, unit: 'month' }
]

// ---------------------------------------------------------------- 计算

/** 时长 → 到期日（年月日） */
export function endDateOf(production: number[], value: number, unit: string): number[] {
  const y = production[0]
  const m = production[1]
  const d = production[2]
  if (unit === 'month') {
    return addMonths(y, m, d, value)
  }
  if (unit === 'year') {
    return addYears(y, m, d, value)
  }
  const days = unit === 'week' ? value * 7 : value
  return dateOfDayNumber(dayNumber(y, m, d) + days)
}

/** 时长文案：6 个月 / 18 个月（长于 12 个月也按月说，方便对照包装） */
export function shelfSpanText(value: number, unit: string): string {
  if (unit === 'day') {
    return `${value} 天`
  }
  if (unit === 'week') {
    return `${value} 周`
  }
  if (unit === 'year') {
    return `${value} 年`
  }
  return `${value} 个月`
}

/** 天数 → 「约 N 个月」/「约 N 年」（30 天一个月、365 天一年，粗略折算） */
export function monthsTextOf(days: number): string {
  if (days < 30) {
    return `${days} 天`
  }
  if (days >= 365) {
    const years = Math.round((days / 365) * 10) / 10
    const wholeYears = Math.abs(years - Math.round(years)) < 0.0001
    return `约 ${wholeYears ? `${Math.round(years)}` : years.toFixed(1)} 年`
  }
  const months = Math.round((days / 30) * 10) / 10
  const isWhole = Math.abs(months - Math.round(months)) < 0.0001
  return `约 ${isWhole ? `${Math.round(months)}` : months.toFixed(1)} 个月`
}

export type ShelfResult = {
  /** 输入是否合法 */
  valid: boolean
  error: string
  /** 生产日期 / 到期日 */
  productionText: string
  endText: string
  endWeekday: string
  /** 保质期时长文案，如「6 个月」 */
  spanText: string
  /** 总天数（到期日 − 生产日期） */
  totalDays: number
  /** 剩余天数（到期日 − 今天，负数表示已过期） */
  remainDays: number
  /** 已过天数（今天 − 生产日期） */
  usedDays: number
  /** 新鲜状态：fresh 新鲜 / soon 临近到期 / today 今天到期 / expired 已过期 */
  status: string
  statusText: string
  /** 已过百分比（0~1） */
  progress: number
  progressText: string
  /** 剩余天数折合，如「约 6 个月」 */
  remainMonthsText: string
}

function invalidShelf(error: string): ShelfResult {
  return {
    valid: false,
    error,
    productionText: '',
    endText: '',
    endWeekday: '',
    spanText: '',
    totalDays: 0,
    remainDays: 0,
    usedDays: 0,
    status: '',
    statusText: '',
    progress: 0,
    progressText: '',
    remainMonthsText: ''
  }
}

/** 主计算：production 为「年月日」数组，today 同为数组 */
export function shelfLifeOf(production: number[], value: number, unit: string, today: number[]): ShelfResult {
  if (production.length < 3) {
    return invalidShelf('请选择生产日期')
  }
  const py = production[0]
  const pm = production[1]
  const pd = production[2]
  if (value <= 0) {
    return invalidShelf('保质期时长要大于 0')
  }
  const prodDay = dayNumber(py, pm, pd)
  const todayDay = dayNumber(today[0], today[1], today[2])
  const end = endDateOf(production, value, unit)
  const endDay = dayNumber(end[0], end[1], end[2])
  if (prodDay > todayDay) {
    return invalidShelf('生产日期不能晚于今天')
  }
  const result = invalidShelf('')
  result.valid = true
  result.productionText = dateText(py, pm, pd)
  result.endText = dateText(end[0], end[1], end[2])
  result.endWeekday = weekdayText(weekdayOfDayNumber(endDay))
  result.spanText = shelfSpanText(value, unit)
  result.totalDays = endDay - prodDay
  result.remainDays = endDay - todayDay
  result.usedDays = todayDay - prodDay
  // 进度：已过天数 / 总天数，超期后按 100% 算
  let progress = 1
  if (result.totalDays > 0) {
    progress = result.usedDays / result.totalDays
  }
  if (progress < 0) {
    progress = 0
  }
  if (progress > 1) {
    progress = 1
  }
  result.progress = progress
  result.progressText = `${Math.round(progress * 100)}%`
  // 状态：过期 / 今天到期 / 临近到期（剩余 <= 20% 或 3 天以内）/ 新鲜
  const soonDays = Math.max(3, Math.round(result.totalDays * 0.2))
  if (result.remainDays < 0) {
    result.status = 'expired'
    result.statusText = `已过期 ${-result.remainDays} 天`
    result.remainMonthsText = ''
  } else if (result.remainDays === 0) {
    result.status = 'today'
    result.statusText = '今天到期'
    result.remainMonthsText = ''
  } else {
    result.status = result.remainDays <= soonDays ? 'soon' : 'fresh'
    result.statusText = `还剩 ${result.remainDays} 天`
    // 不足一个月就不重复展示折合月数
    result.remainMonthsText = result.remainDays >= 30 ? monthsTextOf(result.remainDays) : ''
  }
  return result
}

/** 状态对应的文字颜色与底色 */
export function statusColors(status: string): { color: string; bg: string } {
  if (status === 'expired') {
    return { color: '#d93025', bg: '#fdecec' }
  }
  if (status === 'today' || status === 'soon') {
    return { color: '#d97706', bg: '#fef3e2' }
  }
  return { color: '#1f9d55', bg: '#e7f7ee' }
}

/** 今天的 [年, 月, 日] */
export function todayParts(): number[] {
  const now = new Date()
  return [now.getFullYear(), now.getMonth() + 1, now.getDate()]
}

// ---------------------------------------------------------------- 上次的输入

const SHELF_PROD_KEY = 'shelf-prod-date'
const SHELF_VALUE_KEY = 'shelf-value'
const SHELF_UNIT_KEY = 'shelf-unit'

export type ShelfDraft = {
  /** 生产日期文本（YYYY-MM-DD） */
  production: string
  /** 保质期时长的输入框文本 */
  valueText: string
  unit: string
}

export function defaultShelfDraft(today: number[]): ShelfDraft {
  return { production: dateText(today[0], today[1], today[2]), valueText: '12', unit: 'month' }
}

export function loadShelfDraft(today: number[]): ShelfDraft {
  const draft = defaultShelfDraft(today)
  const production = readStorage(SHELF_PROD_KEY)
  if (parseDateText(production).length === 3) {
    draft.production = production
  }
  const valueText = readStorage(SHELF_VALUE_KEY)
  if (valueText !== '') {
    draft.valueText = valueText
  }
  const unit = readStorage(SHELF_UNIT_KEY)
  for (let i = 0; i < SHELF_UNITS.length; i++) {
    if (SHELF_UNITS[i].code === unit) {
      draft.unit = unit
      break
    }
  }
  return draft
}

export function saveShelfDraft(draft: ShelfDraft): void {
  writeStorage(SHELF_PROD_KEY, draft.production)
  writeStorage(SHELF_VALUE_KEY, draft.valueText)
  writeStorage(SHELF_UNIT_KEY, draft.unit)
}

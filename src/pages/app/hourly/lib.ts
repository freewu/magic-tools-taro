// 时薪计算：月薪 ÷（月工作天数 × 每日工作时长）

import { readStorage, writeStorage } from '../../../common/storage'

/** 月计薪天数（双休）：人社部口径 21.75 天 */
export const BASE_WORK_DAYS = 21.75

/** 历史记录最多保留多少条 */
export const HOURLY_HISTORY_LIMIT = 20

/** 本地缓存里存历史记录的键 */
const HOURLY_HISTORY_KEY = 'hourly-history'

/** 上次输入（月薪 / 制度 / 每日工时）的存储键 */
const HOURLY_DRAFT_KEY = 'hourly-draft'

// ---------------------------------------------------------------- 工作日制度

export type WorkSchedule = {
  code: string
  label: string
  /** 每月工作天数 */
  daysPerMonth: number
  /** 这种制度常见的每日工作时长（选制度时自动填入） */
  hoursPerDay: number
}

/** 双休 / 大小周 / 996 / 995 */
export const WORK_SCHEDULES: WorkSchedule[] = [
  { code: 'standard', label: '双休', daysPerMonth: BASE_WORK_DAYS, hoursPerDay: 8 },
  { code: 'alternate', label: '大小周', daysPerMonth: BASE_WORK_DAYS + 2, hoursPerDay: 8 },
  { code: 'overtime', label: '996', daysPerMonth: BASE_WORK_DAYS + 4, hoursPerDay: 10 },
  { code: 'nine_five_five', label: '995', daysPerMonth: BASE_WORK_DAYS, hoursPerDay: 10 }
]

/** 按标识查制度，找不到返回 null */
export function scheduleByCode(code: string): WorkSchedule | null {
  for (let i = 0; i < WORK_SCHEDULES.length; i++) {
    if (WORK_SCHEDULES[i].code === code) {
      return WORK_SCHEDULES[i]
    }
  }
  return null
}

/** 按标识查制度序号（radio 选中用），找不到返回 -1 */
export function scheduleIndexOf(code: string): number {
  for (let i = 0; i < WORK_SCHEDULES.length; i++) {
    if (WORK_SCHEDULES[i].code === code) {
      return i
    }
  }
  return -1
}

export function scheduleLabelOf(code: string): string {
  const schedule = scheduleByCode(code)
  return schedule == null ? code : schedule.label
}

/** 制度对应的每月工作天数 */
export function workDaysOf(code: string): number {
  const schedule = scheduleByCode(code)
  return schedule == null ? BASE_WORK_DAYS : schedule.daysPerMonth
}

// ---------------------------------------------------------------- 上次输入

/** 首次使用时的默认月薪 */
export const DEFAULT_SALARY_TEXT = '10000'

export type HourlyDraft = {
  /** 月薪输入框原文 */
  salaryText: string
  scheduleCode: string
  /** 每日工时输入框原文 */
  hoursText: string
}

export function defaultHourlyDraft(): HourlyDraft {
  return { salaryText: DEFAULT_SALARY_TEXT, scheduleCode: 'standard', hoursText: '8' }
}

function isPositive(value: number): boolean {
  return isFinite(value) && value > 0
}

/** 读取上次输入：缺失或字段越界时逐项回落到默认值 */
export function loadHourlyDraft(): HourlyDraft {
  const draft = defaultHourlyDraft()
  const raw = readStorage(HOURLY_DRAFT_KEY)
  if (raw === '') {
    return draft
  }
  const parts = raw.split(',')
  if (parts.length < 3) {
    return draft
  }
  if (isPositive(parseFloat(parts[0]))) {
    draft.salaryText = parts[0]
  }
  if (scheduleByCode(parts[1]) != null) {
    draft.scheduleCode = parts[1]
  }
  const hours = parseFloat(parts[2])
  if (isPositive(hours) && hours <= 24) {
    draft.hoursText = parts[2]
  }
  return draft
}

export function saveHourlyDraft(draft: HourlyDraft): void {
  writeStorage(HOURLY_DRAFT_KEY, [draft.salaryText, draft.scheduleCode, draft.hoursText].join(','))
}

// ---------------------------------------------------------------- 计算

export type HourlyResult = {
  /** 月薪（元） */
  monthlySalary: number
  scheduleCode: string
  hoursPerDay: number
  /** 每月工作天数 */
  workDays: number
  /** 每月工作小时数 */
  monthlyHours: number
  /** 时薪 */
  hourly: number
  /** 日薪（月薪 ÷ 工作天数） */
  dailyWage: number
}

/** 计算时薪；月薪不在 0–10 亿、每日工时不在 0–24 小时时返回 null */
export function calculateHourly(monthlySalary: number, scheduleCode: string, hoursPerDay: number): HourlyResult | null {
  if (!isFinite(monthlySalary) || monthlySalary <= 0 || monthlySalary > 1000000000) {
    return null
  }
  if (!isFinite(hoursPerDay) || hoursPerDay <= 0 || hoursPerDay > 24) {
    return null
  }
  if (scheduleByCode(scheduleCode) == null) {
    return null
  }
  const workDays = workDaysOf(scheduleCode)
  const monthlyHours = workDays * hoursPerDay
  return {
    monthlySalary,
    scheduleCode,
    hoursPerDay,
    workDays,
    monthlyHours,
    hourly: monthlyHours > 0 ? monthlySalary / monthlyHours : 0,
    dailyWage: workDays > 0 ? monthlySalary / workDays : 0
  }
}

// ---------------------------------------------------------------- 历史记录

/** 一条历史记录：算出的时薪 + 当时的输入，用于横向对比 */
export type HourlyRecord = {
  /** 时薪（元） */
  hourly: number
  monthlySalary: number
  scheduleCode: string
  hoursPerDay: number
  /** 保存时间（毫秒时间戳） */
  savedAt: number
}

export function recordOf(result: HourlyResult): HourlyRecord {
  return {
    hourly: result.hourly,
    monthlySalary: result.monthlySalary,
    scheduleCode: result.scheduleCode,
    hoursPerDay: result.hoursPerDay,
    savedAt: Date.now()
  }
}

/** 与另一条记录是不是同一组输入（避免重复记录） */
export function sameInputAs(a: HourlyRecord, b: HourlyRecord): boolean {
  return a.monthlySalary === b.monthlySalary && a.scheduleCode === b.scheduleCode && a.hoursPerDay === b.hoursPerDay
}

/** 序列化成一行文本：时薪,月薪,制度,每日工时,时间戳 */
export function encodeRecord(record: HourlyRecord): string {
  return [record.hourly, record.monthlySalary, record.scheduleCode, record.hoursPerDay, record.savedAt].join(',')
}

/** 解析一行文本；字段缺失或越界时返回 null */
export function decodeRecord(raw: string): HourlyRecord | null {
  if (raw === '') {
    return null
  }
  const parts = raw.split(',')
  if (parts.length < 5) {
    return null
  }
  const hourly = parseFloat(parts[0])
  const salary = parseFloat(parts[1])
  const hours = parseFloat(parts[3])
  const savedAt = parseFloat(parts[4])
  if (!isPositive(hourly) || !isPositive(salary) || !isPositive(hours)) {
    return null
  }
  if (hours > 24 || scheduleByCode(parts[2]) == null) {
    return null
  }
  return {
    hourly,
    monthlySalary: salary,
    scheduleCode: parts[2],
    hoursPerDay: hours,
    savedAt: isFinite(savedAt) ? savedAt : 0
  }
}

/** 读取历史记录（按保存时间倒序，最多 HOURLY_HISTORY_LIMIT 条） */
export function loadHourlyHistory(): HourlyRecord[] {
  const out: HourlyRecord[] = []
  const raw = readStorage(HOURLY_HISTORY_KEY)
  if (raw === '') {
    return out
  }
  const lines = raw.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const record = decodeRecord(lines[i])
    if (record != null) {
      out.push(record)
    }
  }
  return out
}

/** 写入历史记录：新的在最前，最多保留 HOURLY_HISTORY_LIMIT 条 */
export function saveHourlyHistory(records: HourlyRecord[]): void {
  const limit = records.length < HOURLY_HISTORY_LIMIT ? records.length : HOURLY_HISTORY_LIMIT
  const lines: string[] = []
  for (let i = 0; i < limit; i++) {
    lines.push(encodeRecord(records[i]))
  }
  writeStorage(HOURLY_HISTORY_KEY, lines.join('\n'))
}

function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`
}

/** 记录保存时间 → 「MM-DD HH:mm」 */
export function formatSavedAt(savedAt: number): string {
  if (!isFinite(savedAt) || savedAt <= 0) {
    return ''
  }
  const date = new Date(savedAt)
  return `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

/** 历史列表的一行（纯展示数据） */
export type HistoryRow = {
  /** 时薪，如「¥ 42.35 / 小时」 */
  hourlyText: string
  /** 输入摘要，如「月薪 8000 · 双休 · 每天 8 小时」 */
  detailText: string
  timeText: string
  /** 与当前结果的对比，如「比当前高 12.5%」 */
  diffText: string
  /** 是否与当前结果一致（高亮） */
  highlight: boolean
}

// 2027 放假页：日历网格、放假 / 调休标注与文案拼装

import { holidays, type HolidayPlan } from './data'

export const WEEK_LABELS: string[] = ['日', '一', '二', '三', '四', '五', '六']
const WEEKDAY_NAMES: string[] = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const MONTH_DAYS: number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

/** 日历上的一天 */
export type DayCell = {
  date: string
  day: number
  /** 是否属于当前展示的月份（前后补位为 false） */
  inMonth: boolean
  /** 'holiday' 法定放假 / 'workday' 调休上班 / 'weekend' 双休 / 'normal' 普通工作日 */
  state: string
  /** 日历格内标记：休 / 班 / 工 */
  mark: string
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

export function yearOf(date: string): number {
  return parseInt(date.substring(0, 4))
}

export function monthOf(date: string): number {
  return parseInt(date.substring(5, 7))
}

export function dayOf(date: string): number {
  return parseInt(date.substring(8, 10))
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
    return leap ? 29 : 28
  }
  return MONTH_DAYS[month - 1]
}

/** 萨基姆公式（0 = 周日），避免依赖时区的 Date 计算 */
export function weekdayOf(year: number, month: number, day: number): number {
  const offsets: number[] = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]
  let y = year
  if (month < 3) {
    y = y - 1
  }
  return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + offsets[month - 1] + day) % 7
}

export function weekdayTextOf(date: string): string {
  return WEEKDAY_NAMES[weekdayOf(yearOf(date), monthOf(date), dayOf(date))]
}

// 全部放假日 / 调休上班日：日历逐格判定用 indexOf，避免字符串区间比较
const holidayDates: string[] = []
const workDates: string[] = []

for (let i = 0; i < holidays.length; i++) {
  const plan = holidays[i]
  let y = yearOf(plan.start)
  let m = monthOf(plan.start)
  let d = dayOf(plan.start)
  const endY = yearOf(plan.end)
  const endM = monthOf(plan.end)
  const endD = dayOf(plan.end)
  while (y < endY || (y === endY && (m < endM || (m === endM && d <= endD)))) {
    holidayDates.push(dateKey(y, m, d))
    d = d + 1
    if (d > daysInMonth(y, m)) {
      d = 1
      m = m + 1
      if (m > 12) {
        m = 1
        y = y + 1
      }
    }
  }
  for (let k = 0; k < plan.workdays.length; k++) {
    workDates.push(plan.workdays[k])
  }
}

export function dayStateOf(date: string): string {
  if (workDates.indexOf(date) >= 0) {
    return 'workday'
  }
  if (holidayDates.indexOf(date) >= 0) {
    return 'holiday'
  }
  const weekday = weekdayOf(yearOf(date), monthOf(date), dayOf(date))
  if (weekday === 0 || weekday === 6) {
    return 'weekend'
  }
  return 'normal'
}

/** 日期换算成可比较的整数：20270104 */
export function dateNumber(date: string): number {
  return yearOf(date) * 10000 + monthOf(date) * 100 + dayOf(date)
}

function withinPlan(date: string, plan: HolidayPlan): boolean {
  const n = dateNumber(date)
  return n >= dateNumber(plan.start) && n <= dateNumber(plan.end)
}

/** 只看某一个节日的日历状态：别的节日不参与标注（跨月展示时用） */
export function dayStateOfPlan(date: string, plan: HolidayPlan): string {
  if (plan.workdays.indexOf(date) >= 0) {
    return 'workday'
  }
  if (withinPlan(date, plan)) {
    return 'holiday'
  }
  const weekday = weekdayOf(yearOf(date), monthOf(date), dayOf(date))
  if (weekday === 0 || weekday === 6) {
    return 'weekend'
  }
  return 'normal'
}

function markOf(state: string): string {
  if (state === 'holiday') {
    return '休'
  }
  if (state === 'workday') {
    return '班'
  }
  if (state === 'weekend') {
    return '休'
  }
  return '工'
}

/** 前后月份补位格：只显示日号，不参与节假日标注 */
function padCell(date: string, day: number): DayCell {
  return { date, day, inMonth: false, state: 'normal', mark: '' }
}

/**
 * 生成 6 行 x 7 列的月历（固定 42 格，切换月份时高度不跳动）
 * onlyPlan 不为 null 时只标注该节日（跨月展示时避免混进别的节日）
 */
export function buildMonthCells(year: number, month: number, onlyPlan: HolidayPlan | null = null): DayCell[] {
  const cells: DayCell[] = []
  const firstWeekday = weekdayOf(year, month, 1)

  let prevYear = year
  let prevMonth = month - 1
  if (prevMonth < 1) {
    prevMonth = 12
    prevYear = year - 1
  }
  const prevDays = daysInMonth(prevYear, prevMonth)
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = prevDays - i
    cells.push(padCell(dateKey(prevYear, prevMonth, day), day))
  }

  const dim = daysInMonth(year, month)
  for (let day = 1; day <= dim; day++) {
    const date = dateKey(year, month, day)
    const state = onlyPlan != null ? dayStateOfPlan(date, onlyPlan) : dayStateOf(date)
    cells.push({ date, day, inMonth: true, state, mark: markOf(state) })
  }

  let nextYear = year
  let nextMonth = month + 1
  if (nextMonth > 12) {
    nextMonth = 1
    nextYear = year + 1
  }
  let nextDay = 1
  while (cells.length < 42) {
    cells.push(padCell(dateKey(nextYear, nextMonth, nextDay), nextDay))
    nextDay = nextDay + 1
  }
  return cells
}

/**
 * 与该月有交集的节日：跨月假期（如 12/31 ~ 1/2）在两个月里都算
 * 同年内比较月号；跨年（起始月 > 结束月）时用「月号 >= 起始 或 <= 结束」判定
 */
export function planCovering(month: number): HolidayPlan | null {
  for (let i = 0; i < holidays.length; i++) {
    const plan = holidays[i]
    const startMonth = monthOf(plan.start)
    const endMonth = monthOf(plan.end)
    if (startMonth <= endMonth) {
      if (month >= startMonth && month <= endMonth) {
        return plan
      }
    } else if (month >= startMonth || month <= endMonth) {
      return plan
    }
  }
  return null
}

/** 月历区块（一屏可能同时展示两个月） */
export type MonthBlock = {
  year: number
  month: number
  /** 区块小标题，如「1 月」 */
  title: string
  cells: DayCell[]
}

export function monthBlockOf(year: number, month: number, onlyPlan: HolidayPlan | null = null): MonthBlock {
  return {
    year,
    month,
    title: `${month} 月`,
    cells: buildMonthCells(year, month, onlyPlan)
  }
}

/**
 * 某节日涉及到的（年, 月）：放假区间本身可能跨月，调休上班日也可能落在别的月份
 * 例如 2027 春节放假 2/5~2/13、调休上班 1/31 与 2/14，就涉及 1 月和 2 月
 */
export function planMonthKeys(plan: HolidayPlan): number[] {
  const raw: number[] = []
  let y = yearOf(plan.start)
  let m = monthOf(plan.start)
  const endY = yearOf(plan.end)
  const endM = monthOf(plan.end)
  while (y < endY || (y === endY && m <= endM)) {
    raw.push(y * 100 + m)
    m = m + 1
    if (m > 12) {
      m = 1
      y = y + 1
    }
  }
  for (let k = 0; k < plan.workdays.length; k++) {
    const date = plan.workdays[k]
    raw.push(yearOf(date) * 100 + monthOf(date))
  }
  // 去重后按年月升序
  const keys: number[] = []
  for (let i = 0; i < raw.length; i++) {
    if (keys.indexOf(raw[i]) < 0) {
      keys.push(raw[i])
    }
  }
  keys.sort((a: number, b: number): number => a - b)
  return keys
}

/**
 * 该月要展示的月历区块：普通月份 1 块；跨月（含调休上班日跨月）时展示涉及的每个月
 * 两种情况都只标注 plan 这一个月所属节日的放假与调休，不再混进别的节日
 */
export function monthBlocksOf(year: number, month: number): MonthBlock[] {
  const blocks: MonthBlock[] = []
  const plan = planCovering(month)
  if (plan != null) {
    const keys = planMonthKeys(plan)
    if (keys.length > 1) {
      // 跨月展示：两个月卡片都只标注本节目的放假与调休
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        blocks.push(monthBlockOf(Math.floor(key / 100), key % 100, plan))
      }
      return blocks
    }
  }
  blocks.push(monthBlockOf(year, month, plan))
  return blocks
}

/** 今天（YYYY-MM-DD），打开页面时用来定位默认选中的节日 */
export function todayKey(): string {
  const d = new Date()
  return dateKey(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

/** 就近节日：今天还在某节日里则选它，否则选下一个节日；年末已过完则选最后一个 */
export function nearestPlanIndex(today: string): number {
  const t = dateNumber(today)
  for (let i = 0; i < holidays.length; i++) {
    if (t <= dateNumber(holidays[i].end)) {
      return i
    }
  }
  return holidays.length - 1
}

function dayText(date: string): string {
  return `${monthOf(date)}月${dayOf(date)}日（${weekdayTextOf(date)}）`
}

/** 本月出现的「其他节日的调休上班日」，如 1 月的 1/31 属于春节 */
export function crossWorkdayNote(month: number): string {
  for (let i = 0; i < holidays.length; i++) {
    const plan = holidays[i]
    // 本月就是该节日的展示范围（含跨月假期的另一半）时，调休已在详情卡里说过
    const startMonth = monthOf(plan.start)
    const endMonth = monthOf(plan.end)
    if (startMonth <= endMonth) {
      if (month >= startMonth && month <= endMonth) {
        continue
      }
    } else if (month >= startMonth || month <= endMonth) {
      continue
    }
    let days = ''
    for (let k = 0; k < plan.workdays.length; k++) {
      const date = plan.workdays[k]
      if (monthOf(date) !== month) {
        continue
      }
      if (days !== '') {
        days = `${days}、`
      }
      days = days + dayText(date)
    }
    if (days !== '') {
      return `${days} 为${plan.name}调休上班日`
    }
  }
  return ''
}

export function rangeTextOf(plan: HolidayPlan): string {
  if (plan.start === plan.end) {
    return dayText(plan.start)
  }
  return `${dayText(plan.start)} ~ ${dayText(plan.end)}`
}

export function workdaysTextOf(plan: HolidayPlan): string {
  if (plan.workdays.length === 0) {
    return '无调休，正常休息'
  }
  let text = ''
  for (let i = 0; i < plan.workdays.length; i++) {
    if (i > 0) {
      text = `${text}、`
    }
    text = text + dayText(plan.workdays[i])
  }
  return text
}

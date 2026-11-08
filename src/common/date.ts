// 公历日期换算：以 1900-01-01 为原点的天数 ↔ (年, 月, 日)
//
// 只在 1900 年及以后使用（工具页的日期选择器都在这个范围内）。
// 用整数天数做加减，避免 Date 带来的时区/夏令时偏移。

const MONTH_DAYS: number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const WEEK_NAMES: string[] = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

/** 某年某月的天数 */
export function daysInMonth(y: number, m: number): number {
  if (m === 2) {
    return isLeapYear(y) ? 29 : 28
  }
  return MONTH_DAYS[m - 1]
}

/** 该公历日期距 1900-01-01 的天数 */
export function daysFrom1900(y: number, m: number, d: number): number {
  let days = 0
  for (let year = 1900; year < y; year++) {
    days += isLeapYear(year) ? 366 : 365
  }
  for (let i = 0; i < m - 1; i++) {
    days += daysInMonth(y, i + 1)
  }
  return days + d - 1
}

/** 天数 → [年, 月, 日] */
export function fromDays(n: number): number[] {
  let y = 1900
  let rest = n
  while (rest >= (isLeapYear(y) ? 366 : 365)) {
    rest -= isLeapYear(y) ? 366 : 365
    y++
  }
  for (let i = 0; i < 12; i++) {
    const len = daysInMonth(y, i + 1)
    if (rest < len) {
      return [y, i + 1, rest + 1]
    }
    rest -= len
  }
  return [y, 12, 31]
}

/** 日期加 n 天（n 可为负） */
export function addDays(y: number, m: number, d: number, n: number): number[] {
  return fromDays(daysFrom1900(y, m, d) + n)
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

/** [年, 月, 日] → YYYY-MM-DD */
export function formatDate(parts: number[]): string {
  return `${parts[0]}-${pad2(parts[1])}-${pad2(parts[2])}`
}

/** [年, 月, 日] → MM-DD */
export function formatMonthDay(parts: number[]): string {
  return `${pad2(parts[1])}-${pad2(parts[2])}`
}

/** MM-DD ~ MM-DD */
export function formatMonthDayRange(start: number[], end: number[]): string {
  return `${formatMonthDay(start)} ~ ${formatMonthDay(end)}`
}

/** YYYY-MM-DD → [年, 月, 日] */
export function parseDateKey(text: string): number[] {
  return [parseInt(text.substring(0, 4)), parseInt(text.substring(5, 7)), parseInt(text.substring(8, 10))]
}

/** 今天的 [年, 月, 日] */
export function todayParts(): number[] {
  const d = new Date()
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()]
}

/** 今天的 YYYY-MM-DD（日期选择器默认值） */
export function todayKey(): string {
  return formatDate(todayParts())
}

/** 星期几（1900-01-01 为周一） */
export function weekdayTextOf(y: number, m: number, d: number): string {
  return WEEK_NAMES[daysFrom1900(y, m, d) % 7]
}

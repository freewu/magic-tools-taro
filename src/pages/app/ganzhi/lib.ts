// 天干地支查询逻辑
//
// 日干支：公历逐日连续计，锚点 1900-01-01 = 甲戌日（1949-10-01 = 甲子日，交叉验证一致）
// 年干支/生肖：按公历年份粗略推算（真正「换年」在立春前后，见页面说明）

export const STEMS: string[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']

export const BRANCHES: string[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

export const ZODIACS: string[] = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

const WEEK_NAMES: string[] = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']

const MONTH_DAYS: number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

/** 该公历日期距 1900-01-01 的天数（仅 1900 年及以后） */
export function daysFrom1900(y: number, m: number, d: number): number {
  let days = 0
  for (let year = 1900; year < y; year++) {
    days += isLeapYear(year) ? 366 : 365
  }
  for (let i = 0; i < m - 1; i++) {
    days += MONTH_DAYS[i] + (i === 1 && isLeapYear(y) ? 1 : 0)
  }
  return days + d - 1
}

/** 干支序号(0-59) -> 名称，负值自动归一 */
export function ganzhiName(idx: number): string {
  const i = ((idx % 60) + 60) % 60
  return STEMS[i % 10] + BRANCHES[i % 12]
}

/** 公历日期 -> 日干支（精确，跨年/月连续） */
export function dayGanzhi(y: number, m: number, d: number): string {
  return ganzhiName(daysFrom1900(y, m, d) + 10)
}

/** 公历年份 -> 干支纪年（1900 为庚子；按元旦粗略，立春后为准） */
export function yearGanzhi(year: number): string {
  return ganzhiName((year - 1900 + 36) % 60)
}

/** 公历年份 -> 生肖（1900 为鼠年；按元旦粗略，除夕/立春前后有差异） */
export function zodiacOfYear(year: number): string {
  let i = (year - 4) % 12
  if (i < 0) {
    i += 12
  }
  return ZODIACS[i]
}

/** 公历日期 -> 星期几（1900-01-01 为星期一） */
export function weekdayNameOf(y: number, m: number, d: number): string {
  return WEEK_NAMES[daysFrom1900(y, m, d) % 7]
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

/** 今天（YYYY-MM-DD），作为日期选择器的默认值 */
export function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** 解析 YYYY-MM-DD，返回 [年, 月, 日] */
export function parseDate(text: string): number[] {
  return [parseInt(text.substring(0, 4)), parseInt(text.substring(5, 7)), parseInt(text.substring(8, 10))]
}

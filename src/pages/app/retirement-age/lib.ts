// 渐进式延迟法定退休年龄测算（2025-01-01 起，参照人社部口径）
//
// 身份分组：0 = 男职工（原 60 岁，每 4 个月延迟 1 个月，最长 +3 年）
//           1 = 女职工·原 55（每 4 个月延迟 1 个月，最长 +3 年）
//           2 = 女职工·原 50（每 2 个月延迟 1 个月，最长 +5 年）

export type RetirementResult = {
  /** 原法定退休年龄 */
  originalAge: number
  /** 延迟月数 */
  delayMonths: number
  /** 新法定退休年龄文案，如「60 周岁 3 个月」 */
  newAgeText: string
  retireYear: number
  retireMonth: number
  /** 最低缴费年限文案 */
  minYearsText: string
}

export const GROUP_NAMES: string[] = ['男职工（原 60 岁）', '女职工（原 55 岁）', '女职工（原 50 岁）']

export const MONTH_NAMES: string[] = [
  '1 月',
  '2 月',
  '3 月',
  '4 月',
  '5 月',
  '6 月',
  '7 月',
  '8 月',
  '9 月',
  '10 月',
  '11 月',
  '12 月'
]

export function calcRetirement(birthYear: number, birthMonth: number, group: number): RetirementResult {
  const origList: number[] = [60, 55, 50]
  const stepList: number[] = [4, 4, 2]
  const maxList: number[] = [36, 36, 60]
  const orig = origList[group]
  const step = stepList[group]
  const maxDelay = maxList[group]

  // 原法定退休月份（自「年 0 月」计的月份序号，1 月为 year*12+0）
  const r0 = (birthYear + orig) * 12 + (birthMonth - 1)
  const delta = r0 - 2025 * 12
  let delay = 0
  if (delta >= 0) {
    delay = Math.floor(delta / step) + 1
    if (delay > maxDelay) {
      delay = maxDelay
    }
  }

  const rNew = r0 + delay
  const retireYear = Math.floor(rNew / 12)
  const retireMonth = (rNew % 12) + 1

  const totalMonths = orig * 12 + delay
  const ageY = Math.floor(totalMonths / 12)
  const ageM = totalMonths % 12
  const newAgeText = ageM === 0 ? `${ageY} 周岁` : `${ageY} 周岁 ${ageM} 个月`

  // 最低缴费年限：2030 年起由 15 年逐步提高至 20 年（每年 +0.5 年）
  let minYearsText = '15 年'
  if (retireYear >= 2040) {
    minYearsText = '20 年'
  } else if (retireYear >= 2030) {
    minYearsText = `${15 + (retireYear - 2029) * 0.5} 年`
  }

  return { originalAge: orig, delayMonths: delay, newAgeText, retireYear, retireMonth, minYearsText }
}

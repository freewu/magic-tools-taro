// 预产期计算（Naegele 法则：末次月经 + 280 天）

import { daysFrom1900, formatDate, fromDays, weekdayTextOf } from '../../../common/date'

export type DueResult = {
  /** 预产期 YYYY-MM-DD */
  dueDate: string
  /** 预产期是周几 */
  weekday: string
  /** 当前孕周 */
  weeks: number
  /** 孕周零几天 */
  daysInWeek: number
  /** 距预产期天数（负数为已超过） */
  remaining: number
  /** 预产期星座 */
  sign: string
  valid: boolean
  /** 异常提示（末次月经晚于今天 / 已超预产期） */
  status: string
}

/** 星座（按当月日期边界） */
const signDays: number[] = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 23, 22]
const signNames: string[] = [
  '水瓶座',
  '双鱼座',
  '白羊座',
  '金牛座',
  '双子座',
  '巨蟹座',
  '狮子座',
  '处女座',
  '天秤座',
  '天蝎座',
  '射手座',
  '摩羯座'
]

export function zodiacSign(m: number, d: number): string {
  if (d >= signDays[m - 1]) {
    return signNames[m - 1]
  }
  return signNames[(m + 10) % 12]
}

export function calcDueDate(
  lmpY: number,
  lmpM: number,
  lmpD: number,
  todayY: number,
  todayM: number,
  todayD: number
): DueResult {
  const due = fromDays(daysFrom1900(lmpY, lmpM, lmpD) + 280)
  const dueN = daysFrom1900(due[0], due[1], due[2])
  const todayN = daysFrom1900(todayY, todayM, todayD)
  const lmpN = daysFrom1900(lmpY, lmpM, lmpD)

  const weekday = weekdayTextOf(due[0], due[1], due[2])
  const remaining = dueN - todayN

  let weeks = 0
  let daysInWeek = 0
  let valid = true
  let status = ''
  if (lmpN > todayN) {
    valid = false
    status = '末次月经日期不能晚于今天'
  } else {
    const gone = todayN - lmpN
    weeks = Math.floor(gone / 7)
    daysInWeek = gone % 7
    if (remaining < 0) {
      status = `已超过预产期 ${-remaining} 天，请咨询医生`
    }
  }

  return {
    dueDate: formatDate(due),
    weekday,
    weeks,
    daysInWeek,
    remaining,
    sign: zodiacSign(due[1], due[2]),
    valid,
    status
  }
}

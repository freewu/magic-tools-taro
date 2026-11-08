// 安全期计算逻辑（日历法，仅供估算）
//
// 按「下次月经前 14 天排卵、排卵前 5 天 + 排卵后 4 天为易孕期」推算本轮周期内的各区间。

import {
  addDays,
  daysFrom1900,
  formatDate,
  formatMonthDayRange
} from '../../../common/date'

export type SafePeriodResult = {
  /** 排卵日 YYYY-MM-DD */
  ovulation: string
  /** 危险期（易孕期）MM-DD ~ MM-DD */
  danger: string
  /** 经期后 ~ 危险期前的安全期，无则给出说明 */
  safe1: string
  /** 危险期后 ~ 下次月经前的安全期 */
  safe2: string
  /** 今日所处阶段 */
  todayState: string
}

/**
 * @param lmpY 末次月经开始日
 * @param cycle 月经周期天数
 * @param periodLen 经期天数
 * @param today 今日
 */
export function calcSafePeriod(
  lmpY: number,
  lmpM: number,
  lmpD: number,
  cycle: number,
  periodLen: number,
  todayY: number,
  todayM: number,
  todayD: number
): SafePeriodResult {
  const next = addDays(lmpY, lmpM, lmpD, cycle)
  const ovu = addDays(next[0], next[1], next[2], -14)
  const dangerStart = addDays(ovu[0], ovu[1], ovu[2], -5)
  const dangerEnd = addDays(ovu[0], ovu[1], ovu[2], 4)
  const mensesEnd = addDays(lmpY, lmpM, lmpD, periodLen - 1)
  const safe1Start = addDays(mensesEnd[0], mensesEnd[1], mensesEnd[2], 1)
  const safe1End = addDays(dangerStart[0], dangerStart[1], dangerStart[2], -1)
  const safe2Start = addDays(dangerEnd[0], dangerEnd[1], dangerEnd[2], 1)
  const safe2End = addDays(next[0], next[1], next[2], -1)

  const startN = daysFrom1900(safe1Start[0], safe1Start[1], safe1Start[2])
  const endN = daysFrom1900(safe1End[0], safe1End[1], safe1End[2])
  const safe1 = startN <= endN ? formatMonthDayRange(safe1Start, safe1End) : '无（经期后即入危险期）'

  const start2N = daysFrom1900(safe2Start[0], safe2Start[1], safe2Start[2])
  const end2N = daysFrom1900(safe2End[0], safe2End[1], safe2End[2])
  const safe2 = start2N <= end2N ? formatMonthDayRange(safe2Start, safe2End) : '无'

  const todayN = daysFrom1900(todayY, todayM, todayD)
  const lmpN = daysFrom1900(lmpY, lmpM, lmpD)
  const nextN = daysFrom1900(next[0], next[1], next[2])
  const dangerStartN = daysFrom1900(dangerStart[0], dangerStart[1], dangerStart[2])
  const dangerEndN = daysFrom1900(dangerEnd[0], dangerEnd[1], dangerEnd[2])
  const mensesEndN = daysFrom1900(mensesEnd[0], mensesEnd[1], mensesEnd[2])

  let todayState = ''
  if (todayN < lmpN) {
    todayState = '今日早于末次月经，请检查日期'
  } else if (todayN > nextN) {
    todayState = '该周期已结束，请更新为最近一次月经日期'
  } else if (todayN <= mensesEndN) {
    todayState = '今日处于【月经期】'
  } else if (todayN >= dangerStartN && todayN <= dangerEndN) {
    todayState = '今日处于【危险期（易孕期）】'
  } else {
    todayState = '今日处于【安全期】'
  }

  return {
    ovulation: formatDate(ovu),
    danger: formatMonthDayRange(dangerStart, dangerEnd),
    safe1,
    safe2,
    todayState
  }
}

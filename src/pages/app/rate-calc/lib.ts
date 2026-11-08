// 存款利息（单利）计算
//
// 存期单位：0=年 1=月 2=天（天按银行惯例 1 年 = 360 天估算）

export type RateResult = {
  /** 存期折算年数 */
  years: number
  /** 到期利息 */
  interest: number
  /** 本息合计 */
  total: number
  /** 存期文案，如「3 个月（0.25 年）」 */
  yearsText: string
}

export function calcSavingsInterest(principal: number, ratePct: number, period: number, unit: number): RateResult {
  let years = period
  if (unit === 1) {
    years = period / 12
  } else if (unit === 2) {
    years = period / 360
  }
  const interest = ((principal * ratePct) / 100) * years
  let yearsText = ''
  if (unit === 0) {
    yearsText = `${period} 年`
  } else if (unit === 1) {
    yearsText = `${period} 个月（${years} 年）`
  } else {
    yearsText = `${period} 天（${years} 年）`
  }
  return { years, interest, total: principal + interest, yearsText }
}

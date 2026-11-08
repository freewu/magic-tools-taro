// 退休金（基本养老金）估算
//
// 月养老金 = 基础养老金 + 个人账户养老金
// 基础养老金 = 计发基数 × (1 + 本人平均缴费指数) / 2 × 缴费年限 × 1%
// 个人账户养老金 = 个人账户储存额 ÷ 计发月数（按退休年龄查表）

export type PensionResult = {
  basePension: number
  personalPension: number
  totalPension: number
  /** 计发月数 */
  months: number
}

export const AGE_OPTIONS: number[] = [50, 55, 60, 61, 62, 63, 64, 65]

export const AGE_NAMES: string[] = ['50 岁', '55 岁', '60 岁', '61 岁', '62 岁', '63 岁', '64 岁', '65 岁']

/** 个人账户计发月数（国发〔2005〕38 号），未命中按 60 岁的 139 */
export function monthCount(age: number): number {
  const months: number[] = [195, 170, 139, 132, 125, 117, 109, 101]
  for (let i = 0; i < AGE_OPTIONS.length; i++) {
    if (age === AGE_OPTIONS[i]) {
      return months[i]
    }
  }
  return 139
}

export function calcPension(base: number, index: number, years: number, age: number, account: number): PensionResult {
  const months = monthCount(age)
  const basePension = (((base * (1 + index)) / 2) * years) / 100
  const personalPension = account / months
  return {
    basePension,
    personalPension,
    totalPension: basePension + personalPension,
    months
  }
}

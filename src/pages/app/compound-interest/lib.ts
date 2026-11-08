// 复利计算逻辑
//
// 支持定期追加投入（默认按「每期期末」投入，即普通年金）
// 终值 = 本金×(1+i)^N + 追加×(((1+i)^N - 1)/i)
// i 为每期利率 = 年利率 / 期数每年 / 100；N = 期数每年 × 年数

/** 复利计算结果（原始数值，页面负责格式化） */
export type CompoundResult = {
  /** 期数 N */
  periods: number
  /** 到期本息（终值） */
  future: number
  /** 累计投入 */
  invested: number
  /** 总收益 */
  gain: number
  /** 收益率（%） */
  gainRate: number
}

export function calcCompound(
  principal: number,
  annualRatePct: number,
  years: number,
  periodsPerYear: number,
  contribution: number
): CompoundResult {
  const n = Math.round(periodsPerYear * years)
  const i = annualRatePct / 100 / periodsPerYear
  let future = principal * Math.pow(1 + i, n)
  const invested = principal + contribution * n
  if (contribution > 0) {
    const added = i > 0 ? contribution * ((Math.pow(1 + i, n) - 1) / i) : contribution * n
    future += added
  }
  const gain = future - invested
  const gainRate = invested > 0 ? (gain / invested) * 100 : 0
  return { periods: n, future, invested, gain, gainRate }
}

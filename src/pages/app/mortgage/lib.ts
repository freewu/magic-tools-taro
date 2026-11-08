// 房贷计算逻辑（等额本息 / 等额本金，按月还款）
//
// 输入利率为年利率(%)，月利率 = 年利率 / 12 / 100

/**
 * 等额本息：月供 = P × i × (1+i)^n / ((1+i)^n - 1)，四舍五入到分后按整月累计总额
 * 返回 [月供, 还款总额, 支付总利息]
 */
export function calcMortgageEI(principal: number, annualRatePct: number, years: number): number[] {
  const n = Math.round(years * 12)
  const i = annualRatePct / 100 / 12
  const p = Math.pow(1 + i, n)
  let monthly = (principal * i * p) / (p - 1)
  monthly = Math.round(monthly * 100) / 100
  const total = monthly * n
  const interest = total - principal
  return [monthly, total, interest]
}

/**
 * 等额本金：每月还本固定 = P/n；第 k 月利息递减；总利息 = (n+1) × P × i / 2
 * 返回 [首月月供, 每月递减, 还款总额, 支付总利息]
 */
export function calcMortgageEP(principal: number, annualRatePct: number, years: number): number[] {
  const n = Math.round(years * 12)
  const i = annualRatePct / 100 / 12
  const monthPrincipal = principal / n
  const firstMonth = monthPrincipal + principal * i
  const decrement = monthPrincipal * i
  const interest = ((n + 1) * principal * i) / 2
  const total = principal + interest
  return [firstMonth, decrement, total, interest]
}

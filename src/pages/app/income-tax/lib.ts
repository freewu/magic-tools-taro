// 个人所得税（工资薪金）计算逻辑
//
// 口径：按「全年综合所得」测算后均摊到月
// 年应纳税所得额 = (月税前收入 - 起征点5000 - 三险一金 - 专项附加扣除) × 12
// 套用居民个人综合所得年度税率表（超额累进 + 速算扣除数），再 ÷12 得月应缴
// 说明：实际申报采用「累计预扣预缴」，本结果用于快速测算

export const TAX_FREE_MONTHLY = 5000

/** 个税计算结果（原始数值，页面负责格式化） */
export type IncomeTaxResult = {
  /** 月应纳税所得额 */
  monthTaxable: number
  /** 年应纳税所得额 */
  annualTaxable: number
  /** 适用税率（%） */
  ratePct: number
  /** 月均速算扣除数 */
  monthQuick: number
  /** 月应缴个税 */
  monthTax: number
  /** 税后月收入 */
  netMonthly: number
  /** 年应缴个税合计 */
  annualTax: number
}

export function calcIncomeTax(salary: number, insurance: number, extra: number): IncomeTaxResult {
  let monthTaxable = salary - TAX_FREE_MONTHLY - insurance - extra
  let annualTaxable = monthTaxable * 12
  let ratePct = 0
  let quickAnnual = 0
  if (annualTaxable <= 0) {
    annualTaxable = 0
    monthTaxable = 0
  } else if (annualTaxable <= 36000) {
    ratePct = 3
    quickAnnual = 0
  } else if (annualTaxable <= 144000) {
    ratePct = 10
    quickAnnual = 2520
  } else if (annualTaxable <= 300000) {
    ratePct = 20
    quickAnnual = 16920
  } else if (annualTaxable <= 420000) {
    ratePct = 25
    quickAnnual = 31920
  } else if (annualTaxable <= 660000) {
    ratePct = 30
    quickAnnual = 52920
  } else if (annualTaxable <= 960000) {
    ratePct = 35
    quickAnnual = 85920
  } else {
    ratePct = 45
    quickAnnual = 181920
  }
  const annualTax = (annualTaxable * ratePct) / 100 - quickAnnual
  const monthTax = annualTax > 0 ? annualTax / 12 : 0
  const netMonthly = salary - insurance - monthTax
  return {
    monthTaxable,
    annualTaxable,
    ratePct,
    monthQuick: quickAnnual / 12,
    monthTax,
    netMonthly,
    annualTax
  }
}

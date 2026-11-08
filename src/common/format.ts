// 数字显示格式化：定点 / 科学计数法自动切换，去掉浮点误差带来的多余尾数。
//
// 换算工具用 formatNumber（10~12 位有效数字），金额工具用 formatMoney（千分位 + 两位小数），
// 把参照物数值回填到输入框用 trimNumber。

/** 有效数字 → 定点字符串（内部用） */
function formatSignificant(value: number, significantDigits: number): string {
  const digits = significantDigits < 1 ? 1 : significantDigits
  const magnitude = Math.abs(value)
  let exponent = 0
  if (magnitude > 0) {
    exponent = Math.floor(Math.log(magnitude) / Math.log(10))
  }
  // 需要的小数位数 = 有效数字 - 1 - 数量级
  let decimals = digits - 1 - exponent
  if (decimals < 0) {
    decimals = 0
  }
  if (decimals > 20) {
    decimals = 20
  }
  return value.toFixed(decimals)
}

/** 去掉小数末尾多余的 0 与孤立的小数点（内部用） */
function trimZeros(text: string): string {
  if (text.indexOf('.') < 0) {
    return text
  }
  let end = text.length
  while (end > 0) {
    const c = text.substring(end - 1, end)
    if (c !== '0') {
      break
    }
    end--
  }
  let result = text.substring(0, end)
  if (result.length > 0 && result.substring(result.length - 1, result.length) === '.') {
    result = result.substring(0, result.length - 1)
  }
  if (result === '' || result === '-') {
    return '0'
  }
  return result
}

/** 科学计数法：1.5e+21 这类（内部用） */
function formatExponential(value: number, mantissaDecimals: number): string {
  let exponent = 0
  const magnitude = Math.abs(value)
  if (magnitude > 0) {
    exponent = Math.floor(Math.log(magnitude) / Math.log(10))
  }
  let mantissa = value / Math.pow(10, exponent)
  // 四舍五入后可能进位到 10（如 9.9999 → 10.0），此时退一位
  if (Math.abs(mantissa) >= 10) {
    mantissa = mantissa / 10
    exponent = exponent + 1
  }
  const decimals = mantissaDecimals < 0 ? 0 : mantissaDecimals
  return `${trimZeros(mantissa.toFixed(decimals))}e${exponent}`
}

/** 有效数字格式化：0.30000000000000004 → 0.3 */
export function formatNumber(value: number, significantDigits = 12): string {
  if (!isFinite(value)) {
    return value > 0 ? '∞' : value < 0 ? '-∞' : '-'
  }
  if (value === 0) {
    return '0'
  }
  const magnitude = Math.abs(value)
  // 太大或太小时改用科学计数法，避免一长串 0
  if (magnitude >= 1e13 || magnitude < 1e-9) {
    return formatExponential(value, significantDigits - 3)
  }
  return trimZeros(formatSignificant(value, significantDigits))
}

/** 紧凑格式：用于卡片上的一行小字（参照物数值等） */
export function formatCompact(value: number): string {
  return formatNumber(value, 6)
}

/** 金额格式：千分位 + 固定小数位（默认两位），如 1234567.891 → 1,234,567.89 */
export function formatMoney(value: number, decimals = 2): string {
  if (!isFinite(value)) {
    return '-'
  }
  const negative = value < 0
  const text = Math.abs(value).toFixed(decimals)
  const dot = text.indexOf('.')
  const integer = dot < 0 ? text : text.substring(0, dot)
  const decimalsPart = dot < 0 ? '' : text.substring(dot)
  let grouped = ''
  for (let i = 0; i < integer.length; i++) {
    if (i > 0 && (integer.length - i) % 3 === 0) {
      grouped += ','
    }
    grouped += integer.substring(i, i + 1)
  }
  const result = grouped + decimalsPart
  if (!negative) {
    return result
  }
  return parseFloat(result) === 0 ? result : `-${result}`
}

/** 定点小数格式：保留固定小数位并去掉多余的 0，如 1680.53 → 1680.5 */
export function formatFixed(value: number, decimals = 1): string {
  if (!isFinite(value)) {
    return '-'
  }
  return trimZeros(value.toFixed(decimals < 0 ? 0 : decimals))
}

/** 回填输入框用：整数去掉末尾 .0，其余保留原样（最多 10 位小数） */
export function trimNumber(value: number): string {
  if (!isFinite(value)) {
    return '0'
  }
  if (value === Math.round(value) && Math.abs(value) < 1e15) {
    return Math.round(value).toString()
  }
  return trimZeros(value.toFixed(10))
}

/** 仅保留数字与一个小数点（不允许以小数点开头），用于数字输入框的过滤 */
export function sanitizeDecimal(raw: string): string {
  let out = ''
  let hasDot = false
  for (let i = 0; i < raw.length; i++) {
    const c = raw.substring(i, i + 1)
    if (c >= '0' && c <= '9') {
      out += c
    } else if (c === '.' && !hasDot && out.length > 0) {
      hasDot = true
      out += c
    }
  }
  return out
}

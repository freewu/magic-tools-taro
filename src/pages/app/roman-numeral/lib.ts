// 罗马数字 ↔ 阿拉伯数字（标准减法写法，支持 1 - 3999）
//
// 规则：
//   基本符号   I=1  V=5  X=10  L=50  C=100  D=500  M=1000（V / L / D 不重复书写）
//   减法组合   IV=4  IX=9  XL=40  XC=90  CD=400  CM=900
//   同一符号最多连续 3 次（III=3，XXX=30，CCC=300，MMM=3000）
//   3999 = MMMCMXCIX，是不加下划线的标准写法能表示的最大值
//
// 纯逻辑，不依赖界面：解析失败一律给中文原因，不返回半个结果。

import { readStorage, writeStorage } from '../../../common/storage'

/** 可表示的最小值（罗马数字没有 0） */
export const ROMAN_MIN = 1
/** 可表示的最大值（MMMCMXCIX） */
export const ROMAN_MAX = 3999

/** 数字 → 罗马 */
export const ROMAN_MODE_TO_ROMAN = 'to-roman'
/** 罗马 → 数字 */
export const ROMAN_MODE_TO_ARABIC = 'to-arabic'

// ---------------------------------------------------------------- 速查表数据

export type RomanSymbol = {
  symbol: string
  value: number
  /** 连写规则说明 */
  note: string
}

/** 由大到小，与贪心拼接的顺序一致 */
export const ROMAN_SYMBOLS: RomanSymbol[] = [
  { symbol: 'M', value: 1000, note: '最多连写三次 MMM = 3000' },
  { symbol: 'D', value: 500, note: '不重复书写' },
  { symbol: 'C', value: 100, note: '最多连写三次 CCC = 300' },
  { symbol: 'L', value: 50, note: '不重复书写' },
  { symbol: 'X', value: 10, note: '最多连写三次 XXX = 30' },
  { symbol: 'V', value: 5, note: '不重复书写' },
  { symbol: 'I', value: 1, note: '最多连写三次 III = 3' }
]

export type RomanPair = {
  pair: string
  value: number
}

/** 标准写法中只允许这 6 种减法组合 */
export const ROMAN_PAIRS: RomanPair[] = [
  { pair: 'IV', value: 4 },
  { pair: 'IX', value: 9 },
  { pair: 'XL', value: 40 },
  { pair: 'XC', value: 90 },
  { pair: 'CD', value: 400 },
  { pair: 'CM', value: 900 }
]

export type RomanExample = {
  arabic: string
  roman: string
}

export const ROMAN_EXAMPLES: RomanExample[] = [
  { arabic: '1', roman: 'I' },
  { arabic: '4', roman: 'IV' },
  { arabic: '9', roman: 'IX' },
  { arabic: '14', roman: 'XIV' },
  { arabic: '40', roman: 'XL' },
  { arabic: '90', roman: 'XC' },
  { arabic: '400', roman: 'CD' },
  { arabic: '1994', roman: 'MCMXCIV' },
  { arabic: '2024', roman: 'MMXXIV' },
  { arabic: '3999', roman: 'MMMCMXCIX' }
]

// ---------------------------------------------------------------- 转换核心

/** 贪心拼接用的 (数值, 符号) 表，由大到小，含减法组合 */
const ROMAN_STEPS: RomanPair[] = [
  { pair: 'M', value: 1000 },
  { pair: 'CM', value: 900 },
  { pair: 'D', value: 500 },
  { pair: 'CD', value: 400 },
  { pair: 'C', value: 100 },
  { pair: 'XC', value: 90 },
  { pair: 'L', value: 50 },
  { pair: 'XL', value: 40 },
  { pair: 'X', value: 10 },
  { pair: 'IX', value: 9 },
  { pair: 'V', value: 5 },
  { pair: 'IV', value: 4 },
  { pair: 'I', value: 1 }
]

/** 数值 → 标准罗马数字（调用方保证 1 - 3999） */
export function romanOf(value: number): string {
  let rest = value
  let out = ''
  // 从大到小依次贪心拼接，每个符号最多用 3 次（V / L / D 只会用 1 次）
  for (let i = 0; i < ROMAN_STEPS.length; i++) {
    const step = ROMAN_STEPS[i]
    while (rest >= step.value) {
      out += step.pair
      rest -= step.value
    }
  }
  return out
}

/** 数值 → 拆解过程，如 2024 => '1000 + 1000 + 10 + 10 + 4' */
export function breakdownOf(value: number): string {
  const parts: string[] = []
  let rest = value
  for (let i = 0; i < ROMAN_STEPS.length; i++) {
    const step = ROMAN_STEPS[i]
    while (rest >= step.value) {
      parts.push(`${step.value}`)
      rest -= step.value
    }
  }
  return parts.join(' + ')
}

/** 符号 → 数值，-1 表示不是罗马数字符号 */
function symbolValue(char: string): number {
  const symbol = char.toUpperCase()
  if (symbol === 'I') {
    return 1
  }
  if (symbol === 'V') {
    return 5
  }
  if (symbol === 'X') {
    return 10
  }
  if (symbol === 'L') {
    return 50
  }
  if (symbol === 'C') {
    return 100
  }
  if (symbol === 'D') {
    return 500
  }
  if (symbol === 'M') {
    return 1000
  }
  return -1
}

/** 是否全是阿拉伯数字字符 */
function isAllDigits(text: string): boolean {
  if (text.length === 0) {
    return false
  }
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i)
    if (char < '0' || char > '9') {
      return false
    }
  }
  return true
}

export type RomanResult = {
  ok: boolean
  /** 结果文本（罗马数字或阿拉伯数字） */
  text: string
  /** 对应的数值，失败时为 0 */
  value: number
  /** 失败原因（中文） */
  error: string
  /** 结果说明（拆解过程等） */
  detail: string
}

function fail(error: string): RomanResult {
  return { ok: false, text: '', value: 0, error, detail: '' }
}

/** 阿拉伯数字 → 罗马数字（接受两侧空白与 '007' 这类前导零写法） */
export function arabicToRoman(input: string): RomanResult {
  const raw = input.trim()
  if (raw === '') {
    return fail('请输入要转换的阿拉伯数字（1 - 3999）')
  }
  if (raw.charAt(0) === '-') {
    return fail('罗马数字没有负数，仅支持 1 - 3999')
  }
  if (!isAllDigits(raw)) {
    return fail('阿拉伯数字一侧只能是整数，请去掉小数点、空格或其他字符')
  }
  // 去掉前导零后再判断位数，避免 '0007' 被误判为超长
  let start = 0
  while (start < raw.length - 1 && raw.charAt(start) === '0') {
    start++
  }
  const digits = raw.substring(start)
  if (digits === '0') {
    return fail('罗马数字没有 0，最小值为 I（1）')
  }
  if (digits.length > 4) {
    return fail('阿拉伯数字超出范围，仅支持 1 - 3999（MMMCMXCIX）')
  }
  const value = parseInt(digits, 10)
  if (value < ROMAN_MIN || value > ROMAN_MAX) {
    return fail('阿拉伯数字超出范围，仅支持 1 - 3999（MMMCMXCIX）')
  }
  return { ok: true, text: romanOf(value), value, error: '', detail: breakdownOf(value) }
}

/** 罗马数字的分段说明，如 MMXXIV => 'M + M + X + X + IV' */
export function tokenNote(raw: string): string {
  const parts: string[] = []
  let i = 0
  while (i < raw.length) {
    // 减法组合优先整体识别
    if (i + 1 < raw.length) {
      const two = raw.substring(i, i + 2)
      let matched = false
      for (let k = 0; k < ROMAN_PAIRS.length; k++) {
        if (ROMAN_PAIRS[k].pair === two) {
          parts.push(two)
          matched = true
          break
        }
      }
      if (matched) {
        i += 2
        continue
      }
    }
    parts.push(raw.charAt(i))
    i++
  }
  return parts.join(' + ')
}

/** 罗马数字 → 阿拉伯数字（大小写均可，但必须是标准写法，IC / IIII 会被拒绝） */
export function romanToArabic(input: string): RomanResult {
  const raw = input.trim().toUpperCase()
  if (raw === '') {
    return fail('请输入要转换的罗马数字（I - MMMCMXCIX）')
  }
  for (let i = 0; i < raw.length; i++) {
    if (symbolValue(raw.charAt(i)) < 0) {
      return fail(`「${raw.charAt(i)}」不是罗马数字符号，只能出现 I V X L C D M`)
    }
  }
  let total = 0
  for (let i = 0; i < raw.length; i++) {
    const cur = symbolValue(raw.charAt(i))
    const next = i + 1 < raw.length ? symbolValue(raw.charAt(i + 1)) : 0
    total += cur < next ? -cur : cur
  }
  if (total < ROMAN_MIN || total > ROMAN_MAX) {
    return fail(`换算结果是 ${total}，超出 1 - 3999 的范围`)
  }
  // 规范性校验：反算结果必须与输入完全一致，否则是 IIII / IC / VX 之类的非标准写法
  const standard = romanOf(total)
  if (standard !== raw) {
    return fail(`不是标准的罗马数字写法（如 IIII、IC、VX），${total} 应写作 ${standard}`)
  }
  return { ok: true, text: `${total}`, value: total, error: '', detail: tokenNote(raw) }
}

/** 是否为标准写法的罗马数字（1 - 3999） */
export function isValidRoman(input: string): boolean {
  return romanToArabic(input).ok
}

/** 随机取一个 1 - 3999 的数值（「随机」按钮用） */
export function randomValue(): number {
  return Math.floor(Math.random() * ROMAN_MAX) + ROMAN_MIN
}

// ---------------------------------------------------------------- 上次的模式与输入

const ROMAN_MODE_KEY = 'roman-mode'
const ROMAN_TEXT_KEY = 'roman-text'

export type RomanDraft = {
  mode: string
  text: string
}

export function defaultRomanDraft(): RomanDraft {
  return { mode: ROMAN_MODE_TO_ROMAN, text: '2024' }
}

export function loadRomanDraft(): RomanDraft {
  const draft = defaultRomanDraft()
  const mode = readStorage(ROMAN_MODE_KEY)
  if (mode === ROMAN_MODE_TO_ROMAN || mode === ROMAN_MODE_TO_ARABIC) {
    draft.mode = mode
  }
  const text = readStorage(ROMAN_TEXT_KEY)
  if (text !== '') {
    draft.text = text
  }
  return draft
}

export function saveRomanDraft(draft: RomanDraft): void {
  writeStorage(ROMAN_MODE_KEY, draft.mode)
  writeStorage(ROMAN_TEXT_KEY, draft.text)
}

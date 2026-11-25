// 生肖年龄：公历年份 ↔ 生肖 / 干支互查 + 年龄换算。纯逻辑，不依赖界面。
//
// 生肖按「农历年」划分：公历 Y 年春节之后才进入 Y 年农历年，生肖序号 = (Y - 4) mod 12
//（1984 = 甲子鼠年、2024 = 甲辰龙年为锚点）。所以 1~2 月春节前出生的人生肖仍属上一年，
// 页面里给了说明，年份查询一律按农历年口径（输入年份 = 该年春节后的生肖年）。
//
// 虚岁按农历年计：出生即 1 岁，每过一个春节加 1，= 今年 − 出生年 + 1；
// 周岁按生日计：今年生日未过则再减 1。

import { readStorage, writeStorage } from '../../../common/storage'

export const ZODIAC_NAMES: string[] = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

export const ZODIAC_EMOJIS: string[] = ['🐭', '🐮', '🐯', '🐰', '🐲', '🐍', '🐴', '🐑', '🐵', '🐔', '🐶', '🐷']

export const ZODIAC_BRANCHES: string[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

export const ZODIAC_STEMS: string[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']

/** 生肖年份列表默认往前覆盖 99 年（含今年共 100 年） */
export const ZODIAC_PAST_YEARS = 99

/** 循环取模，负年份也能归一（-1 → size - 1） */
export function wrapIndex(value: number, size: number): number {
  const rest = value % size
  return rest < 0 ? rest + size : rest
}

/** 地支对应的时辰（两个时辰一个，子时跨零点）：子 23-1 时、丑 1-3 时 … */
export function branchHourText(index: number): string {
  const start = wrapIndex(index * 2 + 23, 24)
  const end = wrapIndex(start + 2, 24)
  return `${start}-${end} 时`
}

/** 生肖条目：名称 / emoji / 地支 / 时辰 */
export type Zodiac = {
  index: number
  name: string
  emoji: string
  branch: string
  /** 地支对应的时辰，如「23-1 时」 */
  hours: string
}

function buildZodiac(index: number): Zodiac {
  const i = wrapIndex(index, 12)
  return {
    index: i,
    name: ZODIAC_NAMES[i],
    emoji: ZODIAC_EMOJIS[i],
    branch: ZODIAC_BRANCHES[i],
    hours: branchHourText(i)
  }
}

export const ZODIACS: Zodiac[] = ZODIAC_NAMES.map((_, index) => buildZodiac(index))

export function zodiacByIndex(index: number): Zodiac {
  return ZODIACS[wrapIndex(index, 12)]
}

/** 「🐭 鼠」：chip 与标题用 */
export function zodiacTitle(zodiac: Zodiac): string {
  return `${zodiac.emoji} ${zodiac.name}`
}

/** 「鼠（子）」：换算结果用 */
export function zodiacNameWithBranch(zodiac: Zodiac): string {
  return `${zodiac.name}（${zodiac.branch}）`
}

/** 「子时 23-1 时」 */
export function zodiacHourLine(zodiac: Zodiac): string {
  return `${zodiac.branch}时 ${zodiac.hours}`
}

// ---------------------------------------------------------------- 年份 ↔ 生肖 / 干支

/** 公历年份 → 生肖序号（0 = 鼠）：1984 鼠年、2024 龙年 */
export function zodiacIndexOfYear(year: number): number {
  return wrapIndex(year - 4, 12)
}

/** 公历年份 → 干支序号（0 = 甲子）：1984 甲子、2024 甲辰 */
export function ganzhiIndexOfYear(year: number): number {
  return wrapIndex(year - 4, 60)
}

/** 干支纪年，如 2024 → 甲辰 */
export function ganzhiOfYear(year: number): string {
  return ZODIAC_STEMS[wrapIndex(year - 4, 10)] + ZODIAC_BRANCHES[wrapIndex(year - 4, 12)]
}

export function zodiacOfYear(year: number): Zodiac {
  return ZODIACS[zodiacIndexOfYear(year)]
}

// ---------------------------------------------------------------- 生肖关系（六合 / 三合 / 相冲）

/** 六合：鼠牛、虎猪、兔狗、龙鸡、蛇猴、马羊 */
export function liuheOf(index: number): Zodiac {
  return zodiacByIndex(13 - wrapIndex(index, 12))
}

/** 三合：申子辰、亥卯未、寅午戌、巳酉丑（同一组内除自己外的两个） */
export function sanheOf(index: number): Zodiac[] {
  const out: Zodiac[] = []
  const self = wrapIndex(index, 12)
  const group = self % 4
  for (let i = 0; i < 12; i++) {
    if (i !== self && i % 4 === group) {
      out.push(ZODIACS[i])
    }
  }
  return out
}

/** 相冲：子午、丑未、寅申、卯酉、辰戌、巳亥（相隔 6 位） */
export function chongOf(index: number): Zodiac {
  return zodiacByIndex(wrapIndex(index, 12) + 6)
}

// ---------------------------------------------------------------- 年龄

/** 某年出生的人今年的虚岁 / 周岁 */
export type AgeInfo = {
  birthYear: number
  currentYear: number
  /** 今年生日是否已过（只影响周岁） */
  birthdayPassed: boolean
  /** 虚岁：出生即 1 岁，每过一个春节加 1 */
  xu: number
  /** 周岁：满一年才算一岁，生日未过减 1 */
  zhou: number
  /** 今年是否本命年 */
  isBenming: boolean
  /** 距离下一个本命年还有几年（今年就是时给 0） */
  nextBenming: number
}

export function ageOf(birthYear: number, currentYear: number, birthdayPassed: boolean): AgeInfo {
  const span = currentYear - birthYear
  let zhou = span - (birthdayPassed ? 0 : 1)
  if (zhou < 0) {
    zhou = 0
  }
  const rest = wrapIndex(span, 12)
  return {
    birthYear,
    currentYear,
    birthdayPassed,
    xu: span + 1 < 1 ? 1 : span + 1,
    zhou,
    isBenming: rest === 0,
    nextBenming: rest === 0 ? 0 : 12 - rest
  }
}

export function xuTextOf(info: AgeInfo): string {
  return `虚岁 ${info.xu} 岁`
}

export function zhouTextOf(info: AgeInfo): string {
  return `周岁 ${info.zhou} 岁`
}

/** 「虚岁 37 岁 · 周岁 36 岁」 */
export function ageTextOf(info: AgeInfo): string {
  return `${xuTextOf(info)} · ${zhouTextOf(info)}`
}

export function benmingTextOf(info: AgeInfo): string {
  if (info.isBenming) {
    return '今年就是本命年'
  }
  return `距下一个本命年 ${info.nextBenming} 年`
}

/** 某个生肖年的年份条目：生肖年份列表与速查表都用它 */
export type ZodiacYear = {
  year: number
  ganzhi: string
  /** 距今多少年（正数过去，0 今年，负数未来） */
  offset: number
  isFuture: boolean
  isCurrent: boolean
  /** 虚岁 / 周岁（未来年份不参与计算） */
  xu: number
  zhou: number
}

export function zodiacYearOf(year: number, currentYear: number, birthdayPassed: boolean): ZodiacYear {
  const offset = currentYear - year
  const isFuture = offset < 0
  const info = isFuture ? null : ageOf(year, currentYear, birthdayPassed)
  return {
    year,
    ganzhi: ganzhiOfYear(year),
    offset,
    isFuture,
    isCurrent: offset === 0,
    xu: info == null ? 0 : info.xu,
    zhou: info == null ? 0 : info.zhou
  }
}

/** 「虚岁 7 · 周岁 6」/「还有 6 年」 */
export function zodiacYearAgeText(row: ZodiacYear): string {
  if (row.isFuture) {
    return `还有 ${-row.offset} 年`
  }
  return `虚岁 ${row.xu} · 周岁 ${row.zhou}`
}

/** 行尾小标签：今年 / 未来 / 空 */
export function zodiacYearTag(row: ZodiacYear): string {
  if (row.isCurrent) {
    return '今年'
  }
  if (row.isFuture) {
    return '未来'
  }
  return ''
}

/** 某生肖在 [今年 - pastYears, 今年] 内的所有年份，按年份从新到旧 */
export function yearsOfZodiac(
  index: number,
  currentYear: number,
  birthdayPassed: boolean,
  pastYears: number = ZODIAC_PAST_YEARS
): ZodiacYear[] {
  const list: ZodiacYear[] = []
  const target = wrapIndex(index, 12)
  const oldest = currentYear - pastYears
  for (let year = currentYear; year >= oldest; year--) {
    if (zodiacIndexOfYear(year) === target) {
      list.push(zodiacYearOf(year, currentYear, birthdayPassed))
    }
  }
  return list
}

/** 最近的几个该生肖年份，如「2020 · 2008 · 1996」 */
export function recentYearsText(index: number, currentYear: number, count = 3): string {
  const target = wrapIndex(index, 12)
  const parts: string[] = []
  let year = currentYear
  // 今年不是该生肖时，先往前找到最近的一个
  while (zodiacIndexOfYear(year) !== target) {
    year--
  }
  for (let i = 0; i < count; i++) {
    parts.push(`${year}`)
    year -= 12
  }
  return parts.join(' · ')
}

/** 下一个该生肖年份（未来最近的） */
export function nextYearOfZodiac(index: number, currentYear: number): number {
  const target = wrapIndex(index, 12)
  let year = currentYear + 1
  while (zodiacIndexOfYear(year) !== target) {
    year++
  }
  return year
}

/** 生肖年份列表的标题：「近 100 年内的鼠年 · 9 个」 */
export function yearsTitleOf(zodiac: Zodiac, count: number): string {
  return `近 ${ZODIAC_PAST_YEARS + 1} 年内的${zodiac.name}年 · ${count} 个`
}

// ---------------------------------------------------------------- 输入解析

/** 输入框文本 → 年份，非法（非纯数字 / 超出 1~9999）返回 -1 */
export function parseYearText(text: string): number {
  const trimmed = text.trim()
  if (trimmed.length < 1 || trimmed.length > 4) {
    return -1
  }
  let value = 0
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i)
    if (code < 48 || code > 57) {
      return -1
    }
    value = value * 10 + (code - 48)
  }
  if (value < 1 || value > 9999) {
    return -1
  }
  return value
}

// ---------------------------------------------------------------- 上次的输入

const ZODIAC_YEAR_KEY = 'zodiac-birth-year'
const ZODIAC_INDEX_KEY = 'zodiac-selected'
const ZODIAC_PASSED_KEY = 'zodiac-birthday-passed'

export type ZodiacDraft = {
  /** 出生年份输入框的文本 */
  birthText: string
  /** 选中的生肖（按生肖查年份用） */
  zodiacIndex: number
  /** 今年生日是否已过 */
  birthdayPassed: boolean
}

/** 默认：出生年份取 30 年前，生肖跟着走 */
export function defaultZodiacDraft(currentYear: number): ZodiacDraft {
  const birthYear = currentYear - 30
  return {
    birthText: `${birthYear}`,
    zodiacIndex: zodiacIndexOfYear(birthYear),
    birthdayPassed: true
  }
}

export function loadZodiacDraft(currentYear: number): ZodiacDraft {
  const draft = defaultZodiacDraft(currentYear)
  const yearText = readStorage(ZODIAC_YEAR_KEY)
  if (yearText !== '') {
    draft.birthText = yearText
  }
  const indexText = readStorage(ZODIAC_INDEX_KEY)
  const index = indexText === '' ? -1 : parseInt(indexText, 10)
  if (index >= 0 && index < 12) {
    draft.zodiacIndex = index
  }
  const passedText = readStorage(ZODIAC_PASSED_KEY)
  if (passedText === 'on' || passedText === 'off') {
    draft.birthdayPassed = passedText === 'on'
  }
  return draft
}

export function saveZodiacDraft(draft: ZodiacDraft): void {
  writeStorage(ZODIAC_YEAR_KEY, draft.birthText)
  writeStorage(ZODIAC_INDEX_KEY, `${draft.zodiacIndex}`)
  writeStorage(ZODIAC_PASSED_KEY, draft.birthdayPassed ? 'on' : 'off')
}

// 摩斯码编码 / 解码，纯逻辑，不依赖界面。
//
// 采用国际电信联盟（ITU）标准码表：字母 A–Z、数字 0–9 与常用标点。
// 时序遵循 ITU-R M.1677：点 = 1 个单位、划 = 3 个单位、字符内间隔 = 1 个单位、
// 字符间间隔 = 3 个单位、词间间隔 = 7 个单位；20 WPM 时 1 个单位 = 60ms。
//
// 文字 → 摩斯：字母之间用空格，单词之间用「 / 」（也接受换行 / 逗号等当分隔）。
// 摩斯 → 文字：空格分字符、「/」「|」或连续空格分单词，容忍 · 与 – — − 等异体符号。

import { readStorage, writeStorage } from '../../../common/storage'

/** 1 个单位的时长（毫秒）：20 WPM */
export const MORSE_UNIT_MS = 60
/** 播放上限（毫秒）：内容太长时只播开头，避免排一堆定时器 */
export const MORSE_MAX_PLAY_MS = 20000

// 点划的常见写法（输出可选，解码时都会自动识别）
//   标准：. 与 -；短长：· 与 −；数字：1 与 0（常用于硬件 / 程序里的二进制编码）
export const MORSE_STYLE_STANDARD = 0
export const MORSE_STYLE_DOT_DASH = 1
export const MORSE_STYLE_BINARY = 2
export const MORSE_STYLE_NAMES: string[] = ['标准 . -', '短长 · −', '数字 1 0']

/** 把内部码（. -）转成指定写法的显示串 */
export function styleOfCode(code: string, style: number): string {
  if (style === MORSE_STYLE_STANDARD) {
    return code
  }
  let out = ''
  for (let i = 0; i < code.length; i++) {
    const char = code.charAt(i)
    if (char === '.') {
      out += style === MORSE_STYLE_DOT_DASH ? '·' : '1'
    } else if (char === '-') {
      out += style === MORSE_STYLE_DOT_DASH ? '−' : '0'
    } else {
      out += char
    }
  }
  return out
}

/** 码表分组，速查表按组展示 */
export const MORSE_GROUP_LETTER = 'letter'
export const MORSE_GROUP_DIGIT = 'digit'
export const MORSE_GROUP_PUNCT = 'punct'

/** 一个字符与它的码 */
export type MorseEntry = {
  char: string
  code: string
  group: string
}

/** 一个字母的对照行（速查表） */
export type MorseRow = {
  char: string
  code: string
}

/** ITU 标准码表 */
export const MORSE_TABLE: MorseEntry[] = [
  { char: 'A', code: '.-', group: MORSE_GROUP_LETTER },
  { char: 'B', code: '-...', group: MORSE_GROUP_LETTER },
  { char: 'C', code: '-.-.', group: MORSE_GROUP_LETTER },
  { char: 'D', code: '-..', group: MORSE_GROUP_LETTER },
  { char: 'E', code: '.', group: MORSE_GROUP_LETTER },
  { char: 'F', code: '..-.', group: MORSE_GROUP_LETTER },
  { char: 'G', code: '--.', group: MORSE_GROUP_LETTER },
  { char: 'H', code: '....', group: MORSE_GROUP_LETTER },
  { char: 'I', code: '..', group: MORSE_GROUP_LETTER },
  { char: 'J', code: '.---', group: MORSE_GROUP_LETTER },
  { char: 'K', code: '-.-', group: MORSE_GROUP_LETTER },
  { char: 'L', code: '.-..', group: MORSE_GROUP_LETTER },
  { char: 'M', code: '--', group: MORSE_GROUP_LETTER },
  { char: 'N', code: '-.', group: MORSE_GROUP_LETTER },
  { char: 'O', code: '---', group: MORSE_GROUP_LETTER },
  { char: 'P', code: '.--.', group: MORSE_GROUP_LETTER },
  { char: 'Q', code: '--.-', group: MORSE_GROUP_LETTER },
  { char: 'R', code: '.-.', group: MORSE_GROUP_LETTER },
  { char: 'S', code: '...', group: MORSE_GROUP_LETTER },
  { char: 'T', code: '-', group: MORSE_GROUP_LETTER },
  { char: 'U', code: '..-', group: MORSE_GROUP_LETTER },
  { char: 'V', code: '...-', group: MORSE_GROUP_LETTER },
  { char: 'W', code: '.--', group: MORSE_GROUP_LETTER },
  { char: 'X', code: '-..-', group: MORSE_GROUP_LETTER },
  { char: 'Y', code: '-.--', group: MORSE_GROUP_LETTER },
  { char: 'Z', code: '--..', group: MORSE_GROUP_LETTER },
  { char: '0', code: '-----', group: MORSE_GROUP_DIGIT },
  { char: '1', code: '.----', group: MORSE_GROUP_DIGIT },
  { char: '2', code: '..---', group: MORSE_GROUP_DIGIT },
  { char: '3', code: '...--', group: MORSE_GROUP_DIGIT },
  { char: '4', code: '....-', group: MORSE_GROUP_DIGIT },
  { char: '5', code: '.....', group: MORSE_GROUP_DIGIT },
  { char: '6', code: '-....', group: MORSE_GROUP_DIGIT },
  { char: '7', code: '--...', group: MORSE_GROUP_DIGIT },
  { char: '8', code: '---..', group: MORSE_GROUP_DIGIT },
  { char: '9', code: '----.', group: MORSE_GROUP_DIGIT },
  { char: '.', code: '.-.-.-', group: MORSE_GROUP_PUNCT },
  { char: ',', code: '--..--', group: MORSE_GROUP_PUNCT },
  { char: '?', code: '..--..', group: MORSE_GROUP_PUNCT },
  { char: "'", code: '.----.', group: MORSE_GROUP_PUNCT },
  { char: '!', code: '-.-.--', group: MORSE_GROUP_PUNCT },
  { char: '/', code: '-..-.', group: MORSE_GROUP_PUNCT },
  { char: '(', code: '-.--.', group: MORSE_GROUP_PUNCT },
  { char: ')', code: '-.--.-', group: MORSE_GROUP_PUNCT },
  { char: '&', code: '.-...', group: MORSE_GROUP_PUNCT },
  { char: ':', code: '---...', group: MORSE_GROUP_PUNCT },
  { char: ';', code: '-.-.-.', group: MORSE_GROUP_PUNCT },
  { char: '=', code: '-...-', group: MORSE_GROUP_PUNCT },
  { char: '+', code: '.-.-.', group: MORSE_GROUP_PUNCT },
  { char: '-', code: '-....-', group: MORSE_GROUP_PUNCT },
  { char: '_', code: '..--.-', group: MORSE_GROUP_PUNCT },
  { char: '"', code: '.-..-.', group: MORSE_GROUP_PUNCT },
  { char: '$', code: '...-..-', group: MORSE_GROUP_PUNCT },
  { char: '@', code: '.--.-.', group: MORSE_GROUP_PUNCT }
]

/** 字符 → 码；码表里没有时返回空字符串 */
export function morseOf(char: string): string {
  const upper = char.toUpperCase()
  for (let i = 0; i < MORSE_TABLE.length; i++) {
    if (MORSE_TABLE[i].char === upper) {
      return MORSE_TABLE[i].code
    }
  }
  return ''
}

/** 码 → 字符；无法识别时返回空字符串 */
export function charOf(code: string): string {
  for (let i = 0; i < MORSE_TABLE.length; i++) {
    if (MORSE_TABLE[i].code === code) {
      return MORSE_TABLE[i].char
    }
  }
  return ''
}

/** 按分组取码表（速查表用） */
export function entriesOfGroup(group: string): MorseEntry[] {
  return MORSE_TABLE.filter((entry) => entry.group === group)
}

export function buildRows(group: string): MorseRow[] {
  return entriesOfGroup(group).map((entry) => ({ char: entry.char, code: entry.code }))
}

/** 摩斯的计量结果：字符数、点划数、总单位数与时长 */
export type MorseStats = {
  charCount: number
  elementCount: number
  unitCount: number
  /** 「12 个字符 · 40 点划 · 约 9.4 秒」 */
  summaryText: string
}

/** 按 ITU 时序统计一段摩斯码：空格分字符、/ 分单词 */
export function measureMorse(morse: string): MorseStats {
  let charCount = 0
  let elementCount = 0
  let unitCount = 0
  let charActive = false
  let elementsInChar = 0
  let wordBreakPending = false
  // 末尾补一个分隔符，收尾最后一段
  for (let i = 0; i <= morse.length; i++) {
    const char = i < morse.length ? morse.charAt(i) : ' '
    if (char === ' ' || char === '/' || char === '\n' || char === '\t') {
      if (charActive) {
        charActive = false
        elementsInChar = 0
      }
      if (char === '/' || char === '\n') {
        wordBreakPending = true
      }
      continue
    }
    if (!charActive) {
      charActive = true
      elementsInChar = 0
      // 字符之间 3 个单位，跨词 7 个单位
      if (charCount > 0) {
        unitCount += wordBreakPending ? 7 : 3
      }
      wordBreakPending = false
      charCount += 1
    }
    if (elementsInChar > 0) {
      unitCount += 1
    }
    elementCount += 1
    unitCount += char === '.' ? 1 : 3
    elementsInChar += 1
  }
  const durationSeconds = (unitCount * MORSE_UNIT_MS) / 1000
  return {
    charCount,
    elementCount,
    unitCount,
    summaryText: `${charCount} 个字符 · ${elementCount} 点划 · 约 ${durationSeconds.toFixed(1)} 秒`
  }
}

/** 编码结果 */
export type MorseEncodeResult = {
  /** 编码后的摩斯码（按所选写法） */
  morse: string
  /** 内部写法（. -），播放与统计用 */
  plain: string
  /** 码表里没有的字符（去重后的原始字符，空格拼接） */
  unsupported: string
  stats: MorseStats
}

/** 文字 → 摩斯码。连续空白按单词分隔，不支持的字符（中文等）跳过并记录。 */
export function encodeText(text: string, style: number = MORSE_STYLE_STANDARD): MorseEncodeResult {
  const words: string[] = []
  const unsupported: string[] = []
  let currentWord = ''
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i)
    if (char === ' ' || char === '\n' || char === '\t' || char === '\r') {
      if (currentWord !== '') {
        words.push(currentWord)
        currentWord = ''
      }
      continue
    }
    if (morseOf(char) === '') {
      if (unsupported.indexOf(char) < 0) {
        unsupported.push(char)
      }
      continue
    }
    currentWord += char
  }
  if (currentWord !== '') {
    words.push(currentWord)
  }

  const parts: string[] = []
  for (let w = 0; w < words.length; w++) {
    const codes: string[] = []
    for (let i = 0; i < words[w].length; i++) {
      codes.push(morseOf(words[w].charAt(i)))
    }
    parts.push(codes.join(' '))
  }
  const plain = parts.join(' / ')
  return {
    plain,
    stats: measureMorse(plain),
    unsupported: unsupported.join(' '),
    morse: styleOfCode(plain, style)
  }
}

/** 解码结果 */
export type MorseDecodeResult = {
  /** 解出的文字 */
  text: string
  /** 规整后的码（只有 . 与 -，分隔符统一成空格 / 斜杠），播放与统计用 */
  plain: string
  /** 无法识别的码（去重后拼接） */
  unknown: string
  /** 不是摩斯码、被忽略的字符（汉字、emoji 等） */
  junk: string
  stats: MorseStats
}

/** 规整结果：规整后的码串 + 不是摩斯码、被忽略的字符 */
type MorseNormalized = {
  text: string
  junk: string
}

/** 把各种异体符号规整成 . 与 -，并把分隔符统一成空格 / 斜杠 */
function normalizeMorse(raw: string): MorseNormalized {
  const junk: string[] = []
  let out = ''
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charAt(i)
    if (
      char === '.' ||
      char === '·' ||
      char === '•' ||
      char === '●' ||
      char === '*' ||
      char === '１' ||
      char === '1'
    ) {
      out += '.'
    } else if (
      char === '-' ||
      char === '–' ||
      char === '—' ||
      char === '−' ||
      char === '―' ||
      char === '－' ||
      char === 'ー' ||
      char === '_' ||
      char === '＿' ||
      char === '０' ||
      char === '0'
    ) {
      out += '-'
    } else if (
      char === '|' ||
      char === '/' ||
      char === '｜' ||
      char === '／' ||
      char === '\\' ||
      char === '\n' ||
      char === '\r' ||
      char === '\t' ||
      char === ','
    ) {
      out += ' / '
    } else if (char === ' ') {
      out += ' '
    } else if (char.trim() !== '') {
      // 汉字、emoji 这类不是摩斯码的字符，记下来提示用户
      if (junk.indexOf(char) < 0) {
        junk.push(char)
      }
    }
  }
  return { text: out, junk: junk.join(' ') }
}

/** 摩斯码 → 文字。空格分字符、「/」分单词；无法识别的码跳过并记录。 */
export function decodeMorse(raw: string): MorseDecodeResult {
  const normalized = normalizeMorse(raw)
  const stats = measureMorse(normalized.text)

  const unknown: string[] = []
  let text = ''
  let token = ''
  let pendingWordBreak = false
  const source = normalized.text
  for (let i = 0; i <= source.length; i++) {
    const char = i < source.length ? source.charAt(i) : ' '
    if (char === ' ' || char === '/') {
      if (token !== '') {
        const decoded = charOf(token)
        if (decoded !== '') {
          if (pendingWordBreak && text !== '') {
            text += ' '
          }
          pendingWordBreak = false
          text += decoded
        } else if (unknown.indexOf(token) < 0) {
          unknown.push(token)
        }
        token = ''
      }
      if (char === '/') {
        pendingWordBreak = true
      }
      continue
    }
    token += char
  }
  return { text, plain: normalized.text.trim(), unknown: unknown.join(' '), junk: normalized.junk, stats }
}

/** 播放用的一声音：从播放开始算起的起始时间 + 时长 + 是点还是划 */
export type MorseTone = {
  /** 起始时间（毫秒，从播放开始算） */
  startMs: number
  /** 时长（毫秒） */
  durationMs: number
  /** 是否是划（false 为点） */
  isDah: boolean
}

/** 把摩斯码拆成有发声的音（点 / 划），间隔只用于推进时间，不产生音 */
export function buildTones(morse: string): MorseTone[] {
  const tones: MorseTone[] = []
  let time = 0
  let charActive = false
  let elementsInChar = 0
  let wordBreakPending = false
  let started = false
  for (let i = 0; i <= morse.length; i++) {
    const char = i < morse.length ? morse.charAt(i) : ' '
    if (char === ' ' || char === '/' || char === '\n' || char === '\t') {
      if (charActive) {
        charActive = false
        elementsInChar = 0
      }
      if (char === '/' || char === '\n') {
        wordBreakPending = true
      }
      continue
    }
    if (!charActive) {
      charActive = true
      elementsInChar = 0
      if (started) {
        time += (wordBreakPending ? 7 : 3) * MORSE_UNIT_MS
      }
      wordBreakPending = false
      started = true
    }
    if (elementsInChar > 0) {
      time += MORSE_UNIT_MS
    }
    const isDah = char !== '.'
    const durationMs = (isDah ? 3 : 1) * MORSE_UNIT_MS
    tones.push({ startMs: time, durationMs, isDah })
    time += durationMs
    elementsInChar += 1
  }
  return tones
}

// ---------------------------------------------------------------- 上次输入

const MORSE_MODE_KEY = 'morse-mode'
const MORSE_TEXT_KEY = 'morse-text'
const MORSE_STYLE_KEY = 'morse-style'

/** 编码模式 / 解码模式 */
export const MORSE_MODE_ENCODE = 'encode'
export const MORSE_MODE_DECODE = 'decode'

export type MorseDraft = {
  mode: string
  text: string
  style: number
}

/** 默认：编码模式，空输入，标准写法 */
export function defaultMorseDraft(): MorseDraft {
  return { mode: MORSE_MODE_ENCODE, text: '', style: MORSE_STYLE_STANDARD }
}

export function loadMorseDraft(): MorseDraft {
  const draft = defaultMorseDraft()
  const modeText = readStorage(MORSE_MODE_KEY)
  if (modeText === MORSE_MODE_ENCODE || modeText === MORSE_MODE_DECODE) {
    draft.mode = modeText
  }
  draft.text = readStorage(MORSE_TEXT_KEY)
  const style = readStorage(MORSE_STYLE_KEY)
  if (style !== '') {
    const styleValue = parseInt(style, 10)
    if (styleValue >= 0 && styleValue < MORSE_STYLE_NAMES.length) {
      draft.style = styleValue
    }
  }
  return draft
}

export function saveMorseDraft(draft: MorseDraft): void {
  writeStorage(MORSE_MODE_KEY, draft.mode)
  writeStorage(MORSE_TEXT_KEY, draft.text)
  writeStorage(MORSE_STYLE_KEY, `${draft.style}`)
}

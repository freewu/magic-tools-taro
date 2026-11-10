// 模糊昵称 - 逻辑
//
// 原理：在昵称的每个字符后面插入 Unicode 组合修饰符（combining marks），
// 使其在支持该字形的聊天/游戏场景中呈现「模糊」效果。
// 例：bluefrog + 模糊 1 层 -> b҈l҈u҈e҈f҈r҈o҈g҈
// 说明：组合符是否可见取决于展示端字体，本工具只负责在原文中插入字符。

import { readStorage, writeStorage } from '../../../common/storage'

import { DEFAULT_EFFECT, DEFAULT_NICKNAME, DEFAULT_STRENGTH, effectNames, strengthTexts } from './data'

// 效果风格 -> 组合符池（按字符位置轮换取用，观感更自然）
const POOLS: string[][] = [
  // 0 模糊：经典 ҈ 风格
  ['\u0488'],
  // 1 雪点：叠加在字符上方的点/线组合符
  ['\u0305', '\u033f', '\u0304', '\u0307', '\u0308', '\u030a', '\u0302', '\u030c', '\u0303'],
  // 2 雨点：叠加在字符下方的点/线组合符
  ['\u0316', '\u0317', '\u0318', '\u0319', '\u0323', '\u0325', '\u0329', '\u032e', '\u0332']
]

/** 强度上限：每个字符后最多插入的层数 */
const STRENGTH_MIN = 1
const STRENGTH_MAX = 4

function clamp(v: number, min: number, max: number): number {
  if (v < min) {
    return min
  }
  if (v > max) {
    return max
  }
  return v
}

/**
 * 生成模糊昵称
 * @param raw      原昵称
 * @param effect   效果下标（0 模糊 / 1 雪点 / 2 雨点），越界自动钳制
 * @param strength 强度层数（1-4），越界自动钳制
 */
export function fuzzyNickname(raw: string, effect: number, strength: number): string {
  if (raw === '') {
    return ''
  }
  const pool = POOLS[clamp(effect, 0, POOLS.length - 1)]
  const layers = clamp(strength, STRENGTH_MIN, STRENGTH_MAX)
  let out = ''
  let pos = 0
  while (pos < raw.length) {
    const code: number = raw.charCodeAt(pos) || 0
    let unit = raw.substring(pos, pos + 1)
    let isPair = false
    // 代理对（如 emoji）作为一个整体处理，避免拆散后乱码
    if (code >= 0xd800 && code <= 0xdbff && pos + 1 < raw.length) {
      unit = raw.substring(pos, pos + 2)
      isPair = true
    }
    out += unit
    // 空格、emoji 等无需「模糊」，保持原样，其余字符后追加组合符
    if (unit !== ' ' && !isPair) {
      for (let k = 0; k < layers; k++) {
        out += pool[(pos + k) % pool.length]
      }
    }
    pos += unit.length
  }
  return out
}

// ---------------------------------------------------------------- 上次输入

const DRAFT_KEY = 'fuzzy-nickname-draft'

/** 上次的输入（昵称 + 效果 + 强度） */
export type FuzzyDraft = {
  nickname: string
  effect: number
  strength: number
}

/** 存储文本：昵称\neffect\nstrength（昵称里的换行替换为空格，避免破坏分隔） */
export function fuzzyDraftText(draft: FuzzyDraft): string {
  const nick = draft.nickname.split('\n').join(' ')
  return `${nick}\n${draft.effect}\n${draft.strength}`
}

/** 下标是否落在候选范围内（且为整数） */
function isKnownIndex(index: number, count: number): boolean {
  if (!isFinite(index)) {
    return false
  }
  if (Math.floor(index) !== index) {
    return false
  }
  return index >= 0 && index < count
}

/** 读取上次输入；没存过、格式不对或字段越界时逐项回落默认值 */
export function loadFuzzyDraft(): FuzzyDraft {
  const draft: FuzzyDraft = {
    nickname: DEFAULT_NICKNAME,
    effect: DEFAULT_EFFECT,
    strength: DEFAULT_STRENGTH
  }
  const text = readStorage(DRAFT_KEY)
  if (text === '') {
    return draft
  }
  const parts = text.split('\n')
  if (parts.length < 3) {
    return draft
  }
  const nick = parts[0].trim()
  if (nick !== '') {
    draft.nickname = nick
  }
  const effect = parseInt(parts[1])
  if (isKnownIndex(effect, effectNames.length)) {
    draft.effect = effect
  }
  const strength = parseInt(parts[2])
  if (isKnownIndex(strength, strengthTexts.length)) {
    draft.strength = strength
  }
  return draft
}

/** 保存上次输入 */
export function saveFuzzyDraft(draft: FuzzyDraft): void {
  writeStorage(DRAFT_KEY, fuzzyDraftText(draft))
}

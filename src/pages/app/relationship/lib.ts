// 亲属关系（称谓）查询：关系链 ⇄ 中文称谓。纯逻辑，不依赖界面。
//
// 数据来自 mumuy/relationship（MIT）：用该库把「最多 4 层、每层 10 种关系」的全部组合批量算好，
// 生成到 data.ts，运行时只做 Map 查表，不再需要正则推导，各端表现一致。
//
// 关系链编码：每字符一步。f 爸爸 / m 妈妈 / h 老公 / w 老婆 / s 儿子 / d 女儿 / o 哥哥 / l 弟弟 / j 姐姐 / e 妹妹。
// 例：fm = 爸爸的妈妈 = 奶奶；fmo = 爸爸的妈妈的哥哥 = 大舅爷。

import { readStorage, writeStorage } from '../../../common/storage'
import { REL_DATA_CHUNKS, REL_STEP_CODES, REL_STEP_NAMES } from './data'

/** 一层关系 */
export type RelStep = {
  code: string
  name: string
}

/** 可选的关系步（爸爸 / 妈妈 / …） */
export const REL_STEPS: RelStep[] = REL_STEP_CODES.map((code, index) => ({
  code,
  name: REL_STEP_NAMES[index]
}))

/** 一层关系最多 4 步，超过就没有数据了 */
export const REL_MAX_STEPS = 4

/** 一条称谓数据 */
export type RelEntry = {
  /** 关系链编码 */
  code: string
  /** 正向称谓（长幼未知时会有多个候选，用 / 分隔） */
  name: string
  /** 反向称谓：对方怎么称呼「我」 */
  reverse: string
}

/** 多个候选时给「A / B」这种展示 */
export function nameTextOf(entry: RelEntry): string {
  return entry.name.replace('/', ' / ')
}

export function reverseTextOf(entry: RelEntry): string {
  if (entry.name === '自己') {
    return '自己'
  }
  if (entry.reverse === '') {
    return '不太好确定'
  }
  return entry.reverse.replace('/', ' / ')
}

/** 全部数据（懒加载，只在第一次查询时解析） */
let entriesCache: Map<string, RelEntry> | null = null
/** 称谓 → 关系链编码（同一个称谓可能对应多条关系链，保留最短的那条） */
let nameIndexCache: Map<string, string> | null = null

function ensureLoaded(): void {
  if (entriesCache != null && nameIndexCache != null) {
    return
  }
  const entries = new Map<string, RelEntry>()
  const index = new Map<string, string>()
  for (let i = 0; i < REL_DATA_CHUNKS.length; i++) {
    const pieces = REL_DATA_CHUNKS[i].split(';')
    for (let j = 0; j < pieces.length; j++) {
      const piece = pieces[j]
      if (piece === '') {
        continue
      }
      const fields = piece.split('|')
      if (fields.length < 2) {
        continue
      }
      const entry: RelEntry = {
        code: fields[0],
        name: fields[1],
        reverse: fields.length > 2 ? fields[2] : ''
      }
      entries.set(entry.code, entry)
      const names = entry.name.split('/')
      for (let k = 0; k < names.length; k++) {
        const key = names[k]
        const old = index.get(key)
        if (old == null || old.length > entry.code.length) {
          index.set(key, entry.code)
        }
      }
    }
  }
  entriesCache = entries
  nameIndexCache = index
}

/** 关系链 → 称谓；没有这个组合时返回 null */
export function lookupChain(code: string): RelEntry | null {
  if (code === '') {
    return null
  }
  ensureLoaded()
  const map = entriesCache
  if (map == null) {
    return null
  }
  const entry = map.get(code)
  return entry == null ? null : entry
}

/** 口头叫法 → 数据里的规范称谓：数据只用一种写法（如「外婆」），口语里的其他叫法在这里兜底 */
function buildAliases(): Map<string, string> {
  const map = new Map<string, string>()
  map.set('姥姥', 'mm')
  map.set('姥爷', 'mf')
  map.set('外祖母', 'mm')
  map.set('外祖父', 'mf')
  map.set('姑姑', 'fj')
  map.set('姑妈', 'fj')
  map.set('姑母', 'fj')
  map.set('姑父', 'fjh')
  map.set('姑夫', 'fjh')
  map.set('姨母', 'mj')
  map.set('姨父', 'mjh')
  map.set('姨夫', 'mjh')
  map.set('舅父', 'mo')
  map.set('大爷', 'fo')
  map.set('大伯', 'fo')
  map.set('丈母娘', 'wm')
  map.set('老丈人', 'wf')
  map.set('岳丈', 'wf')
  map.set('表哥', 'fjs')
  map.set('表弟', 'fjs')
  map.set('表姐', 'fjd')
  map.set('表妹', 'fjd')
  map.set('重孙', 'sss')
  map.set('重孙女', 'ssd')
  return map
}

export const REL_ALIASES: Map<string, string> = buildAliases()

/** 称谓 → 关系链；不认识的称谓返回 null */
export function lookupName(name: string): RelEntry | null {
  const key = name.trim()
  if (key === '') {
    return null
  }
  ensureLoaded()
  const index = nameIndexCache
  const entries = entriesCache
  if (index == null || entries == null) {
    return null
  }
  let code = index.get(key)
  if (code == null) {
    // 口语叫法兜底
    const alias = REL_ALIASES.get(key)
    if (alias != null) {
      code = alias
    }
  }
  if (code == null) {
    return null
  }
  const entry = entries.get(code)
  return entry == null ? null : entry
}

/** 称谓数据总量（说明卡里展示） */
export function relationCount(): number {
  ensureLoaded()
  const map = entriesCache
  return map == null ? 0 : map.size
}

/** 单步关系的中文名 */
export function stepNameOf(code: string): string {
  for (let i = 0; i < REL_STEPS.length; i++) {
    if (REL_STEPS[i].code === code) {
      return REL_STEPS[i].name
    }
  }
  return ''
}

/** 关系链编码 → 「我的 爸爸的 妈妈」这种可读文案 */
export function chainTextOf(code: string): string {
  if (code === '') {
    return '我的'
  }
  let text = '我的'
  for (let i = 0; i < code.length; i++) {
    const name = stepNameOf(code.substring(i, i + 1))
    if (name === '') {
      continue
    }
    text = `${text}${name}的`
  }
  return text.substring(0, text.length - 1)
}

/** 把若干步编码拼成关系链 */
export function chainOf(steps: string[]): string {
  let code = ''
  for (let i = 0; i < steps.length; i++) {
    code = code + steps[i]
  }
  return code
}

/** 关系链里是否包含某个关系（含「老公」的组合按女性算） */
export function hasStep(code: string, step: string): boolean {
  return code.indexOf(step) >= 0
}

/** 把关系链编码拆成一步一个的数组 */
export function stepsOf(code: string): string[] {
  const steps: string[] = []
  for (let i = 0; i < code.length; i++) {
    steps.push(code.substring(i, i + 1))
  }
  return steps
}

// ---------------------------------------------------------------- 上次的选择

const REL_CHAIN_KEY = 'rel-chain'
const REL_QUERY_KEY = 'rel-query'

/** 上次的输入 */
export type RelDraft = {
  /** 已选关系链编码 */
  code: string
  /** 反查输入框的称谓 */
  query: string
}

/** 校验：编码里每一步都要是已知关系，且不超过 4 步 */
export function isValidChain(code: string): boolean {
  if (code.length > REL_MAX_STEPS) {
    return false
  }
  for (let i = 0; i < code.length; i++) {
    if (stepNameOf(code.substring(i, i + 1)) === '') {
      return false
    }
  }
  return true
}

export function loadRelDraft(): RelDraft {
  let code = ''
  const savedCode = readStorage(REL_CHAIN_KEY)
  if (isValidChain(savedCode)) {
    code = savedCode
  }
  return { code, query: readStorage(REL_QUERY_KEY) }
}

export function saveRelDraft(draft: RelDraft): void {
  writeStorage(REL_CHAIN_KEY, draft.code)
  writeStorage(REL_QUERY_KEY, draft.query)
}

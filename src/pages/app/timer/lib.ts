// 计时器：毫秒计时、时间格式化与历史记录（纯逻辑，不依赖界面）
//
// 计时本身在页面里按「累计毫秒 + 本段起点」算（Date.now 差值），
// 这样切后台、动画掉帧都不会让时间变慢；这里只提供格式化与历史记录的读写。

import { readStorage, writeStorage } from '../../../common/storage'

/** 历史记录最多保留多少条 */
export const TIMER_HISTORY_LIMIT = 30

/** 本地缓存里存历史记录的键 */
const TIMER_HISTORY_KEY = 'timer-history'

/** 一条历史记录：本次耗时（毫秒）+ 结束时刻（毫秒时间戳） */
export type TimerRecord = {
  elapsed: number
  endedAt: number
}

/** 序列化成一行：耗时,结束时间戳 */
export function encodeRecord(record: TimerRecord): string {
  return `${Math.round(record.elapsed)},${Math.round(record.endedAt)}`
}

/** 解析一行；字段缺失或非法时返回 null */
export function decodeRecord(raw: string): TimerRecord | null {
  if (raw === '') {
    return null
  }
  const parts = raw.split(',')
  if (parts.length < 2) {
    return null
  }
  const elapsed = parseFloat(parts[0])
  const endedAt = parseFloat(parts[1])
  if (!isFinite(elapsed) || elapsed < 0) {
    return null
  }
  return { elapsed: Math.round(elapsed), endedAt: isFinite(endedAt) ? Math.round(endedAt) : 0 }
}

/** 历史列表的一行（已格式化，页面直接渲染） */
export type TimerRow = {
  /** 耗时，如 00:01:23.456 */
  elapsedText: string
  /** 时长的口头说法，如「1 分 23.456 秒」 */
  durationText: string
  /** 结束时刻，如「11-22 20:31:05」 */
  endedText: string
}

function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`
}

function pad3(value: number): string {
  if (value < 10) {
    return `00${value}`
  }
  return value < 100 ? `0${value}` : `${value}`
}

/** 负值当 0；毫秒按「向下取整」显示，避免读数比真实耗时多一点 */
function normalize(ms: number): number {
  if (!isFinite(ms) || ms <= 0) {
    return 0
  }
  return Math.floor(ms)
}

/** 毫秒 → 00:00:00.000（小时位超过 99 会自然变 3 位） */
export function formatElapsed(ms: number): string {
  const total = normalize(ms)
  const hours = Math.floor(total / 3600000)
  const minutes = Math.floor(total / 60000) % 60
  const seconds = Math.floor(total / 1000) % 60
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}.${pad3(total % 1000)}`
}

/** 毫秒 → 口头说法：「12.345 秒」/「1 分 23.456 秒」/「1 小时 2 分 3.456 秒」 */
export function formatDuration(ms: number): string {
  const total = normalize(ms)
  const hours = Math.floor(total / 3600000)
  const minutes = Math.floor(total / 60000) % 60
  const seconds = Math.floor(total / 1000) % 60
  const sec = `${seconds}.${pad3(total % 1000)} 秒`
  if (hours > 0) {
    return `${hours} 小时 ${minutes} 分 ${sec}`
  }
  if (minutes > 0) {
    return `${minutes} 分 ${sec}`
  }
  return sec
}

/** 时间戳 → 「MM-DD HH:mm:ss」；同一天省略日期 */
export function formatEndedAt(endedAt: number, now: number): string {
  if (!isFinite(endedAt) || endedAt <= 0) {
    return ''
  }
  const date = new Date(endedAt)
  const current = new Date(now)
  const clock = `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
  if (
    date.getFullYear() === current.getFullYear() &&
    date.getMonth() === current.getMonth() &&
    date.getDate() === current.getDate()
  ) {
    return clock
  }
  return `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${clock}`
}

/** 计时显示的一段拆分：页面按段渲染（固定宽度），数字变化时整行不会左右抖动 */
export type TimerParts = {
  /** 完整文本 00:00:00.000 */
  full: string
  hours: string
  minutes: string
  seconds: string
  millis: string
  /** 口头说法，如「1 分 23.456 秒」 */
  duration: string
}

export function splitElapsed(ms: number): TimerParts {
  const total = normalize(ms)
  return {
    full: formatElapsed(total),
    hours: pad2(Math.floor(total / 3600000)),
    minutes: pad2(Math.floor(total / 60000) % 60),
    seconds: pad2(Math.floor(total / 1000) % 60),
    millis: pad3(total % 1000),
    duration: formatDuration(total)
  }
}

/** 历史记录 → 展示行（新的在前） */
export function toRows(list: TimerRecord[]): TimerRow[] {
  const now = Date.now()
  return list.map((record) => ({
    elapsedText: formatElapsed(record.elapsed),
    durationText: formatDuration(record.elapsed),
    endedText: formatEndedAt(record.endedAt, now)
  }))
}

/** 读取历史记录（忽略解析不出来的行） */
export function loadTimerHistory(): TimerRecord[] {
  const out: TimerRecord[] = []
  const text = readStorage(TIMER_HISTORY_KEY)
  if (text === '') {
    return out
  }
  const lines = text.split('\n')
  for (let i = 0; i < lines.length && out.length < TIMER_HISTORY_LIMIT; i++) {
    const record = decodeRecord(lines[i])
    if (record != null) {
      out.push(record)
    }
  }
  return out
}

/** 写入历史记录（只存前 TIMER_HISTORY_LIMIT 条） */
export function saveTimerHistory(list: TimerRecord[]): void {
  const limit = list.length < TIMER_HISTORY_LIMIT ? list.length : TIMER_HISTORY_LIMIT
  const lines: string[] = []
  for (let i = 0; i < limit; i++) {
    lines.push(encodeRecord(list[i]))
  }
  writeStorage(TIMER_HISTORY_KEY, lines.join('\n'))
}

/** 记一条（新的放最前，超出上限截断） */
export function addTimerRecord(list: TimerRecord[], record: TimerRecord): TimerRecord[] {
  const next: TimerRecord[] = [record]
  for (let i = 0; i < list.length && next.length < TIMER_HISTORY_LIMIT; i++) {
    next.push(list[i])
  }
  return next
}

export function removeTimerRecordAt(list: TimerRecord[], index: number): TimerRecord[] {
  return list.filter((_, i) => i !== index)
}

/** 清空：返回空列表并抹掉缓存（页面据此重置展示） */
export function clearTimerHistory(): TimerRecord[] {
  writeStorage(TIMER_HISTORY_KEY, '')
  return []
}

/** 平均 / 最快 / 最慢（毫秒）；空列表返回 0 */
export function averageElapsed(list: TimerRecord[]): number {
  if (list.length === 0) {
    return 0
  }
  let sum = 0
  for (let i = 0; i < list.length; i++) {
    sum += list[i].elapsed
  }
  return Math.round(sum / list.length)
}

export function fastestElapsed(list: TimerRecord[]): number {
  let best = 0
  for (let i = 0; i < list.length; i++) {
    if (best === 0 || list[i].elapsed < best) {
      best = list[i].elapsed
    }
  }
  return best
}

export function slowestElapsed(list: TimerRecord[]): number {
  let worst = 0
  for (let i = 0; i < list.length; i++) {
    if (list[i].elapsed > worst) {
      worst = list[i].elapsed
    }
  }
  return worst
}

/** 统计摘要，如「共 5 次 · 平均 00:01:23.456 · 最快 … · 最慢 …」 */
export function summarize(list: TimerRecord[]): string {
  if (list.length === 0) {
    return ''
  }
  return `共 ${list.length} 次 · 平均 ${formatElapsed(averageElapsed(list))} · 最快 ${formatElapsed(
    fastestElapsed(list)
  )} · 最慢 ${formatElapsed(slowestElapsed(list))}`
}

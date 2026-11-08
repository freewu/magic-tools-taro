// 历史朝代查询逻辑

import { dynasties, type DynastyItem } from './data'

/** 返回命中索引；未命中返回 -1（从晚到早匹配，重叠区间取更细化时段） */
export function findDynasty(year: number): number {
  for (let i = dynasties.length - 1; i >= 0; i--) {
    const item = dynasties[i]
    if (year >= item.startYear && (item.endYear === 0 || year <= item.endYear)) {
      return i
    }
  }
  return -1
}

export function fmtYear(y: number): string {
  if (y === 0) {
    return '至今'
  }
  if (y < 0) {
    return `公元前 ${-y} 年`
  }
  return `${y} 年`
}

export function fmtRange(startYear: number, endYear: number): string {
  return `${fmtYear(startYear)} ~ ${fmtYear(endYear)}`
}

/** 只保留数字与开头的一个负号（公元前） */
export function sanitizeYear(raw: string): string {
  let v = raw.replace(/[^0-9-]/g, '')
  let dashes = 0
  for (let i = 0; i < v.length; i++) {
    if (v.substring(i, i + 1) === '-') {
      dashes++
    }
  }
  if (dashes > 1) {
    v = v.replace(/-/g, '')
  }
  if (v.indexOf('-') > 0) {
    v = v.replace(/-/g, '')
  }
  return v
}

/** 年份查询结果：命中时给出朝代、起止与都城，未命中给出提示 */
export type DynastyMatch =
  | { kind: 'empty' }
  | { kind: 'miss'; text: string }
  | { kind: 'hit'; item: DynastyItem; range: string; years: string }

export function matchYear(raw: string, currentYear: number): DynastyMatch {
  const text = raw.trim()
  if (text === '' || text === '-') {
    return { kind: 'empty' }
  }
  const year = parseInt(text)
  if (!isFinite(year)) {
    return { kind: 'miss', text: '请输入整数年份（公元前用负号）' }
  }
  const idx = findDynasty(year)
  if (idx < 0) {
    return { kind: 'miss', text: `${year} 年不在收录分期内，可能处于割据/过渡时期` }
  }
  const item = dynasties[idx]
  const years = item.endYear !== 0 ? `约 ${currentYear - year} 年` : '—'
  return { kind: 'hit', item, range: fmtRange(item.startYear, item.endYear), years }
}

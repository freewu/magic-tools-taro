// 世界时钟：城市列表的本地存取、默认城市与时间格式化

import { readStorage, writeStorage } from '../../../common/storage'

import type { CityOption } from './cities'

/** 存储键：首个字段是格式版本，之后每行一个城市「名称|时区缩写|UTC 偏移」 */
const CITIES_KEY = 'world-time-cities'
const TEXT_HEADER = 'v1'

/** 可选的 UTC 偏移范围（与真实时区一致：UTC-12 ~ UTC+14） */
const OFFSET_MIN = -12
const OFFSET_MAX = 14

const WEEK_NAMES: string[] = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

/** 一个时钟项（默认城市与自定义城市共用） */
export type CityClock = {
  name: string
  code: string
  offset: number
}

/** 首次进入时的默认城市 */
export function defaultCities(): CityClock[] {
  return [
    { name: '北京', code: 'CST', offset: 8 },
    { name: '东京', code: 'JST', offset: 9 },
    { name: '伦敦', code: 'GMT', offset: 0 },
    { name: '纽约', code: 'EST', offset: -5 },
    { name: '悉尼', code: 'AEST', offset: 10 }
  ]
}

/** 偏移是否在合法范围内 */
export function isKnownOffset(offset: number): boolean {
  if (!isFinite(offset)) {
    return false
  }
  return offset >= OFFSET_MIN && offset <= OFFSET_MAX
}

/** 解析一行存储文本，坏数据返回 null */
function parseCityLine(line: string): CityClock | null {
  const parts = line.split('|')
  if (parts.length < 3) {
    return null
  }
  const name = parts[0].trim()
  if (name === '') {
    return null
  }
  const offset = parseFloat(parts[2])
  if (!isKnownOffset(offset)) {
    return null
  }
  return { name, code: parts[1].trim(), offset }
}

/** 读取城市列表：没存过时返回默认城市；存过空列表（用户全删了）就返回空 */
export function loadCities(): CityClock[] {
  const value = readStorage(CITIES_KEY)
  if (value === '') {
    return defaultCities()
  }
  const lines = value.split('\n')
  if (lines.length === 0 || lines[0] !== TEXT_HEADER) {
    return defaultCities()
  }
  const cities: CityClock[] = []
  for (let i = 1; i < lines.length; i++) {
    const city = parseCityLine(lines[i])
    if (city == null) {
      continue
    }
    // 同名城市只保留一个
    if (hasCity(cities, city.name)) {
      continue
    }
    cities.push(city)
  }
  return cities
}

/** 写入城市列表（用户删光时写入「仅有版本头」的文本，下次进入保持为空） */
export function saveCities(cities: CityClock[]): void {
  const lines: string[] = [TEXT_HEADER]
  for (let i = 0; i < cities.length; i++) {
    const city = cities[i]
    lines.push(`${city.name}|${city.code}|${city.offset}`)
  }
  writeStorage(CITIES_KEY, lines.join('\n'))
}

/** 列表里是否已有同名城市 */
export function hasCity(cities: CityClock[], name: string): boolean {
  for (let i = 0; i < cities.length; i++) {
    if (cities[i].name === name) {
      return true
    }
  }
  return false
}

/** 追加一个城市（已存在则原样返回） */
export function appendCity(cities: CityClock[], name: string, code: string, offset: number): CityClock[] {
  const out: CityClock[] = [...cities]
  if (!hasCity(cities, name)) {
    out.push({ name, code, offset })
  }
  return out
}

/** 删除指定下标的城市 */
export function removeCityAt(cities: CityClock[], index: number): CityClock[] {
  return cities.filter((_, i) => i !== index)
}

/** 常用城市选择器的候选（排除已添加的） */
export function filterOptions(catalog: CityOption[], cities: CityClock[]): CityOption[] {
  const out: CityOption[] = []
  for (let i = 0; i < catalog.length; i++) {
    if (!hasCity(cities, catalog[i].name)) {
      out.push(catalog[i])
    }
  }
  return out
}

function pad2(num: number): string {
  if (num < 10) {
    return `0${num}`
  }
  return `${num}`
}

/** 偏移文案：UTC+8 / UTC-5 / UTC+5:30 / UTC+5:45 */
export function formatOffset(offset: number): string {
  const sign = offset < 0 ? '-' : '+'
  const abs = Math.abs(offset)
  const hours = Math.floor(abs)
  const minutes = Math.round((abs - hours) * 60)
  if (minutes === 0) {
    return `UTC${sign}${hours}`
  }
  return `UTC${sign}${hours}:${pad2(minutes)}`
}

/** 选择器上的显示文案：东京（JST, UTC+9） */
export function cityLabel(option: CityOption): string {
  return `${option.name}（${option.code}, ${formatOffset(option.offset)}）`
}

/** 时区缩写：自定义城市没填时显示「自定义」 */
export function codeTextOf(code: string): string {
  if (code === '') {
    return '自定义'
  }
  return code
}

/** 该时区的当前时间 HH:mm:ss */
export function timeTextOf(offset: number, nowMs: number): string {
  const shifted = new Date(nowMs + offset * 3600 * 1000)
  return `${pad2(shifted.getUTCHours())}:${pad2(shifted.getUTCMinutes())}:${pad2(shifted.getUTCSeconds())}`
}

/** 该时区的当前日期 YYYY-MM-DD 星期X */
export function dateTextOf(offset: number, nowMs: number): string {
  const shifted = new Date(nowMs + offset * 3600 * 1000)
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())} ${
    WEEK_NAMES[shifted.getUTCDay()]
  }`
}

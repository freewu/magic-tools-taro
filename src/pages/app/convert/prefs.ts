// 单位换算的偏好设置：是否显示常见参照物 + 每套单位表各自的默认体系 / 单位 / 结果体系。
//
// 8 个换算工具共用同一份设置，但默认值按单位表 id 分开存（distance / area / volume ...），
// 这样「面积换算」设成英制不会影响「长度换算」。
// 存成一串文本（开关;表id|体系|单位|体系;...），读不到或字段非法时逐项回落：
// 没有记录的单位表就用它自己的默认值，行为与未设置时完全一致。

import Taro from '@tarojs/taro'

const CONVERT_PREFS_KEY = 'convert-prefs'

// 一套单位表的默认选择
export type CatalogPrefEntry = {
	catalogId: string
	// 默认展示体系
	systemId: string
	// 默认展示单位
	unitId: string
	// 默认换算结果体系
	tabSystemId: string
}

export type ConvertPrefs = {
	// 是否显示「常见长度 / 常见面积 …」参照物卡片（所有换算页通用）
	showSamples: boolean
	// 各套单位表的默认选择，顺序无关
	entries: CatalogPrefEntry[]
}

export function defaultPrefs(): ConvertPrefs {
	return { showSamples: true, entries: [] }
}

// 取某套单位表的设置；没有记录时返回 null
export function findEntry(prefs: ConvertPrefs, catalogId: string): CatalogPrefEntry | null {
	for (let i = 0; i < prefs.entries.length; i++) {
		if (prefs.entries[i].catalogId == catalogId) {
			return prefs.entries[i]
		}
	}
	return null
}

// 写入（同一套单位表只保留一条）
export function putEntry(prefs: ConvertPrefs, entry: CatalogPrefEntry) {
	for (let i = 0; i < prefs.entries.length; i++) {
		if (prefs.entries[i].catalogId == entry.catalogId) {
			prefs.entries[i] = entry
			return
		}
	}
	prefs.entries.push(entry)
}

// 序列化：1/0;catalog|system|unit|tab;...（同时用作「设置有没有变化」的比较键）
export function encodePrefs(prefs: ConvertPrefs): string {
	let out = prefs.showSamples ? '1' : '0'
	for (let i = 0; i < prefs.entries.length; i++) {
		const entry = prefs.entries[i]
		out += ';' + entry.catalogId + '|' + entry.systemId + '|' + entry.unitId + '|' + entry.tabSystemId
	}
	return out
}

export function loadPrefs(): ConvertPrefs {
	const prefs = defaultPrefs()
	const raw = Taro.getStorageSync(CONVERT_PREFS_KEY)
	if (raw == null) {
		return prefs
	}
	const text = raw as string
	if (text == '') {
		return prefs
	}
	const blocks = text.split(';')
	prefs.showSamples = blocks[0] != '0'
	for (let i = 1; i < blocks.length; i++) {
		const parts = blocks[i].split('|')
		if (parts.length < 4 || parts[0] == '') {
			continue
		}
		const entry: CatalogPrefEntry = {
			catalogId: parts[0],
			systemId: parts[1],
			unitId: parts[2],
			tabSystemId: parts[3]
		}
		// 体系串或单位串不合法时由页面兜底（用单位表自身默认值），这里只过滤明显无效的记录
		if (entry.unitId != '') {
			putEntry(prefs, entry)
		}
	}
	return prefs
}

export function savePrefs(prefs: ConvertPrefs) {
	Taro.setStorageSync(CONVERT_PREFS_KEY, encodePrefs(prefs))
}

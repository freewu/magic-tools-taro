// 设置页「单位换算」卡片用的视图数据：每种换算类型一块，全部展开。
//
// 这里只做「单位表 + 偏好 → 选择器选项」的搬运，改值后调用 savePrefs 落到存储里。

import { MeasureCatalog, MeasureUnit, systemLabelOf } from './catalog'
import { CONVERT_CATALOGS } from './catalogs'
import { CatalogPrefEntry, ConvertPrefs, findEntry, putEntry } from './prefs'

// 一块 = 一种换算类型（长度 / 面积 / …）
export type ConvertBlock = {
	catalogId: string
	// 区块标题，如「长度换算」
	title: string
	// 体系名；只有一种体系时为空数组（不显示体系相关的两行）
	systems: string[]
	systemIndex: number
	// 单位选项文本与 id（只列当前体系下的单位）
	units: string[]
	unitIds: string[]
	unitIndex: number
	tabIndex: number
}

function systemIndexOf(catalog: MeasureCatalog, systemId: string): number {
	for (let i = 0; i < catalog.systems.length; i++) {
		if (catalog.systems[i] == systemId) {
			return i
		}
	}
	return 0
}

// 某套单位表的设置；没有记录时按它自己的默认单位建一条
export function entryFor(prefs: ConvertPrefs, catalog: MeasureCatalog): CatalogPrefEntry {
	const found = findEntry(prefs, catalog.id)
	if (found != null) {
		return found
	}
	const unit = catalog.defaultUnit()
	const entry: CatalogPrefEntry = {
		catalogId: catalog.id,
		systemId: unit.system,
		unitId: unit.id,
		tabSystemId: unit.system
	}
	putEntry(prefs, entry)
	return entry
}

function blockOf(prefs: ConvertPrefs, catalog: MeasureCatalog): ConvertBlock {
	const entry = entryFor(prefs, catalog)
	const systemIndex = systemIndexOf(catalog, entry.systemId)
	// 不分体系的换算（如温度）一次列出全部单位
	const list: MeasureUnit[] = catalog.splitsBySystem()
		? catalog.unitsOf(catalog.systems[systemIndex])
		: catalog.units
	const units: string[] = []
	const unitIds: string[] = []
	let unitIndex = 0
	for (let i = 0; i < list.length; i++) {
		units.push(list[i].label + '（' + list[i].symbol + '）')
		unitIds.push(list[i].id)
		if (list[i].id == entry.unitId) {
			unitIndex = i
		}
	}
	const systems: string[] = []
	if (catalog.splitsBySystem()) {
		for (let s = 0; s < catalog.systems.length; s++) {
			systems.push(systemLabelOf(catalog.systems[s]))
		}
	}
	return {
		catalogId: catalog.id,
		title: catalog.name + '换算',
		systems: systems,
		systemIndex: systemIndex,
		units: units,
		unitIds: unitIds,
		unitIndex: unitIndex,
		tabIndex: systemIndexOf(catalog, entry.tabSystemId)
	}
}

export function buildBlocks(prefs: ConvertPrefs): ConvertBlock[] {
	const out: ConvertBlock[] = []
	for (let i = 0; i < CONVERT_CATALOGS.length; i++) {
		out.push(blockOf(prefs, CONVERT_CATALOGS[i]))
	}
	return out
}

// 改默认展示体系：单位跟着换成该体系第一个
export function setBlockSystem(prefs: ConvertPrefs, catalogIndex: number, pickIndex: number): boolean {
	if (catalogIndex < 0 || catalogIndex >= CONVERT_CATALOGS.length) {
		return false
	}
	const catalog = CONVERT_CATALOGS[catalogIndex]
	if (pickIndex < 0 || pickIndex >= catalog.systems.length) {
		return false
	}
	const entry = entryFor(prefs, catalog)
	entry.systemId = catalog.systems[pickIndex]
	const list = catalog.unitsOf(entry.systemId)
	if (list.length > 0) {
		entry.unitId = list[0].id
	}
	return true
}

export function setBlockUnit(prefs: ConvertPrefs, catalogIndex: number, pickIndex: number): boolean {
	if (catalogIndex < 0 || catalogIndex >= CONVERT_CATALOGS.length) {
		return false
	}
	const catalog = CONVERT_CATALOGS[catalogIndex]
	const entry = entryFor(prefs, catalog)
	const list = catalog.splitsBySystem()
		? catalog.unitsOf(catalog.systems[systemIndexOf(catalog, entry.systemId)])
		: catalog.units
	if (pickIndex < 0 || pickIndex >= list.length) {
		return false
	}
	entry.unitId = list[pickIndex].id
	return true
}

export function setBlockTabSystem(prefs: ConvertPrefs, catalogIndex: number, pickIndex: number): boolean {
	if (catalogIndex < 0 || catalogIndex >= CONVERT_CATALOGS.length) {
		return false
	}
	const catalog = CONVERT_CATALOGS[catalogIndex]
	if (pickIndex < 0 || pickIndex >= catalog.systems.length) {
		return false
	}
	entryFor(prefs, catalog).tabSystemId = catalog.systems[pickIndex]
	return true
}

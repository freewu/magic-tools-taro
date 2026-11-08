// 车牌城市解析逻辑
import { plateProvinces, plateLetters, PlateProvince, PlateCity } from './data'

export type PlateResult = {
	matched: boolean
	provinceName: string
	prefix: string
	letter: string
	detail: string
	note: string
}

export function lookupPlate(plate: string): PlateResult {
	const raw = plate.trim().toUpperCase()
	if (raw.length == 0) {
		return { matched: false, provinceName: '', prefix: '', letter: '', detail: '', note: '请输入车牌号或省份简称+字母' }
	}
	// 取前 1~2 位：省份简称（可能两个汉字，如“黑龙江”→“黑”）
	const candidates: string[] = []
	for (let i = 0; i < plateProvinces.length; i++) {
		const p = plateProvinces[i]
		if (raw.indexOf(p.prefix) == 0) {
			candidates.push(p.prefix)
		}
	}
	if (candidates.length == 0) {
		return { matched: false, provinceName: '', prefix: '', letter: '', detail: '', note: '未识别到省份简称（如 京、浙、粤）' }
	}
	const prefix = candidates[0]
	const rest = raw.substring(prefix.length)
	let letter = ''
	for (let i = 0; i < rest.length; i++) {
		const ch = rest.charAt(i)
		if ((ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9')) {
			letter = ch
			break
		}
	}

	for (let i = 0; i < plateProvinces.length; i++) {
		const prov = plateProvinces[i]
		if (prov.prefix == prefix) {
			if (letter == '') {
				return { matched: true, provinceName: prov.name, prefix: prefix, letter: '', detail: prov.name, note: prov.note }
			}
			if (prov.cities.length == 0) {
				return { matched: true, provinceName: prov.name, prefix: prefix, letter: letter, detail: prov.name, note: prov.note }
			}
			for (let j = 0; j < prov.cities.length; j++) {
				const c = prov.cities[j]
				if (c.letter == letter) {
					return { matched: true, provinceName: prov.name, prefix: prefix, letter: letter, detail: c.city, note: '' }
				}
			}
			let detail = '未收录（' + prov.name + '，该字母或为新增号段）'
			if (letter == 'I' || letter == 'O') {
				detail = '未收录（' + prov.name + '，号牌编排不使用 I、O）'
			}
			return { matched: true, provinceName: prov.name, prefix: prefix, letter: letter, detail: detail, note: '' }
		}
	}
	return { matched: false, provinceName: '', prefix: '', letter: '', detail: '', note: '未找到对应省份' }
}

// ---------------------------------------------------------------- 选择器辅助

// 省份文案：京 · 北京
export function provinceLabelOf(prov: PlateProvince): string {
	return prov.prefix + ' · ' + prov.name
}

// 省份简称在表里的下标（找不到为 -1）
export function provinceIndexOf(prefix: string): number {
	for (let i = 0; i < plateProvinces.length; i++) {
		if (plateProvinces[i].prefix == prefix) {
			return i
		}
	}
	return -1
}

// 去掉城市名里的括号备注：佛山（原顺德专段）→ 佛山
export function shortCityName(city: string): string {
	const at = city.indexOf('（')
	if (at > 0) {
		return city.substring(0, at)
	}
	return city
}

// 某省份某字母对应的城市（未收录返回空串）
export function cityOfLetter(prov: PlateProvince, letter: string): string {
	for (let i = 0; i < prov.cities.length; i++) {
		if (prov.cities[i].letter == letter) {
			return prov.cities[i].city
		}
	}
	return ''
}

// 字母选择器候选：0 是不限字母，之后是 A~Z（已收录的带城市名，I/O 标注不使用）
export function letterLabelsOf(prov: PlateProvince): string[] {
	const out: string[] = ['不限字母']
	for (let i = 0; i < plateLetters.length; i++) {
		const letter = plateLetters[i]
		const city = shortCityName(cityOfLetter(prov, letter))
		if (city != '') {
			out.push(letter + ' · ' + city)
		} else if (letter == 'I' || letter == 'O') {
			out.push(letter + ' · 号牌不使用')
		} else {
			out.push(letter)
		}
	}
	return out
}

// 字母下标（0 表示不限）→ 字母；越界或 0 返回空串
export function letterOfIndex(index: number): string {
	if (index <= 0 || index > plateLetters.length) {
		return ''
	}
	return plateLetters[index - 1]
}

// 字母 → 选择器下标（0 表示不限）
export function indexOfLetter(letter: string): number {
	for (let i = 0; i < plateLetters.length; i++) {
		if (plateLetters[i] == letter) {
			return i + 1
		}
	}
	return 0
}

// 某省份收录的全部号段，按 A~Z 顺序排列（只选汉字时列表用）
export function letterRowsOf(prov: PlateProvince): PlateCity[] {
	const out: PlateCity[] = []
	for (let i = 0; i < plateLetters.length; i++) {
		const letter = plateLetters[i]
		for (let j = 0; j < prov.cities.length; j++) {
			if (prov.cities[j].letter == letter) {
				out.push(prov.cities[j])
				break
			}
		}
	}
	return out
}

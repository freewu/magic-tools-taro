// 单位换算的通用数据模型（对象形式）：计量体系 / 单位 / 参照物 / 单位表。
//
// 8 个「XX 换算」工具共用这一套对象：每个工具只是一份 MeasureCatalog 数据
// （见 ./catalogs.uts），页面逻辑（./convert.uvue）完全由数据驱动，
// 新增一个换算工具只需在 catalogs.uts 里追加一份单位表。
//
// 每个单位只记录「1 个该单位 = 多少基准单位」的分数（分子 / 分母）与偏移，
// 避免 0.3048、0.09290304 这类十进制字面量在连续换算中累积误差：
// 基准值 = 数值 × 分数 + 偏移（温度这类仿射单位偏移非 0）。

// ---------------------------------------------------------------- 计量体系

// 体系 id（持久化 / 分组用的稳定标识）
export const SYSTEM_METRIC = 'metric'
export const SYSTEM_IMPERIAL = 'imperial'
export const SYSTEM_CHINESE = 'chinese'

// 一个计量体系：公制 / 英制 / 市制
export class MeasureSystem {
	id: string = ''
	label: string = ''

	constructor(id: string, label: string) {
		this.id = id
		this.label = label
	}
}

export const MEASURE_SYSTEMS: MeasureSystem[] = [
	new MeasureSystem(SYSTEM_METRIC, '公制'),
	new MeasureSystem(SYSTEM_IMPERIAL, '英制'),
	new MeasureSystem(SYSTEM_CHINESE, '市制')
]

// 体系名称；未知体系原样返回 id
export function systemLabelOf(systemId: string): string {
	for (let i = 0; i < MEASURE_SYSTEMS.length; i++) {
		if (MEASURE_SYSTEMS[i].id == systemId) {
			return MEASURE_SYSTEMS[i].label
		}
	}
	return systemId
}

// ---------------------------------------------------------------- 单位

// 构造一个单位所需的配置（见 catalogs.uts，全部字段显式给出，便于批量维护）
export type MeasureUnitConfig = {
	id: string
	label: string
	symbol: string
	system: string
	numerator: number
	denominator: number
	offset: number
	note: string
}

// 一个换算单位，例如「千米 / km / 公制 / 1000 米」
export class MeasureUnit {
	// 内部标识，如 km、sqm、kg
	id: string = ''
	// 中文名称，如「千米」
	label: string = ''
	// 短标签，用于输入框后缀与结果行，如 km、m²、kg
	symbol: string = ''
	// 所属体系 id
	system: string = ''
	// 折算成基准单位时的分子 / 分母，如 1 英尺 = 3048/10000 米
	numerator: number = 1
	denominator: number = 1
	// 换算到基准单位时的偏移量（比例单位都是 0，温度才非 0）
	offset: number = 0
	// 需要额外解释的单位（海里、亩、长吨等）附一句说明
	note: string = ''

	constructor(cfg: MeasureUnitConfig) {
		this.id = cfg.id
		this.label = cfg.label
		this.symbol = cfg.symbol
		this.system = cfg.system
		this.numerator = cfg.numerator
		this.denominator = cfg.denominator
		this.offset = cfg.offset
		this.note = cfg.note
	}

	// 换算系数（长度是「米」，面积是「平方米」，重量是「千克」，容量是「升」）
	baseValue(): number {
		return this.numerator / this.denominator
	}

	// 把该单位的数值换成基准单位的值
	toBase(value: number): number {
		return value * this.baseValue() + this.offset
	}

	// 把基准单位的值换回该单位的数值
	fromBase(value: number): number {
		return (value - this.offset) / this.baseValue()
	}

	// 体系名称，用于分组标题
	systemLabel(): string {
		return systemLabelOf(this.system)
	}
}

// ---------------------------------------------------------------- 参照物

// 常见参照物，点一下就能代入数值（如「马拉松 42.195 千米」）
export type MeasureSampleConfig = {
	label: string
	value: number
	unitId: string
}

export class MeasureSample {
	// 参照物名称，如「马拉松」
	label: string = ''
	// 对应的数值
	value: number = 0
	// 单位 id（见 MeasureCatalog.units）
	unitId: string = ''

	constructor(cfg: MeasureSampleConfig) {
		this.label = cfg.label
		this.value = cfg.value
		this.unitId = cfg.unitId
	}
}

// ---------------------------------------------------------------- 结果行

// 结果列表的一行（纯展示数据：把类实例换算成字符串后再放进响应式状态）
export type ConvertRow = {
	// 单位中文名
	label: string
	// 单位短标签
	symbol: string
	// 换算后的数值文本
	text: string
	// 是否为当前输入单位（高亮显示）
	highlight: boolean
}

// ---------------------------------------------------------------- 单位表

// 一套单位表的配置
export type MeasureCatalogConfig = {
	id: string
	name: string
	baseName: string
	defaultUnitId: string
	systems: string[]
	groupedBySystem: boolean
	units: MeasureUnit[]
	samples: MeasureSample[]
}

// 一个换算工具的全部数据：单位表 + 体系 + 参照物
export class MeasureCatalog {
	// 深链参数与存储键前缀，如 distance、area
	id: string = ''
	// 名称，如「长度」，用于「常见长度」等文案
	name: string = ''
	// 基准单位名，如「米」「平方米」
	baseName: string = ''
	// 打开页面时默认选中的单位 id
	defaultUnitId: string = ''
	// 这套单位用到的体系（温度只有公制与英制）
	systems: string[] = []
	// 是否按体系分组（温度、热量、压力不分体系，一次列出全部单位）
	groupedBySystem: boolean = true
	// 全部单位，顺序即结果列表顺序
	units: MeasureUnit[] = []
	// 常见参照物
	samples: MeasureSample[] = []

	constructor(cfg: MeasureCatalogConfig) {
		this.id = cfg.id
		this.name = cfg.name
		this.baseName = cfg.baseName
		this.defaultUnitId = cfg.defaultUnitId
		this.systems = cfg.systems
		this.groupedBySystem = cfg.groupedBySystem
		this.units = cfg.units
		this.samples = cfg.samples
	}

	// 页面是否真的按体系分组：既要声明分组，体系也得确实多于一个
	splitsBySystem(): boolean {
		return this.groupedBySystem && this.systems.length > 1
	}

	// 按 id 查单位，找不到返回 null
	unitById(id: string): MeasureUnit | null {
		for (let i = 0; i < this.units.length; i++) {
			if (this.units[i].id == id) {
				return this.units[i]
			}
		}
		return null
	}

	// 某体系下的全部单位
	unitsOf(systemId: string): MeasureUnit[] {
		const out: MeasureUnit[] = []
		for (let i = 0; i < this.units.length; i++) {
			if (this.units[i].system == systemId) {
				out.push(this.units[i])
			}
		}
		return out
	}

	// 默认单位；配置写错时退回第一个，保证页面总能打开
	defaultUnit(): MeasureUnit {
		const unit = this.unitById(this.defaultUnitId)
		if (unit != null) {
			return unit
		}
		return this.units[0]
	}

	// 参照物对应的单位，id 写错时为 null
	unitOfSample(sample: MeasureSample): MeasureUnit | null {
		return this.unitById(sample.unitId)
	}

	// 把 value 个 from 换算成 to 的数值；非有限数或系数非法时返回 null
	convert(value: number, from: MeasureUnit, to: MeasureUnit): number | null {
		if (!isFinite(value)) {
			return null
		}
		const fromBase = from.baseValue()
		const toBase = to.baseValue()
		if (!isFinite(fromBase) || !isFinite(toBase)) {
			return null
		}
		if (fromBase <= 0 || toBase <= 0) {
			return null
		}
		return to.fromBase(from.toBase(value))
	}
}

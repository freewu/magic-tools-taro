// 8 套单位换算数据（对象形式）：长度 / 面积 / 容量 / 重量 / 温度 / 热量 / 压力 / 速度。
//
// 每套数据是一个 MeasureCatalog 对象（数据模型见 ./catalog.uts），
// 页面 ./convert.uvue 由这些对象驱动，改数据即可改工具，不用改页面逻辑。
//
// 单位系数用分数保存（如 1 英尺 = 3048/10000 米），避免十进制字面量累积误差；
// 温度是仿射换算，用 offset 表示零点偏移（如 摄氏 = 开尔文 × 1 − 273.15）。

import { MeasureCatalog, MeasureSample, MeasureUnit } from './catalog'


// 长度换算：以米为基准，共 25 个单位、12 个参照物
export const lengthCatalog: MeasureCatalog = new MeasureCatalog({
	id: 'distance',
	name: '长度',
	baseName: '米',
	defaultUnitId: 'm',
	systems: ['metric', 'imperial', 'chinese'],
	groupedBySystem: true,
	units: [
		new MeasureUnit({
			id: 'km',
			label: '千米',
			symbol: 'km',
			system: 'metric',
			numerator: 1000,
			denominator: 1,
			offset: 0,
			note: '1 千米 = 1000 米，也叫公里'
		}),
		new MeasureUnit({
			id: 'm',
			label: '米',
			symbol: 'm',
			system: 'metric',
			numerator: 1,
			denominator: 1,
			offset: 0,
			note: ''
		}),
		new MeasureUnit({
			id: 'dm',
			label: '分米',
			symbol: 'dm',
			system: 'metric',
			numerator: 1,
			denominator: 10,
			offset: 0,
			note: ''
		}),
		new MeasureUnit({
			id: 'cm',
			label: '厘米',
			symbol: 'cm',
			system: 'metric',
			numerator: 1,
			denominator: 100,
			offset: 0,
			note: ''
		}),
		new MeasureUnit({
			id: 'mm',
			label: '毫米',
			symbol: 'mm',
			system: 'metric',
			numerator: 1,
			denominator: 1000,
			offset: 0,
			note: ''
		}),
		new MeasureUnit({
			id: 'um',
			label: '微米',
			symbol: 'μm',
			system: 'metric',
			numerator: 1,
			denominator: 1000000,
			offset: 0,
			note: ''
		}),
		new MeasureUnit({
			id: 'nm',
			label: '纳米',
			symbol: 'nm',
			system: 'metric',
			numerator: 1,
			denominator: 1000000000,
			offset: 0,
			note: ''
		}),
		new MeasureUnit({
			id: 'pm',
			label: '皮米',
			symbol: 'pm',
			system: 'metric',
			numerator: 1,
			denominator: 1000000000000,
			offset: 0,
			note: ''
		}),
		new MeasureUnit({
			id: 'nmile',
			label: '海里',
			symbol: 'nmi',
			system: 'metric',
			numerator: 1852,
			denominator: 1,
			offset: 0,
			note: '1 海里 = 1852 米，按地球子午线 1 分弧长定义'
		}),
		new MeasureUnit({
			id: 'inch',
			label: '英寸',
			symbol: 'in',
			system: 'imperial',
			numerator: 254,
			denominator: 10000,
			offset: 0,
			note: '1 英寸 = 2.54 厘米'
		}),
		new MeasureUnit({
			id: 'foot',
			label: '英尺',
			symbol: 'ft',
			system: 'imperial',
			numerator: 3048,
			denominator: 10000,
			offset: 0,
			note: '1 英尺 = 12 英寸 = 0.3048 米'
		}),
		new MeasureUnit({
			id: 'yard',
			label: '码',
			symbol: 'yd',
			system: 'imperial',
			numerator: 9144,
			denominator: 10000,
			offset: 0,
			note: '1 码 = 3 英尺 = 0.9144 米'
		}),
		new MeasureUnit({
			id: 'mile',
			label: '英里',
			symbol: 'mi',
			system: 'imperial',
			numerator: 1609344,
			denominator: 1000,
			offset: 0,
			note: '1 英里 = 1760 码 = 1609.344 米'
		}),
		new MeasureUnit({
			id: 'fathom',
			label: '英寻',
			symbol: 'fth',
			system: 'imperial',
			numerator: 1829,
			denominator: 1000,
			offset: 0,
			note: '1 英寻 = 6 英尺 = 1.8288 米，航海测深常用'
		}),
		new MeasureUnit({
			id: 'chain',
			label: '链',
			symbol: 'ch',
			system: 'imperial',
			numerator: 201168,
			denominator: 10000,
			offset: 0,
			note: '测链，1 链 = 66 英尺 = 20.1168 米'
		}),
		new MeasureUnit({
			id: 'furlong',
			label: '化朗',
			symbol: 'fur',
			system: 'imperial',
			numerator: 201168,
			denominator: 1000,
			offset: 0,
			note: '1 化朗 = 10 链 = 201.168 米，赛马距离常用'
		}),
		new MeasureUnit({
			id: 'li',
			label: '里',
			symbol: '里',
			system: 'chinese',
			numerator: 500,
			denominator: 1,
			offset: 0,
			note: '1 里 = 150 丈 = 500 米'
		}),
		new MeasureUnit({
			id: 'yin',
			label: '引',
			symbol: '引',
			system: 'chinese',
			numerator: 500,
			denominator: 15,
			offset: 0,
			note: '1 引 = 10 丈 ≈ 33.33 米'
		}),
		new MeasureUnit({
			id: 'zhang',
			label: '丈',
			symbol: '丈',
			system: 'chinese',
			numerator: 50,
			denominator: 15,
			offset: 0,
			note: '1 丈 = 10 尺 ≈ 3.333 米'
		}),
		new MeasureUnit({
			id: 'chi',
			label: '尺',
			symbol: '尺',
			system: 'chinese',
			numerator: 5,
			denominator: 15,
			offset: 0,
			note: '1 尺 = 1/3 米 ≈ 33.33 厘米'
		}),
		new MeasureUnit({
			id: 'cun',
			label: '寸',
			symbol: '寸',
			system: 'chinese',
			numerator: 5,
			denominator: 150,
			offset: 0,
			note: '1 寸 = 1/10 尺 ≈ 3.333 厘米'
		}),
		new MeasureUnit({
			id: 'fen',
			label: '分',
			symbol: '分',
			system: 'chinese',
			numerator: 5,
			denominator: 1500,
			offset: 0,
			note: '1 分 = 1/10 寸 ≈ 3.333 毫米'
		}),
		new MeasureUnit({
			id: 'li2',
			label: '厘',
			symbol: '厘',
			system: 'chinese',
			numerator: 5,
			denominator: 15000,
			offset: 0,
			note: '1 厘 = 1/10 分 ≈ 0.333 毫米'
		}),
		new MeasureUnit({
			id: 'hao',
			label: '毫',
			symbol: '毫',
			system: 'chinese',
			numerator: 5,
			denominator: 150000,
			offset: 0,
			note: '1 毫 = 1/10 厘 ≈ 33.3 微米'
		}),
		new MeasureUnit({
			id: 'si',
			label: '丝',
			symbol: '丝',
			system: 'chinese',
			numerator: 5,
			denominator: 1500000,
			offset: 0,
			note: '1 丝 = 1/10 毫 ≈ 3.33 微米'
		}),
	],
	samples: [
		new MeasureSample({ label: 'A4 纸厚', value: 0.1, unitId: 'mm' }),
		new MeasureSample({ label: '身份证宽', value: 85.6, unitId: 'mm' }),
		new MeasureSample({ label: '身高', value: 170, unitId: 'cm' }),
		new MeasureSample({ label: '马拉松', value: 42.195, unitId: 'km' }),
		new MeasureSample({ label: '珠峰高度', value: 8848.86, unitId: 'm' }),
		new MeasureSample({ label: '地球直径', value: 12756, unitId: 'km' }),
		new MeasureSample({ label: '地月距离', value: 384400, unitId: 'km' }),
		new MeasureSample({ label: '日地距离', value: 149600000, unitId: 'km' }),
		new MeasureSample({ label: '一光年', value: 9460730472580.8, unitId: 'km' }),
		new MeasureSample({ label: '一英里', value: 1, unitId: 'mile' }),
		new MeasureSample({ label: '一海里', value: 1, unitId: 'nmile' }),
		new MeasureSample({ label: '一里', value: 1, unitId: 'li' }),
	]
})

// 面积换算：以平方米为基准，共 19 个单位、11 个参照物
export const areaCatalog: MeasureCatalog = new MeasureCatalog({
	id: 'area',
	name: '面积',
	baseName: '平方米',
	defaultUnitId: 'sqm',
	systems: ['metric', 'imperial', 'chinese'],
	groupedBySystem: true,
	units: [
		new MeasureUnit({
			id: 'sqkm',
			label: '平方千米',
			symbol: 'km²',
			system: 'metric',
			numerator: 1000000,
			denominator: 1,
			offset: 0,
			note: '1 平方千米 = 1000000 平方米 = 100 公顷'
		}),
		new MeasureUnit({
			id: 'ha',
			label: '公顷',
			symbol: 'ha',
			system: 'metric',
			numerator: 10000,
			denominator: 1,
			offset: 0,
			note: '1 公顷 = 10000 平方米 = 15 亩'
		}),
		new MeasureUnit({
			id: 'are',
			label: '公亩',
			symbol: 'a',
			system: 'metric',
			numerator: 100,
			denominator: 1,
			offset: 0,
			note: '1 公亩 = 100 平方米'
		}),
		new MeasureUnit({
			id: 'sqm',
			label: '平方米',
			symbol: 'm²',
			system: 'metric',
			numerator: 1,
			denominator: 1,
			offset: 0,
			note: ''
		}),
		new MeasureUnit({
			id: 'sqdm',
			label: '平方分米',
			symbol: 'dm²',
			system: 'metric',
			numerator: 1,
			denominator: 100,
			offset: 0,
			note: ''
		}),
		new MeasureUnit({
			id: 'sqcm',
			label: '平方厘米',
			symbol: 'cm²',
			system: 'metric',
			numerator: 1,
			denominator: 10000,
			offset: 0,
			note: ''
		}),
		new MeasureUnit({
			id: 'sqmm',
			label: '平方毫米',
			symbol: 'mm²',
			system: 'metric',
			numerator: 1,
			denominator: 1000000,
			offset: 0,
			note: ''
		}),
		new MeasureUnit({
			id: 'sqmi',
			label: '平方英里',
			symbol: 'mi²',
			system: 'imperial',
			numerator: 2589988110336,
			denominator: 1000000,
			offset: 0,
			note: '1 平方英里 = 640 英亩 = 2.58999 平方千米'
		}),
		new MeasureUnit({
			id: 'acre',
			label: '英亩',
			symbol: 'ac',
			system: 'imperial',
			numerator: 40468564224,
			denominator: 10000000,
			offset: 0,
			note: '1 英亩 = 4840 平方码 ≈ 4046.86 平方米 ≈ 6.07 亩'
		}),
		new MeasureUnit({
			id: 'sqyd',
			label: '平方码',
			symbol: 'yd²',
			system: 'imperial',
			numerator: 83612736,
			denominator: 100000000,
			offset: 0,
			note: '1 平方码 = 9 平方英尺'
		}),
		new MeasureUnit({
			id: 'sqft',
			label: '平方英尺',
			symbol: 'ft²',
			system: 'imperial',
			numerator: 9290304,
			denominator: 100000000,
			offset: 0,
			note: '1 平方英尺 = 144 平方英寸 ≈ 0.0929 平方米'
		}),
		new MeasureUnit({
			id: 'sqin',
			label: '平方英寸',
			symbol: 'in²',
			system: 'imperial',
			numerator: 64516,
			denominator: 100000000,
			offset: 0,
			note: '1 平方英寸 = 6.4516 平方厘米'
		}),
		new MeasureUnit({
			id: 'sqli',
			label: '平方里',
			symbol: '里²',
			system: 'chinese',
			numerator: 250000,
			denominator: 1,
			offset: 0,
			note: '1 平方里 = 500² 平方米 = 0.25 平方千米'
		}),
		new MeasureUnit({
			id: 'qing',
			label: '顷',
			symbol: '顷',
			system: 'chinese',
			numerator: 200000,
			denominator: 3,
			offset: 0,
			note: '1 顷 = 100 亩 ≈ 6.667 公顷'
		}),
		new MeasureUnit({
			id: 'mu',
			label: '亩',
			symbol: '亩',
			system: 'chinese',
			numerator: 2000,
			denominator: 3,
			offset: 0,
			note: '1 亩 = 60 平方丈 ≈ 666.67 平方米'
		}),
		new MeasureUnit({
			id: 'fen',
			label: '分',
			symbol: '分',
			system: 'chinese',
			numerator: 200,
			denominator: 3,
			offset: 0,
			note: '1 分 = 1/10 亩 ≈ 66.67 平方米'
		}),
		new MeasureUnit({
			id: 'li2',
			label: '厘',
			symbol: '厘',
			system: 'chinese',
			numerator: 20,
			denominator: 3,
			offset: 0,
			note: '1 厘 = 1/10 分 ≈ 6.67 平方米'
		}),
		new MeasureUnit({
			id: 'sqzhang',
			label: '平方丈',
			symbol: '丈²',
			system: 'chinese',
			numerator: 100,
			denominator: 9,
			offset: 0,
			note: '1 平方丈 = 100/9 平方米 ≈ 11.11 平方米'
		}),
		new MeasureUnit({
			id: 'sqchi',
			label: '平方尺',
			symbol: '尺²',
			system: 'chinese',
			numerator: 1,
			denominator: 9,
			offset: 0,
			note: '1 平方尺 = 1/9 平方米 ≈ 0.111 平方米'
		}),
	],
	samples: [
		new MeasureSample({ label: 'A4 纸', value: 0.06237, unitId: 'sqm' }),
		new MeasureSample({ label: '一平方英尺', value: 1, unitId: 'sqft' }),
		new MeasureSample({ label: '篮球场', value: 420, unitId: 'sqm' }),
		new MeasureSample({ label: '一亩', value: 1, unitId: 'mu' }),
		new MeasureSample({ label: '足球场', value: 7140, unitId: 'sqm' }),
		new MeasureSample({ label: '一公顷', value: 1, unitId: 'ha' }),
		new MeasureSample({ label: '一英亩', value: 1, unitId: 'acre' }),
		new MeasureSample({ label: '故宫', value: 720000, unitId: 'sqm' }),
		new MeasureSample({ label: '天安门广场', value: 440000, unitId: 'sqm' }),
		new MeasureSample({ label: '中国国土', value: 9600000, unitId: 'sqkm' }),
		new MeasureSample({ label: '地球表面', value: 510072000, unitId: 'sqkm' }),
	]
})

// 容量换算：以升为基准，共 17 个单位、11 个参照物
export const volumeCatalog: MeasureCatalog = new MeasureCatalog({
	id: 'volume',
	name: '容量',
	baseName: '升',
	defaultUnitId: 'l',
	systems: ['metric', 'imperial', 'chinese'],
	groupedBySystem: true,
	units: [
		new MeasureUnit({
			id: 'm3',
			label: '立方米',
			symbol: 'm³',
			system: 'metric',
			numerator: 1000,
			denominator: 1,
			offset: 0,
			note: '1 立方米 = 1000 升，自来水与燃气常按立方米计费'
		}),
		new MeasureUnit({
			id: 'l',
			label: '升',
			symbol: 'L',
			system: 'metric',
			numerator: 1,
			denominator: 1,
			offset: 0,
			note: ''
		}),
		new MeasureUnit({
			id: 'dl',
			label: '分升',
			symbol: 'dL',
			system: 'metric',
			numerator: 1,
			denominator: 10,
			offset: 0,
			note: '1 分升 = 0.1 升 = 100 毫升'
		}),
		new MeasureUnit({
			id: 'cl',
			label: '厘升',
			symbol: 'cL',
			system: 'metric',
			numerator: 1,
			denominator: 100,
			offset: 0,
			note: '1 厘升 = 10 毫升'
		}),
		new MeasureUnit({
			id: 'ml',
			label: '毫升',
			symbol: 'mL',
			system: 'metric',
			numerator: 1,
			denominator: 1000,
			offset: 0,
			note: '1 毫升 = 1 立方厘米'
		}),
		new MeasureUnit({
			id: 'ul',
			label: '微升',
			symbol: 'μL',
			system: 'metric',
			numerator: 1,
			denominator: 1000000,
			offset: 0,
			note: '1 微升 = 1 立方毫米，实验室常用'
		}),
		new MeasureUnit({
			id: 'gal',
			label: '加仑',
			symbol: 'gal',
			system: 'imperial',
			numerator: 454609,
			denominator: 100000,
			offset: 0,
			note: '英制加仑 = 4.54609 升（美制加仑 ≈ 3.785 升）'
		}),
		new MeasureUnit({
			id: 'qt',
			label: '夸脱',
			symbol: 'qt',
			system: 'imperial',
			numerator: 454609,
			denominator: 400000,
			offset: 0,
			note: '1 夸脱 = 1/4 加仑 = 1.1365225 升'
		}),
		new MeasureUnit({
			id: 'pt',
			label: '品脱',
			symbol: 'pt',
			system: 'imperial',
			numerator: 454609,
			denominator: 800000,
			offset: 0,
			note: '1 品脱 = 1/2 夸脱 ≈ 568.26 毫升，酒吧常见'
		}),
		new MeasureUnit({
			id: 'floz',
			label: '液量盎司',
			symbol: 'fl oz',
			system: 'imperial',
			numerator: 454609,
			denominator: 16000000,
			offset: 0,
			note: '英制液量盎司 = 1/160 加仑 ≈ 28.41 毫升'
		}),
		new MeasureUnit({
			id: 'bu',
			label: '蒲式耳',
			symbol: 'bu',
			system: 'imperial',
			numerator: 3636872,
			denominator: 100000,
			offset: 0,
			note: '1 蒲式耳 = 8 加仑 = 36.36872 升，谷物计量单位'
		}),
		new MeasureUnit({
			id: 'dan',
			label: '石',
			symbol: '石',
			system: 'chinese',
			numerator: 100,
			denominator: 1,
			offset: 0,
			note: '1 石 = 10 斗 = 100 升，古代粮米常用'
		}),
		new MeasureUnit({
			id: 'dou',
			label: '斗',
			symbol: '斗',
			system: 'chinese',
			numerator: 10,
			denominator: 1,
			offset: 0,
			note: '1 斗 = 10 升'
		}),
		new MeasureUnit({
			id: 'sheng',
			label: '升',
			symbol: '升',
			system: 'chinese',
			numerator: 1,
			denominator: 1,
			offset: 0,
			note: '1 市升 = 1 升 = 1000 毫升'
		}),
		new MeasureUnit({
			id: 'ge',
			label: '合',
			symbol: '合',
			system: 'chinese',
			numerator: 1,
			denominator: 10,
			offset: 0,
			note: '1 合 = 1/10 升 = 100 毫升'
		}),
		new MeasureUnit({
			id: 'shao',
			label: '勺',
			symbol: '勺',
			system: 'chinese',
			numerator: 1,
			denominator: 100,
			offset: 0,
			note: '1 勺 = 1/10 合 = 10 毫升'
		}),
		new MeasureUnit({
			id: 'cuo',
			label: '撮',
			symbol: '撮',
			system: 'chinese',
			numerator: 1,
			denominator: 1000,
			offset: 0,
			note: '1 撮 = 1/10 勺 = 1 毫升'
		}),
	],
	samples: [
		new MeasureSample({ label: '一勺药水', value: 5, unitId: 'ml' }),
		new MeasureSample({ label: '一杯水', value: 250, unitId: 'ml' }),
		new MeasureSample({ label: '一听可乐', value: 330, unitId: 'ml' }),
		new MeasureSample({ label: '一瓶矿泉水', value: 550, unitId: 'ml' }),
		new MeasureSample({ label: '一升水', value: 1, unitId: 'l' }),
		new MeasureSample({ label: '一桶食用油', value: 5, unitId: 'l' }),
		new MeasureSample({ label: '饮水机水桶', value: 18.9, unitId: 'l' }),
		new MeasureSample({ label: '汽车油箱', value: 50, unitId: 'l' }),
		new MeasureSample({ label: '一加仑', value: 1, unitId: 'gal' }),
		new MeasureSample({ label: '一斗', value: 1, unitId: 'dou' }),
		new MeasureSample({ label: '标准泳池', value: 2500000, unitId: 'l' }),
	]
})

// 重量换算：以千克为基准，共 17 个单位、11 个参照物
export const weightCatalog: MeasureCatalog = new MeasureCatalog({
	id: 'weight',
	name: '重量',
	baseName: '千克',
	defaultUnitId: 'kg',
	systems: ['metric', 'imperial', 'chinese'],
	groupedBySystem: true,
	units: [
		new MeasureUnit({
			id: 't',
			label: '吨',
			symbol: 't',
			system: 'metric',
			numerator: 1000,
			denominator: 1,
			offset: 0,
			note: '1 吨 = 1000 千克'
		}),
		new MeasureUnit({
			id: 'kg',
			label: '千克',
			symbol: 'kg',
			system: 'metric',
			numerator: 1,
			denominator: 1,
			offset: 0,
			note: '千克是国际单位制的质量基本单位，日常也叫公斤'
		}),
		new MeasureUnit({
			id: 'g',
			label: '克',
			symbol: 'g',
			system: 'metric',
			numerator: 1,
			denominator: 1000,
			offset: 0,
			note: ''
		}),
		new MeasureUnit({
			id: 'mg',
			label: '毫克',
			symbol: 'mg',
			system: 'metric',
			numerator: 1,
			denominator: 1000000,
			offset: 0,
			note: ''
		}),
		new MeasureUnit({
			id: 'ug',
			label: '微克',
			symbol: 'μg',
			system: 'metric',
			numerator: 1,
			denominator: 1000000000,
			offset: 0,
			note: ''
		}),
		new MeasureUnit({
			id: 'longton',
			label: '长吨',
			symbol: 'ton',
			system: 'imperial',
			numerator: 10160469088,
			denominator: 10000000,
			offset: 0,
			note: '英吨，1 长吨 = 2240 磅 = 1016.0469088 千克'
		}),
		new MeasureUnit({
			id: 'shortton',
			label: '短吨',
			symbol: 'sh tn',
			system: 'imperial',
			numerator: 90718474,
			denominator: 100000,
			offset: 0,
			note: '美吨，1 短吨 = 2000 磅 = 907.18474 千克'
		}),
		new MeasureUnit({
			id: 'lb',
			label: '磅',
			symbol: 'lb',
			system: 'imperial',
			numerator: 45359237,
			denominator: 100000000,
			offset: 0,
			note: '1 磅 = 16 盎司 = 0.45359237 千克'
		}),
		new MeasureUnit({
			id: 'oz',
			label: '盎司',
			symbol: 'oz',
			system: 'imperial',
			numerator: 45359237,
			denominator: 1600000000,
			offset: 0,
			note: '常衡盎司，1 盎司 = 1/16 磅 ≈ 28.35 克'
		}),
		new MeasureUnit({
			id: 'st',
			label: '英石',
			symbol: 'st',
			system: 'imperial',
			numerator: 635029318,
			denominator: 100000000,
			offset: 0,
			note: '1 英石 = 14 磅 = 6.35029318 千克，英国人报体重常用'
		}),
		new MeasureUnit({
			id: 'gr',
			label: '格令',
			symbol: 'gr',
			system: 'imperial',
			numerator: 6479891,
			denominator: 100000000000,
			offset: 0,
			note: '1 格令 = 64.79891 毫克，药量与弹药常用'
		}),
		new MeasureUnit({
			id: 'dan',
			label: '担',
			symbol: '担',
			system: 'chinese',
			numerator: 50,
			denominator: 1,
			offset: 0,
			note: '1 担 = 100 斤 = 50 千克'
		}),
		new MeasureUnit({
			id: 'jin',
			label: '斤',
			symbol: '斤',
			system: 'chinese',
			numerator: 1,
			denominator: 2,
			offset: 0,
			note: '1 斤 = 500 克 = 10 两'
		}),
		new MeasureUnit({
			id: 'liang',
			label: '两',
			symbol: '两',
			system: 'chinese',
			numerator: 1,
			denominator: 20,
			offset: 0,
			note: '1 两 = 50 克（旧制 1 斤 = 16 两，今按 10 两计）'
		}),
		new MeasureUnit({
			id: 'qian',
			label: '钱',
			symbol: '钱',
			system: 'chinese',
			numerator: 1,
			denominator: 200,
			offset: 0,
			note: '1 钱 = 5 克，中药抓药常用'
		}),
		new MeasureUnit({
			id: 'fen',
			label: '分',
			symbol: '分',
			system: 'chinese',
			numerator: 1,
			denominator: 2000,
			offset: 0,
			note: '1 分 = 0.5 克'
		}),
		new MeasureUnit({
			id: 'li2',
			label: '厘',
			symbol: '厘',
			system: 'chinese',
			numerator: 1,
			denominator: 20000,
			offset: 0,
			note: '1 厘 = 0.05 克'
		}),
	],
	samples: [
		new MeasureSample({ label: '一粒米', value: 0.02, unitId: 'g' }),
		new MeasureSample({ label: '一枚鸡蛋', value: 50, unitId: 'g' }),
		new MeasureSample({ label: '一杯牛奶', value: 250, unitId: 'g' }),
		new MeasureSample({ label: '一瓶矿泉水', value: 550, unitId: 'g' }),
		new MeasureSample({ label: '一个成年人', value: 65, unitId: 'kg' }),
		new MeasureSample({ label: '一袋大米', value: 10, unitId: 'kg' }),
		new MeasureSample({ label: '一斤', value: 1, unitId: 'jin' }),
		new MeasureSample({ label: '一磅', value: 1, unitId: 'lb' }),
		new MeasureSample({ label: '一头大象', value: 5000, unitId: 'kg' }),
		new MeasureSample({ label: '一辆小汽车', value: 1.5, unitId: 't' }),
		new MeasureSample({ label: '一头蓝鲸', value: 150, unitId: 't' }),
	]
})

// 温度换算：以摄氏度为基准，共 4 个单位、12 个参照物；不按体系分组，公制英制单位合并展示
export const temperatureCatalog: MeasureCatalog = new MeasureCatalog({
	id: 'temperature',
	name: '温度',
	baseName: '摄氏度',
	defaultUnitId: 'c',
	systems: ['metric', 'imperial'],
	groupedBySystem: false,
	units: [
		new MeasureUnit({
			id: 'c',
			label: '摄氏度',
			symbol: '°C',
			system: 'metric',
			numerator: 1,
			denominator: 1,
			offset: 0,
			note: '水的冰点 0 °C、沸点 100 °C（标准大气压）'
		}),
		new MeasureUnit({
			id: 'k',
			label: '开尔文',
			symbol: 'K',
			system: 'metric',
			numerator: 1,
			denominator: 1,
			offset: -273.15,
			note: '绝对零度 = 0 K = −273.15 °C，温差与摄氏度一致'
		}),
		new MeasureUnit({
			id: 'f',
			label: '华氏度',
			symbol: '°F',
			system: 'imperial',
			numerator: 5,
			denominator: 9,
			offset: -160 / 9,
			note: '水的冰点 32 °F、沸点 212 °F，摄氏 = (华氏 − 32) × 5/9'
		}),
		new MeasureUnit({
			id: 'r',
			label: '兰氏度',
			symbol: '°R',
			system: 'imperial',
			numerator: 5,
			denominator: 9,
			offset: -273.15,
			note: '绝对零度 = 0 °R，1 °R = 1 °F 的间隔'
		}),
	],
	samples: [
		new MeasureSample({ label: '绝对零度', value: -273.15, unitId: 'c' }),
		new MeasureSample({ label: '水的冰点', value: 0, unitId: 'c' }),
		new MeasureSample({ label: '冰箱冷藏', value: 4, unitId: 'c' }),
		new MeasureSample({ label: '人体体温', value: 36.5, unitId: 'c' }),
		new MeasureSample({ label: '发烧 38.5', value: 38.5, unitId: 'c' }),
		new MeasureSample({ label: '水的沸点', value: 100, unitId: 'c' }),
		new MeasureSample({ label: '桑拿房', value: 90, unitId: 'c' }),
		new MeasureSample({ label: '烤箱烘焙', value: 180, unitId: 'c' }),
		new MeasureSample({ label: '铁的熔点', value: 1538, unitId: 'c' }),
		new MeasureSample({ label: '太阳表面', value: 5500, unitId: 'c' }),
		new MeasureSample({ label: '华氏冰点', value: 32, unitId: 'f' }),
		new MeasureSample({ label: '华氏沸点', value: 100, unitId: 'f' }),
	]
})

// 热量换算：以焦耳为基准，共 9 个单位（含英制 BTU）、9 个参照物，按公制 / 英制分组
export const energyCatalog: MeasureCatalog = new MeasureCatalog({
	id: 'energy',
	name: '热量',
	baseName: '焦耳',
	defaultUnitId: 'wh',
	systems: ['metric', 'imperial'],
	groupedBySystem: true,
	units: [
		new MeasureUnit({
			id: 'milliwh',
			label: '毫瓦时',
			symbol: 'mWh',
			system: 'metric',
			numerator: 18,
			denominator: 5,
			offset: 0,
			note: '1 毫瓦时 = 3.6 焦耳，常用于电池容量的小数值'
		}),
		new MeasureUnit({
			id: 'wh',
			label: '瓦时',
			symbol: 'Wh',
			system: 'metric',
			numerator: 3600,
			denominator: 1,
			offset: 0,
			note: '1 瓦时 = 3600 焦耳，电池容量常用它标注'
		}),
		new MeasureUnit({
			id: 'kwh',
			label: '千瓦时',
			symbol: 'kWh',
			system: 'metric',
			numerator: 3600000,
			denominator: 1,
			offset: 0,
			note: '1 千瓦时 = 360 万焦耳，也就是电表上的「1 度电」'
		}),
		new MeasureUnit({
			id: 'mwh',
			label: '兆瓦时',
			symbol: 'MWh',
			system: 'metric',
			numerator: 3600000000,
			denominator: 1,
			offset: 0,
			note: '1 兆瓦时 = 1000 千瓦时，电厂与年度用电量常用它'
		}),
		new MeasureUnit({
			id: 'j',
			label: '焦耳',
			symbol: 'J',
			system: 'metric',
			numerator: 1,
			denominator: 1,
			offset: 0,
			note: '国际单位制的能量单位，1 焦耳 = 1 牛·米'
		}),
		new MeasureUnit({
			id: 'kj',
			label: '千焦',
			symbol: 'kJ',
			system: 'metric',
			numerator: 1000,
			denominator: 1,
			offset: 0,
			note: '1 千焦 = 1000 焦耳，营养成分表上的能量常用它'
		}),
		new MeasureUnit({
			id: 'cal',
			label: '卡路里',
			symbol: 'cal',
			system: 'metric',
			numerator: 523,
			denominator: 125,
			offset: 0,
			note: '1 卡 = 4.184 焦耳，指把 1 克水升温 1 °C 所需的热量'
		}),
		new MeasureUnit({
			id: 'kcal',
			label: '千卡',
			symbol: 'kcal',
			system: 'metric',
			numerator: 4184,
			denominator: 1,
			offset: 0,
			note: '1 千卡 = 1000 卡 = 4184 焦耳，就是食品标签上的「大卡」'
		}),
		new MeasureUnit({
			id: 'btu',
			label: '英热单位',
			symbol: 'BTU',
			system: 'imperial',
			numerator: 105505585262,
			denominator: 100000000,
			offset: 0,
			note: '1 BTU ≈ 1055.06 焦耳，英美空调与燃气表常用的热量单位'
		}),
	],
	samples: [
		new MeasureSample({ label: '一节 5 号电池', value: 10, unitId: 'kj' }),
		new MeasureSample({ label: '手机电池', value: 15, unitId: 'wh' }),
		new MeasureSample({ label: '一度电', value: 1, unitId: 'kwh' }),
		new MeasureSample({ label: '一克糖', value: 4, unitId: 'kcal' }),
		new MeasureSample({ label: '一根香蕉', value: 89, unitId: 'kcal' }),
		new MeasureSample({ label: '一杯牛奶', value: 155, unitId: 'kcal' }),
		new MeasureSample({ label: '一碗米饭', value: 232, unitId: 'kcal' }),
		new MeasureSample({ label: '跑 1 公里', value: 60, unitId: 'kcal' }),
		new MeasureSample({ label: '美式空调制冷量', value: 12000, unitId: 'btu' }),
	]
})

// 压力换算：以帕斯卡为基准，共 7 个单位、8 个参照物，按公制 / 英制分组
export const pressureCatalog: MeasureCatalog = new MeasureCatalog({
	id: 'pressure',
	name: '压力',
	baseName: '帕斯卡',
	defaultUnitId: 'pa',
	systems: ['metric', 'imperial'],
	groupedBySystem: true,
	units: [
		new MeasureUnit({
			id: 'pa',
			label: '帕',
			symbol: 'Pa',
			system: 'metric',
			numerator: 1,
			denominator: 1,
			offset: 0,
			note: '1 帕 = 1 牛/平方米，国际单位制的压强单位'
		}),
		new MeasureUnit({
			id: 'hpa',
			label: '百帕',
			symbol: 'hPa',
			system: 'metric',
			numerator: 100,
			denominator: 1,
			offset: 0,
			note: '1 百帕 = 100 帕，天气预报里的标准大气压是 1013.25 hPa'
		}),
		new MeasureUnit({
			id: 'kpa',
			label: '千帕',
			symbol: 'kPa',
			system: 'metric',
			numerator: 1000,
			denominator: 1,
			offset: 0,
			note: '1 千帕 = 1000 帕 ≈ 0.01 个大气压，胎压表与气压罐常用'
		}),
		new MeasureUnit({
			id: 'mpa',
			label: '兆帕',
			symbol: 'MPa',
			system: 'metric',
			numerator: 1000000,
			denominator: 1,
			offset: 0,
			note: '1 兆帕 = 1000 千帕 ≈ 10 个大气压，混凝土强度与液压系统常用'
		}),
		new MeasureUnit({
			id: 'bar',
			label: '巴',
			symbol: 'bar',
			system: 'metric',
			numerator: 100000,
			denominator: 1,
			offset: 0,
			note: '1 巴 = 100 千帕 ≈ 0.987 个大气压，轮胎与潜水气瓶常用'
		}),
		new MeasureUnit({
			id: 'torr',
			label: '托',
			symbol: 'torr',
			system: 'metric',
			numerator: 101325,
			denominator: 760,
			offset: 0,
			note: '1 托 = 1 毫米汞柱 = 101325/760 帕 ≈ 133.32 帕，血压与真空常用'
		}),
		new MeasureUnit({
			id: 'psi',
			label: '磅力/平方英寸',
			symbol: 'psi',
			system: 'imperial',
			numerator: 44482216152605,
			denominator: 6451600000,
			offset: 0,
			note: '1 psi ≈ 6.895 千帕 ≈ 0.0689 巴，英美胎压与液压常用'
		}),
	],
	samples: [
		new MeasureSample({ label: '标准大气压', value: 101.325, unitId: 'kpa' }),
		new MeasureSample({ label: '高原 5000 米', value: 54, unitId: 'kpa' }),
		new MeasureSample({ label: '汽车胎压', value: 2.4, unitId: 'bar' }),
		new MeasureSample({ label: '潜水 10 米', value: 2, unitId: 'bar' }),
		new MeasureSample({ label: '收缩压 120 毫米汞柱', value: 120, unitId: 'torr' }),
		new MeasureSample({ label: '吸尘器吸力', value: 20, unitId: 'kpa' }),
		new MeasureSample({ label: 'C30 混凝土强度', value: 30, unitId: 'mpa' }),
		new MeasureSample({ label: '美式胎压 32 psi', value: 32, unitId: 'psi' }),
	]
})

// 速度换算：以米/秒为基准，共 11 个单位、12 个参照物
export const speedCatalog: MeasureCatalog = new MeasureCatalog({
	id: 'speed',
	name: '速度',
	baseName: '米/秒',
	defaultUnitId: 'kmh',
	systems: ['metric', 'imperial', 'chinese'],
	groupedBySystem: true,
	units: [
		new MeasureUnit({
			id: 'kmh',
			label: '千米/小时',
			symbol: 'km/h',
			system: 'metric',
			numerator: 5,
			denominator: 18,
			offset: 0,
			note: '1 千米/小时 = 5/18 米/秒 ≈ 0.278 米/秒，车速表常用'
		}),
		new MeasureUnit({
			id: 'ms',
			label: '米/秒',
			symbol: 'm/s',
			system: 'metric',
			numerator: 1,
			denominator: 1,
			offset: 0,
			note: '国际单位制的速度单位'
		}),
		new MeasureUnit({
			id: 'kms',
			label: '千米/秒',
			symbol: 'km/s',
			system: 'metric',
			numerator: 1000,
			denominator: 1,
			offset: 0,
			note: '1 千米/秒 = 3600 千米/小时，航天器与天体常用'
		}),
		new MeasureUnit({
			id: 'kn',
			label: '节',
			symbol: 'kn',
			system: 'metric',
			numerator: 463,
			denominator: 900,
			offset: 0,
			note: '1 节 = 1 海里/小时 = 1852/3600 米/秒 ≈ 1.852 千米/小时'
		}),
		new MeasureUnit({
			id: 'mach',
			label: '马赫',
			symbol: 'Ma',
			system: 'metric',
			numerator: 3403,
			denominator: 10,
			offset: 0,
			note: '按 15 °C 海平面声速 340.3 米/秒计，随温度变化'
		}),
		new MeasureUnit({
			id: 'mph',
			label: '英里/小时',
			symbol: 'mph',
			system: 'imperial',
			numerator: 2794,
			denominator: 6250,
			offset: 0,
			note: '1 英里/小时 = 0.44704 米/秒 ≈ 1.609 千米/小时'
		}),
		new MeasureUnit({
			id: 'fts',
			label: '英尺/秒',
			symbol: 'ft/s',
			system: 'imperial',
			numerator: 381,
			denominator: 1250,
			offset: 0,
			note: '1 英尺/秒 = 0.3048 米/秒'
		}),
		new MeasureUnit({
			id: 'miin',
			label: '英里/分',
			symbol: 'mi/min',
			system: 'imperial',
			numerator: 268224,
			denominator: 10000,
			offset: 0,
			note: '1 英里/分 = 60 英里/小时 ≈ 26.82 米/秒'
		}),
		new MeasureUnit({
			id: 'lishi',
			label: '里/小时',
			symbol: '里/时',
			system: 'chinese',
			numerator: 5,
			denominator: 36,
			offset: 0,
			note: '1 里/小时 = 500/3600 米/秒 ≈ 0.139 米/秒'
		}),
		new MeasureUnit({
			id: 'zhangs',
			label: '丈/秒',
			symbol: '丈/s',
			system: 'chinese',
			numerator: 10,
			denominator: 3,
			offset: 0,
			note: '1 丈/秒 = 10/3 米/秒 ≈ 3.33 米/秒'
		}),
		new MeasureUnit({
			id: 'chis',
			label: '尺/秒',
			symbol: '尺/s',
			system: 'chinese',
			numerator: 1,
			denominator: 3,
			offset: 0,
			note: '1 尺/秒 = 1/3 米/秒 ≈ 0.333 米/秒'
		}),
	],
	samples: [
		new MeasureSample({ label: '散步', value: 4, unitId: 'kmh' }),
		new MeasureSample({ label: '城市骑行', value: 18, unitId: 'kmh' }),
		new MeasureSample({ label: '城市限速', value: 60, unitId: 'kmh' }),
		new MeasureSample({ label: '高速限速', value: 120, unitId: 'kmh' }),
		new MeasureSample({ label: '高铁', value: 350, unitId: 'kmh' }),
		new MeasureSample({ label: '客机巡航', value: 901, unitId: 'kmh' }),
		new MeasureSample({ label: '声速', value: 1, unitId: 'mach' }),
		new MeasureSample({ label: '步枪子弹', value: 900, unitId: 'ms' }),
		new MeasureSample({ label: '第一宇宙速度', value: 7.9, unitId: 'kms' }),
		new MeasureSample({ label: '光速', value: 299792.458, unitId: 'kms' }),
		new MeasureSample({ label: '一英里每小时', value: 1, unitId: 'mph' }),
		new MeasureSample({ label: '一节船速', value: 1, unitId: 'kn' }),
	]
})

// 全部换算工具，顺序即应用商店里的展示顺序
export const CONVERT_CATALOGS: MeasureCatalog[] = [
	lengthCatalog,
	areaCatalog,
	volumeCatalog,
	weightCatalog,
	temperatureCatalog,
	energyCatalog,
	pressureCatalog,
	speedCatalog,
]

// 按 id 查找单位表，找不到返回 null
export function catalogById(id: string): MeasureCatalog | null {
	for (let i = 0; i < CONVERT_CATALOGS.length; i++) {
		if (CONVERT_CATALOGS[i].id == id) {
			return CONVERT_CATALOGS[i]
		}
	}
	return null
}

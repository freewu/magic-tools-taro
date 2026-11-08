// 二维码编码（字节模式）
// - 算法支持版本 1–40（ISO/IEC 18004），按内容长度自动选最小版本；页面渲染默认封顶到版本 15
// - Reed-Solomon 纠错（L / M / Q / H 四档），自动评估 8 种掩码取最优
// - 输出为黑块行段（同色连续模块合并），渲染时用绝对定位色块拼接，无需 canvas
// - 全程使用算术运算与查表，不依赖位运算符，保证各端 UTS 编译结果一致
// 参考实现：Kazuhiko Arase 的 qrcode（MIT），本文件已与官方矩阵逐模块比对通过

export type QrRun = {
	x: number
	y: number
	w: number
}

export type QrEcLevel = {
	label: string
	hint: string
	bit: number
	col: number
}

export type QrBuild = {
	ok: boolean
	message: string
	version: number
	size: number
	// 含静区（quiet zone）后的总模块数，用于计算渲染尺寸
	modulesTotal: number
	bytes: number
	mask: number
	quiet: number
	runs: QrRun[]
}

type Matrix = {
	size: number
	data: number[]
	reserved: number[]
}

// 静区宽度（模块）
export const QR_QUIET_ZONE: number = 4
// 页面渲染的最大版本（模块越多单块越小、视图越多），版本 15 对应 77×77 模块
export const QR_MAX_VERSION: number = 15

export const QR_EC_LEVELS: QrEcLevel[] = [
	{ label: 'L', hint: '7%', bit: 1, col: 0 },
	{ label: 'M', hint: '15%', bit: 0, col: 1 },
	{ label: 'Q', hint: '25%', bit: 3, col: 2 },
	{ label: 'H', hint: '30%', bit: 2, col: 3 }
]

// 2 的幂（0–23 次）
const POW2: number[] = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768,
	65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608]

// 各版本码字总数（数据 + 纠错）
const CODEWORDS_COUNT: number[] = [0,
	26, 44, 70, 100, 134, 172, 196, 242, 292, 346,
	404, 466, 532, 581, 655, 733, 815, 901, 991, 1085,
	1156, 1258, 1364, 1474, 1588, 1706, 1828, 1921, 2051, 2185,
	2323, 2465, 2611, 2761, 2876, 3034, 3196, 3362, 3532, 3706]

// 各版本纠错块数量，按 版本 × [L, M, Q, H] 展开
const EC_BLOCKS_TABLE: number[] = [
	1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 2, 2, 4, 1, 2, 4, 4,
	2, 4, 4, 4, 2, 4, 6, 5, 2, 4, 6, 6, 2, 5, 8, 8, 4, 5, 8, 8,
	4, 5, 8, 11, 4, 8, 10, 11, 4, 9, 12, 16, 4, 9, 16, 16, 6, 10, 12, 18,
	6, 10, 17, 16, 6, 11, 16, 19, 6, 13, 18, 21, 7, 14, 21, 25, 8, 16, 20, 25,
	8, 17, 23, 25, 9, 17, 23, 34, 9, 18, 25, 30, 10, 20, 27, 32, 12, 21, 29, 35,
	12, 23, 34, 37, 12, 25, 34, 40, 13, 26, 35, 42, 14, 28, 38, 45, 15, 29, 40, 48,
	16, 31, 43, 51, 17, 33, 45, 54, 18, 35, 48, 57, 19, 37, 51, 60, 19, 38, 53, 63,
	20, 40, 56, 66, 21, 43, 59, 70, 22, 45, 62, 74, 24, 47, 65, 77, 25, 49, 68, 81]

// 各版本纠错码字总数，按 版本 × [L, M, Q, H] 展开
const EC_CODEWORDS_TABLE: number[] = [
	7, 10, 13, 17, 10, 16, 22, 28, 15, 26, 36, 44, 20, 36, 52, 64, 26, 48, 72, 88,
	36, 64, 96, 112, 40, 72, 108, 130, 48, 88, 132, 156, 60, 110, 160, 192, 72, 130, 192, 224,
	80, 150, 224, 264, 96, 176, 260, 308, 104, 198, 288, 352, 120, 216, 320, 384, 132, 240, 360, 432,
	144, 280, 408, 480, 168, 308, 448, 532, 180, 338, 504, 588, 196, 364, 546, 650, 224, 416, 600, 700,
	224, 442, 644, 750, 252, 476, 690, 816, 270, 504, 750, 900, 300, 560, 810, 960, 312, 588, 870, 1050,
	336, 644, 952, 1110, 360, 700, 1020, 1200, 390, 728, 1050, 1260, 420, 784, 1140, 1350, 450, 812, 1200, 1440,
	480, 868, 1290, 1530, 510, 924, 1350, 1620, 540, 980, 1440, 1710, 570, 1036, 1530, 1800, 570, 1064, 1590, 1890,
	600, 1120, 1680, 1980, 630, 1204, 1770, 2100, 660, 1260, 1860, 2220, 720, 1316, 1950, 2310, 750, 1372, 2040, 2430]

const G15: number = 1335
const G15_MASK: number = 21522
const G18: number = 7973

const MASK_N3_PATTERN_A: number = 0x5D0
const MASK_N3_PATTERN_B: number = 0x05D

// ---------------- 基础工具 ----------------

function bitOf(value: number, index: number): number {
	return Math.floor(value / POW2[index]) % 2
}

function bitLength(value: number): number {
	let bits = 0
	let p = 1
	while (p <= value) {
		bits++
		p = p * 2
	}
	return bits
}

// 按位异或（不使用位运算符）
function xorValue(a: number, b: number): number {
	let bits = bitLength(a)
	const bBits = bitLength(b)
	if (bBits > bits) {
		bits = bBits
	}
	let out = 0
	let p = 1
	for (let i = 0; i < bits; i++) {
		const ba = Math.floor(a / p) % 2
		const bb = Math.floor(b / p) % 2
		if (ba != bb) {
			out = out + p
		}
		p = p * 2
	}
	return out
}

function getBCHDigit(value: number): number {
	let digit = 0
	let v = value
	while (v != 0) {
		digit++
		v = Math.floor(v / 2)
	}
	return digit
}

function symbolTotalCodewords(version: number): number {
	return CODEWORDS_COUNT[version]
}

function ecBlocks(version: number, ecCol: number): number {
	return EC_BLOCKS_TABLE[(version - 1) * 4 + ecCol]
}

function ecCodewords(version: number, ecCol: number): number {
	return EC_CODEWORDS_TABLE[(version - 1) * 4 + ecCol]
}

function dataCodewordsCount(version: number, ecCol: number): number {
	return symbolTotalCodewords(version) - ecCodewords(version, ecCol)
}

function charCountBits(version: number): number {
	return version < 10 ? 8 : 16
}

function dataCapacityBits(version: number, ecCol: number): number {
	return dataCodewordsCount(version, ecCol) * 8
}

// 指定版本与纠错级别下，字节模式可容纳的最大字节数
export function qrMaxBytes(version: number, ecCol: number): number {
	if (version < 1 || version > 40) {
		return 0
	}
	return Math.floor((dataCapacityBits(version, ecCol) - 4 - charCountBits(version)) / 8)
}

// 文本转 UTF-8 字节（含代理对处理）
export function qrUtf8Bytes(text: string): number[] {
	const out: number[] = []
	let i = 0
	while (i < text.length) {
		let code: number = text.charCodeAt(i) ?? 0
		if (code >= 0xD800 && code <= 0xDBFF && i + 1 < text.length) {
			const low: number = text.charCodeAt(i + 1) ?? 0
			if (low >= 0xDC00 && low <= 0xDFFF) {
				code = 0x10000 + (code - 0xD800) * 0x400 + (low - 0xDC00)
				i++
			}
		}
		if (code < 0x80) {
			out.push(code)
		} else if (code < 0x800) {
			out.push(0xC0 + Math.floor(code / 0x40))
			out.push(0x80 + (code % 0x40))
		} else if (code < 0x10000) {
			out.push(0xE0 + Math.floor(code / 0x1000))
			out.push(0x80 + (Math.floor(code / 0x40) % 0x40))
			out.push(0x80 + (code % 0x40))
		} else {
			out.push(0xF0 + Math.floor(code / 0x40000))
			out.push(0x80 + (Math.floor(code / 0x1000) % 0x40))
			out.push(0x80 + (Math.floor(code / 0x40) % 0x40))
			out.push(0x80 + (code % 0x40))
		}
		i++
	}
	return out
}

// 位写入：buf 为字节数组，返回写入后的总位数
function putBits(buf: number[], length: number, num: number, bitLen: number): number {
	let len = length
	for (let i = 0; i < bitLen; i++) {
		const bit = bitOf(num, bitLen - 1 - i)
		const index = Math.floor(len / 8)
		if (buf.length <= index) {
			buf.push(0)
		}
		if (bit == 1) {
			buf[index] = buf[index] + POW2[7 - (len % 8)]
		}
		len++
	}
	return len
}

// ---------------- Reed-Solomon ----------------

// GF(256) 乘法（本原多项式 0x11D）
function gfMul(a: number, b: number): number {
	let x = a
	let y = b
	let out = 0
	for (let i = 0; i < 8; i++) {
		if (y % 2 == 1) {
			out = xorValue(out, x)
		}
		y = Math.floor(y / 2)
		x = x * 2
		if (x >= 256) {
			x = xorValue(x, 0x11D)
		}
	}
	return out
}

// 生成 degree 阶生成多项式系数（省略最高项 1）
function ecGenerator(degree: number): number[] {
	const poly: number[] = []
	for (let i = 0; i < degree; i++) {
		poly.push(0)
	}
	poly[degree - 1] = 1
	let root = 1
	for (let i = 0; i < degree; i++) {
		for (let j = 0; j < degree; j++) {
			poly[j] = gfMul(poly[j], root)
			if (j + 1 < degree) {
				poly[j] = xorValue(poly[j], poly[j + 1])
			}
		}
		root = gfMul(root, 2)
	}
	return poly
}

// 计算 degree 个纠错码字
function rsEncode(data: number[], degree: number): number[] {
	const gen = ecGenerator(degree)
	const res: number[] = []
	for (let i = 0; i < degree; i++) {
		res.push(0)
	}
	for (let i = 0; i < data.length; i++) {
		const factor = xorValue(data[i], res[0])
		for (let j = 0; j < degree - 1; j++) {
			res[j] = res[j + 1]
		}
		res[degree - 1] = 0
		for (let j = 0; j < degree; j++) {
			res[j] = xorValue(res[j], gfMul(gen[j], factor))
		}
	}
	return res
}

// ---------------- 码字组装 ----------------

function bestVersion(byteLen: number, ecCol: number, maxVersion: number): number {
	for (let v = 1; v <= maxVersion; v++) {
		const usable = dataCapacityBits(v, ecCol) - 4 - charCountBits(v)
		if (byteLen * 8 <= usable) {
			return v
		}
	}
	return 0
}

function createDataCodewords(bytes: number[], version: number, ecCol: number): number[] {
	const buf: number[] = []
	// 模式指示符：0100（字节模式，4 位）
	let length = putBits(buf, 0, 4, 4)
	// 字符计数
	length = putBits(buf, length, bytes.length, charCountBits(version))
	for (let i = 0; i < bytes.length; i++) {
		length = putBits(buf, length, bytes[i], 8)
	}
	const capacity = dataCapacityBits(version, ecCol)
	// 终止符最多 4 位
	if (length + 4 <= capacity) {
		length = putBits(buf, length, 0, 4)
	}
	while (length % 8 != 0) {
		length = putBits(buf, length, 0, 1)
	}
	// 填充码字 0xEC / 0x11 交替
	const remaining = Math.floor((capacity - length) / 8)
	for (let i = 0; i < remaining; i++) {
		length = putBits(buf, length, i % 2 == 0 ? 0xEC : 0x11, 8)
	}
	return buf
}

function createCodewords(dataBytes: number[], version: number, ecCol: number): number[] {
	const totalCodewords = symbolTotalCodewords(version)
	const totalEc = ecCodewords(version, ecCol)
	const totalData = totalCodewords - totalEc
	const blocks = ecBlocks(version, ecCol)
	const blocksInGroup2 = totalCodewords % blocks
	const blocksInGroup1 = blocks - blocksInGroup2
	const totalCodewordsInGroup1 = Math.floor(totalCodewords / blocks)
	const dataCodewordsInGroup1 = Math.floor(totalData / blocks)
	const dataCodewordsInGroup2 = dataCodewordsInGroup1 + 1
	const ecCount = totalCodewordsInGroup1 - dataCodewordsInGroup1

	const dcData: number[][] = []
	const ecData: number[][] = []
	let maxDataSize = 0
	let offset = 0
	for (let b = 0; b < blocks; b++) {
		const dataSize = b < blocksInGroup1 ? dataCodewordsInGroup1 : dataCodewordsInGroup2
		const block: number[] = []
		for (let i = 0; i < dataSize; i++) {
			block.push(dataBytes[offset + i])
		}
		dcData.push(block)
		ecData.push(rsEncode(block, ecCount))
		offset = offset + dataSize
		if (dataSize > maxDataSize) {
			maxDataSize = dataSize
		}
	}

	// 按块交错排列
	const out: number[] = []
	for (let i = 0; i < maxDataSize; i++) {
		for (let r = 0; r < blocks; r++) {
			if (i < dcData[r].length) {
				out.push(dcData[r][i])
			}
		}
	}
	for (let i = 0; i < ecCount; i++) {
		for (let r = 0; r < blocks; r++) {
			out.push(ecData[r][i])
		}
	}
	return out
}

// ---------------- 矩阵构建 ----------------

function newMatrix(size: number): Matrix {
	const data: number[] = []
	const reserved: number[] = []
	for (let i = 0; i < size * size; i++) {
		data.push(0)
		reserved.push(0)
	}
	const m: Matrix = { size: size, data: data, reserved: reserved }
	return m
}

function setModule(m: Matrix, row: number, col: number, value: boolean, reserve: boolean) {
	const index = row * m.size + col
	m.data[index] = value ? 1 : 0
	if (reserve) {
		m.reserved[index] = 1
	}
}

function getModule(m: Matrix, row: number, col: number): number {
	return m.data[row * m.size + col]
}

function isReserved(m: Matrix, row: number, col: number): boolean {
	return m.reserved[row * m.size + col] == 1
}

function xorModule(m: Matrix, row: number, col: number, value: boolean) {
	const index = row * m.size + col
	const cur = m.data[index]
	const v = value ? 1 : 0
	m.data[index] = cur == v ? 0 : 1
}

function setupFinderPattern(m: Matrix) {
	const size = m.size
	const rows: number[] = [0, size - 7, 0]
	const cols: number[] = [0, 0, size - 7]
	for (let i = 0; i < 3; i++) {
		const row0 = rows[i]
		const col0 = cols[i]
		for (let r = -1; r <= 7; r++) {
			if (row0 + r <= -1 || size <= row0 + r) {
				continue
			}
			for (let c = -1; c <= 7; c++) {
				if (col0 + c <= -1 || size <= col0 + c) {
					continue
				}
				const dark = (r >= 0 && r <= 6 && (c == 0 || c == 6)) ||
					(c >= 0 && c <= 6 && (r == 0 || r == 6)) ||
					(r >= 2 && r <= 4 && c >= 2 && c <= 4)
				setModule(m, row0 + r, col0 + c, dark, true)
			}
		}
	}
}

function setupTimingPattern(m: Matrix) {
	const size = m.size
	for (let r = 8; r < size - 8; r++) {
		const value = r % 2 == 0
		setModule(m, r, 6, value, true)
		setModule(m, 6, r, value, true)
	}
}

// 对齐图案中心坐标（升序）
function alignmentCoords(version: number): number[] {
	if (version == 1) {
		return []
	}
	const posCount = Math.floor(version / 7) + 2
	const size = version * 4 + 17
	const intervals = size == 145 ? 26 : Math.ceil((size - 13) / (2 * posCount - 2)) * 2
	const desc: number[] = [size - 7]
	for (let i = 1; i < posCount - 1; i++) {
		desc.push(desc[i - 1] - intervals)
	}
	desc.push(6)
	const out: number[] = []
	for (let i = desc.length - 1; i >= 0; i--) {
		out.push(desc[i])
	}
	return out
}

function setupAlignmentPattern(m: Matrix, version: number) {
	const pos = alignmentCoords(version)
	const n = pos.length
	for (let i = 0; i < n; i++) {
		for (let j = 0; j < n; j++) {
			// 与三个定位图案重叠的位置跳过
			if ((i == 0 && j == 0) || (i == 0 && j == n - 1) || (i == n - 1 && j == 0)) {
				continue
			}
			const row0 = pos[i]
			const col0 = pos[j]
			for (let r = -2; r <= 2; r++) {
				for (let c = -2; c <= 2; c++) {
					const dark = (r == -2 || r == 2 || c == -2 || c == 2 || (r == 0 && c == 0))
					setModule(m, row0 + r, col0 + c, dark, true)
				}
			}
		}
	}
}

// 格式信息（15 位 BCH）
function formatEncodedBits(ecBit: number, mask: number): number {
	const data = ecBit * 8 + mask
	let d = data * 1024
	let shift = getBCHDigit(d) - getBCHDigit(G15)
	while (shift >= 0) {
		d = xorValue(d, G15 * POW2[shift])
		shift = getBCHDigit(d) - getBCHDigit(G15)
	}
	return xorValue(data * 1024 + d, G15_MASK)
}

// 版本信息（18 位 Golay），版本 ≥ 7 时使用
function versionEncodedBits(version: number): number {
	let d = version * 4096
	let shift = getBCHDigit(d) - getBCHDigit(G18)
	while (shift >= 0) {
		d = xorValue(d, G18 * POW2[shift])
		shift = getBCHDigit(d) - getBCHDigit(G18)
	}
	return version * 4096 + d
}

function setupFormatInfo(m: Matrix, ecBit: number, mask: number) {
	const size = m.size
	const bits = formatEncodedBits(ecBit, mask)
	for (let i = 0; i < 15; i++) {
		const dark = bitOf(bits, i) == 1
		// 左上竖排
		if (i < 6) {
			setModule(m, i, 8, dark, true)
		} else if (i < 8) {
			setModule(m, i + 1, 8, dark, true)
		} else {
			setModule(m, size - 15 + i, 8, dark, true)
		}
		// 左上横排 / 右上 / 左下
		if (i < 8) {
			setModule(m, 8, size - i - 1, dark, true)
		} else if (i < 9) {
			setModule(m, 8, 15 - i, dark, true)
		} else {
			setModule(m, 8, 15 - i - 1, dark, true)
		}
	}
	// 固定的深色模块
	setModule(m, size - 8, 8, true, true)
}

function setupVersionInfo(m: Matrix, version: number) {
	const size = m.size
	const bits = versionEncodedBits(version)
	for (let i = 0; i < 18; i++) {
		const row = Math.floor(i / 3)
		const col = (i % 3) + size - 8 - 3
		const dark = bitOf(bits, i) == 1
		setModule(m, row, col, dark, true)
		setModule(m, col, row, dark, true)
	}
}

function setupData(m: Matrix, codewords: number[]) {
	const size = m.size
	let inc = -1
	let row = size - 1
	let bitIndex = 7
	let byteIndex = 0
	let col = size - 1
	while (col > 0) {
		if (col == 6) {
			col--
		}
		while (true) {
			for (let c = 0; c < 2; c++) {
				if (!isReserved(m, row, col - c)) {
					let dark = false
					if (byteIndex < codewords.length) {
						dark = bitOf(codewords[byteIndex], bitIndex) == 1
					}
					setModule(m, row, col - c, dark, false)
					bitIndex--
					if (bitIndex == -1) {
						byteIndex++
						bitIndex = 7
					}
				}
			}
			row = row + inc
			if (row < 0 || size <= row) {
				row = row - inc
				inc = -inc
				break
			}
		}
		col = col - 2
	}
}

function maskAt(pattern: number, i: number, j: number): boolean {
	if (pattern == 0) {
		return (i + j) % 2 == 0
	}
	if (pattern == 1) {
		return i % 2 == 0
	}
	if (pattern == 2) {
		return j % 3 == 0
	}
	if (pattern == 3) {
		return (i + j) % 3 == 0
	}
	if (pattern == 4) {
		return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0
	}
	if (pattern == 5) {
		return ((i * j) % 2) + ((i * j) % 3) == 0
	}
	if (pattern == 6) {
		return (((i * j) % 2) + ((i * j) % 3)) % 2 == 0
	}
	return (((i * j) % 3) + ((i + j) % 2)) % 2 == 0
}

function applyMask(pattern: number, m: Matrix) {
	const size = m.size
	for (let col = 0; col < size; col++) {
		for (let row = 0; row < size; row++) {
			if (isReserved(m, row, col)) {
				continue
			}
			xorModule(m, row, col, maskAt(pattern, row, col))
		}
	}
}

function penaltyN1(m: Matrix): number {
	const size = m.size
	let points = 0
	for (let row = 0; row < size; row++) {
		let sameCountCol = 0
		let sameCountRow = 0
		let lastCol = -1
		let lastRow = -1
		for (let col = 0; col < size; col++) {
			let cell = getModule(m, row, col)
			if (cell == lastCol) {
				sameCountCol++
			} else {
				if (sameCountCol >= 5) {
					points = points + 3 + (sameCountCol - 5)
				}
				lastCol = cell
				sameCountCol = 1
			}
			cell = getModule(m, col, row)
			if (cell == lastRow) {
				sameCountRow++
			} else {
				if (sameCountRow >= 5) {
					points = points + 3 + (sameCountRow - 5)
				}
				lastRow = cell
				sameCountRow = 1
			}
		}
		if (sameCountCol >= 5) {
			points = points + 3 + (sameCountCol - 5)
		}
		if (sameCountRow >= 5) {
			points = points + 3 + (sameCountRow - 5)
		}
	}
	return points
}

function penaltyN2(m: Matrix): number {
	const size = m.size
	let points = 0
	for (let row = 0; row < size - 1; row++) {
		for (let col = 0; col < size - 1; col++) {
			const sum = getModule(m, row, col) + getModule(m, row, col + 1) +
				getModule(m, row + 1, col) + getModule(m, row + 1, col + 1)
			if (sum == 4 || sum == 0) {
				points++
			}
		}
	}
	return points * 3
}

function penaltyN3(m: Matrix): number {
	const size = m.size
	let points = 0
	for (let row = 0; row < size; row++) {
		let bitsCol = 0
		let bitsRow = 0
		for (let col = 0; col < size; col++) {
			bitsCol = ((bitsCol * 2) % 2048) + getModule(m, row, col)
			if (col >= 10 && (bitsCol == MASK_N3_PATTERN_A || bitsCol == MASK_N3_PATTERN_B)) {
				points++
			}
			bitsRow = ((bitsRow * 2) % 2048) + getModule(m, col, row)
			if (col >= 10 && (bitsRow == MASK_N3_PATTERN_A || bitsRow == MASK_N3_PATTERN_B)) {
				points++
			}
		}
	}
	return points * 40
}

function penaltyN4(m: Matrix): number {
	let darkCount = 0
	const total = m.data.length
	for (let i = 0; i < total; i++) {
		darkCount = darkCount + m.data[i]
	}
	const k = Math.abs(Math.ceil((darkCount * 100 / total) / 5) - 10)
	return k * 10
}

function bestMask(m: Matrix, ecBit: number): number {
	let bestPattern = 0
	let lowerPenalty = -1
	for (let p = 0; p < 8; p++) {
		setupFormatInfo(m, ecBit, p)
		applyMask(p, m)
		const penalty = penaltyN1(m) + penaltyN2(m) + penaltyN3(m) + penaltyN4(m)
		// 撤销掩码，回到原始数据
		applyMask(p, m)
		if (lowerPenalty < 0 || penalty < lowerPenalty) {
			lowerPenalty = penalty
			bestPattern = p
		}
	}
	return bestPattern
}

// 把矩阵转换成「连续黑块」列表（含静区偏移），便于用少量视图渲染
function buildRuns(m: Matrix, quiet: number): QrRun[] {
	const runs: QrRun[] = []
	const size = m.size
	for (let row = 0; row < size; row++) {
		let col = 0
		while (col < size) {
			if (m.data[row * size + col] == 0) {
				col++
				continue
			}
			const start = col
			while (col < size && m.data[row * size + col] == 1) {
				col++
			}
			runs.push({ x: start + quiet, y: row + quiet, w: col - start })
		}
	}
	return runs
}

// ---------------- 对外入口 ----------------

export function buildQr(text: string, ecIndex: number, maxVersion: number): QrBuild {
	const ecCol = ecIndex < 0 || ecIndex >= QR_EC_LEVELS.length ? 1 : ecIndex
	const ecBit = QR_EC_LEVELS[ecCol].bit
	const bytes = qrUtf8Bytes(text)
	const version = bestVersion(bytes.length, ecCol, maxVersion)
	if (version == 0) {
		return {
			ok: false,
			message: '内容过长，当前最多 ' + qrMaxBytes(maxVersion, ecCol) + ' 字节',
			version: 0,
			size: 0,
			modulesTotal: 0,
			bytes: bytes.length,
			mask: 0,
			quiet: QR_QUIET_ZONE,
			runs: []
		}
	}
	const dataBytes = createDataCodewords(bytes, version, ecCol)
	const codewords = createCodewords(dataBytes, version, ecCol)
	const size = version * 4 + 17
	const m = newMatrix(size)
	setupFinderPattern(m)
	setupTimingPattern(m)
	setupAlignmentPattern(m, version)
	setupFormatInfo(m, ecBit, 0)
	if (version >= 7) {
		setupVersionInfo(m, version)
	}
	setupData(m, codewords)
	const mask = bestMask(m, ecBit)
	applyMask(mask, m)
	setupFormatInfo(m, ecBit, mask)
	return {
		ok: true,
		message: '',
		version: version,
		size: size,
		modulesTotal: size + QR_QUIET_ZONE * 2,
		bytes: bytes.length,
		mask: mask,
		quiet: QR_QUIET_ZONE,
		runs: buildRuns(m, QR_QUIET_ZONE)
	}
}

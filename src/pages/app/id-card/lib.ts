// 居民身份证号码解析（18 位，GB 11643 校验）

export type IdCardResult = {
  valid: boolean
  checksumOk: boolean
  province: string
  birthYear: number
  birthMonth: number
  birthDay: number
  gender: string
  age: number
  /** 前 6 位行政区划代码 */
  regionRaw: string
  message: string
}

export const PROVINCES: string[] = [
  '11 北京',
  '12 天津',
  '13 河北',
  '14 山西',
  '15 内蒙古',
  '21 辽宁',
  '22 吉林',
  '23 黑龙江',
  '31 上海',
  '32 江苏',
  '33 浙江',
  '34 安徽',
  '35 福建',
  '36 江西',
  '37 山东',
  '41 河南',
  '42 湖北',
  '43 湖南',
  '44 广东',
  '45 广西',
  '46 海南',
  '50 重庆',
  '51 四川',
  '52 贵州',
  '53 云南',
  '54 西藏',
  '61 陕西',
  '62 甘肃',
  '63 青海',
  '64 宁夏',
  '65 新疆',
  '71 台湾',
  '81 香港',
  '82 澳门'
]

const WEIGHTS: number[] = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
const CHECK_CHARS = '10X98765432'

function provinceOf(regionCode: string): string {
  const two = regionCode.substring(0, 2)
  for (let i = 0; i < PROVINCES.length; i++) {
    const parts = PROVINCES[i].split(' ')
    if (parts[0] === two) {
      return parts[1]
    }
  }
  return '未知/境外'
}

/** 周岁（按今日是否已过生日） */
export function calcAge(y: number, m: number, d: number, ty: number, tm: number, td: number): number {
  let age = ty - y
  if (tm < m || (tm === m && td < d)) {
    age--
  }
  return age
}

function invalid(message: string): IdCardResult {
  return {
    valid: false,
    checksumOk: false,
    province: '',
    birthYear: 0,
    birthMonth: 0,
    birthDay: 0,
    gender: '',
    age: 0,
    regionRaw: '',
    message
  }
}

export function parseIdCard(id: string, ty: number, tm: number, td: number): IdCardResult {
  const raw = id.trim()
  if (raw.length !== 18) {
    return invalid(`需为 18 位身份证号（当前 ${raw.length} 位）`)
  }

  let sum = 0
  for (let i = 0; i < 17; i++) {
    const ch = raw.charCodeAt(i)
    if (ch < 48 || ch > 57) {
      return invalid('前 17 位必须为数字')
    }
    sum += (ch - 48) * WEIGHTS[i]
  }

  const checkChar = raw.charAt(17).toUpperCase()
  const expectChar = CHECK_CHARS.charAt(sum % 11)
  const checksumOk = checkChar === expectChar

  const regionRaw = raw.substring(0, 6)
  const birthYear = parseInt(raw.substring(6, 10))
  const birthMonth = parseInt(raw.substring(10, 12))
  const birthDay = parseInt(raw.substring(12, 14))
  const seq = parseInt(raw.substring(14, 17))
  const gender = seq % 2 === 1 ? '男' : '女'
  const province = provinceOf(regionRaw)

  // 出生日期合理性粗检
  const dateOk = birthMonth >= 1 && birthMonth <= 12 && birthDay >= 1 && birthDay <= 31
  const age = dateOk ? calcAge(birthYear, birthMonth, birthDay, ty, tm, td) : 0

  let message = ''
  if (!checksumOk) {
    message = `校验位不符（应为 ${expectChar}），号码可能录错`
  } else if (!dateOk) {
    message = '出生日期部分不合常规'
  }

  return {
    valid: checksumOk,
    checksumOk,
    province,
    birthYear,
    birthMonth,
    birthDay,
    gender,
    age,
    regionRaw,
    message
  }
}

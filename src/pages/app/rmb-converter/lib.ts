// 人民币数字转大写金额

/** 汉字的数字 */
const cnNums: string[] = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
/** 基本单位 */
const cnIntRadice: string[] = ['', '拾', '佰', '仟']
/** 整数部分扩展单位 */
const cnIntUnits: string[] = ['', '万', '亿', '兆']
/** 小数部分单位 */
const cnDecUnits: string[] = ['角', '分', '毫', '厘']
/** 整数金额时后面跟的字符 */
const cnInteger = '整'
/** 整型完以后的单位 */
const cnIntLast = '元'
/** 最大可处理的数字 */
const maxNum = 999999999999999.9999

/**
 * 金额数字转中文大写
 * @param money 金额字符串（支持千分位逗号与空格），超出上限返回空字符串
 */
export function convertCurrency(money: string): string {
  if (money === '') {
    return ''
  }

  const amount = parseFloat(money)
  if (amount >= maxNum) {
    // 超出最大处理数字
    return ''
  }
  if (amount === 0) {
    return cnNums[0] + cnIntLast + cnInteger
  }

  // 分离整数部分与小数部分
  let integerNum = ''
  let decimalNum = ''
  if (money.indexOf('.') === -1) {
    integerNum = money
  } else {
    const parts: string[] = money.split('.')
    integerNum = parts[0]
    decimalNum = parts[1].substring(0, 4)
  }

  // 输出
  let chineseStr = ''

  // 转换整数部分
  if (parseInt(integerNum, 10) > 0) {
    let zeroCount = 0
    const intLen = integerNum.length
    for (let i = 0; i < intLen; i++) {
      const n = integerNum.substring(i, i + 1)
      const p = intLen - i - 1
      const rem = p % 4
      if (n === '0') {
        zeroCount++
      } else {
        if (zeroCount > 0) {
          chineseStr += cnNums[0]
        }
        // 归零
        zeroCount = 0
        chineseStr += cnNums[parseInt(n, 10)] + cnIntRadice[rem]
      }
      if (rem === 0 && zeroCount < 4) {
        chineseStr += cnIntUnits[Math.floor(p / 4)]
      }
    }
    chineseStr += cnIntLast
  }

  // 转换小数部分
  if (decimalNum !== '') {
    const decLen = decimalNum.length
    for (let i = 0; i < decLen; i++) {
      const n = decimalNum.substring(i, i + 1)
      if (n !== '0') {
        chineseStr += cnNums[parseInt(n, 10)] + cnDecUnits[i]
      }
    }
  }

  if (chineseStr === '') {
    chineseStr += cnNums[0] + cnIntLast + cnInteger
  } else if (decimalNum === '') {
    chineseStr += cnInteger
  }
  return chineseStr
}

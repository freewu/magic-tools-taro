// 抽奖转盘逻辑：奖品解析（支持换行 / 顿号 / 逗号分隔）与随机抽取

export const DEFAULT_PRIZES: string[] = [
  '谢谢参与',
  '再来一次',
  '50 积分',
  '100 积分',
  '谢谢参与',
  '蓝牙耳机',
  '谢谢参与',
  '10 积分',
  '神秘大奖'
]

/** 逗号 / 顿号 / 换行分隔，去空白并去重 */
export function parsePrizes(raw: string): string[] {
  const list: string[] = []
  const parts = raw.replace(/[、，,]/g, '\n').split('\n')
  for (let i = 0; i < parts.length; i++) {
    const t = parts[i].trim()
    if (t !== '' && list.indexOf(t) < 0) {
      list.push(t)
    }
  }
  return list
}

export function pickPrize(count: number): number {
  return Math.floor(Math.random() * count)
}

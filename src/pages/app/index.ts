// 应用列表（应用商店网格）

export type AppItem = {
  name: string
  /** 图标（emoji，随列表直接渲染，避免为每个应用单独维护图片资源） */
  icon: string
  /** 页面路径（相对 pages/app） */
  path: string
  /** 页面参数（不含 ?），如 'id=distance'；无参数留空字符串 */
  query: string
}

export const appList: AppItem[] = [
  // 迁移进度：仅登记已迁移的工具页，避免首页出现无法打开的入口。
  { name: '人民币大写', icon: '💴', path: 'rmb-converter/index', query: '' },
  { name: 'BMI 计算', icon: '⚖️', path: 'bmi/index', query: '' },
  { name: '2027 放假', icon: '🗓️', path: 'holiday2027/index', query: '' },
  { name: '模糊昵称', icon: '✨', path: 'fuzzy-nickname/index', query: '' },
  { name: '个税计算', icon: '💼', path: 'income-tax/index', query: '' },
  { name: '房贷计算', icon: '🏠', path: 'mortgage/index', query: '' },
  { name: '复利计算', icon: '📈', path: 'compound-interest/index', query: '' },
  { name: '天干地支', icon: '🀄', path: 'ganzhi/index', query: '' },
  { name: '历史朝代', icon: '🏛️', path: 'dynasties/index', query: '' },
  { name: '安全期', icon: '🌸', path: 'safe-period/index', query: '' },
  { name: '预产期', icon: '🤰', path: 'due-date/index', query: '' },
  { name: '存款利率', icon: '💹', path: 'rate-calc/index', query: '' },
  { name: '退休年龄', icon: '🕰️', path: 'retirement-age/index', query: '' },
  { name: '退休金估算', icon: '🧾', path: 'pension/index', query: '' },
  { name: '血型遗传', icon: '🩸', path: 'blood-type/index', query: '' },
  { name: '车牌归属地', icon: '🚗', path: 'plate-city/index', query: '' },
  { name: '身份证解析', icon: '🪪', path: 'id-card/index', query: '' },
  { name: '世界时间', icon: '🌍', path: 'world-time/index', query: '' }
  // 待迁移：抽奖转盘 /
  //        单位换算 8 件套 / 基础代谢 / 时薪 / 二维码
]

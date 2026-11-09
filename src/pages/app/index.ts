// 应用列表（应用商店网格）

export type AppItem = {
  name: string
  /** 图标（emoji，随列表直接渲染，避免为每个应用单独维护图片资源） */
  icon: string
  /** 简介：搜索结果之外也用来说明这个工具能干什么，搜索时会一起匹配 */
  desc: string
  /** 页面路径（相对 pages/app） */
  path: string
  /** 页面参数（不含 ?），如 'id=distance'；无参数留空字符串 */
  query: string
}

export const appList: AppItem[] = [
  { name: '人民币大写', icon: '💴', desc: '金额转中文大写，报销写支票用', path: 'rmb-converter/index', query: '' },
  { name: 'BMI 计算', icon: '⚖️', desc: '按身高体重算身体质量指数与胖瘦等级', path: 'bmi/index', query: '' },
  { name: '2027 放假', icon: '🗓️', desc: '2027 年节假日与调休安排日历', path: 'holiday2027/index', query: '' },
  { name: '模糊昵称', icon: '✨', desc: '给名字加特殊符号，生成看不出原名的昵称', path: 'fuzzy-nickname/index', query: '' },
  { name: '个税计算', icon: '💼', desc: '工资个税与税后到手收入，含专项扣除', path: 'income-tax/index', query: '' },
  { name: '房贷计算', icon: '🏠', desc: '等额本息 / 等额本金月供、总利息对比', path: 'mortgage/index', query: '' },
  { name: '复利计算', icon: '📈', desc: '本金按复利滚动的收益与增长曲线', path: 'compound-interest/index', query: '' },
  { name: '天干地支', icon: '🀄', desc: '查出生年份的干支与生肖', path: 'ganzhi/index', query: '' },
  { name: '历史朝代', icon: '🏛️', desc: '中国历史朝代起止年份与顺序速查', path: 'dynasties/index', query: '' },
  { name: '安全期', icon: '🌸', desc: '按月经周期推算排卵期、易孕期与安全期', path: 'safe-period/index', query: '' },
  { name: '预产期', icon: '🤰', desc: '按末次月经推算预产期、孕周与星座', path: 'due-date/index', query: '' },
  { name: '存款利率', icon: '💹', desc: '定期存款到期利息与本息合计', path: 'rate-calc/index', query: '' },
  { name: '退休年龄', icon: '🕰️', desc: '渐进式延迟退休后的退休年月', path: 'retirement-age/index', query: '' },
  { name: '退休金估算', icon: '🧾', desc: '基础养老金 + 个人账户，估算每月退休金', path: 'pension/index', query: '' },
  { name: '血型遗传', icon: '🩸', desc: '父母血型推算孩子可能的血型概率', path: 'blood-type/index', query: '' },
  { name: '车牌归属地', icon: '🚗', desc: '车牌号段查省份城市，支持新能源绿牌', path: 'plate-city/index', query: '' },
  { name: '身份证解析', icon: '🪪', desc: '身份证号查省份、生日、性别与校验位', path: 'id-card/index', query: '' },
  { name: '抽奖转盘', icon: '🎰', desc: '自定义奖项的随机转盘，聚会抽奖用', path: 'lucky-wheel/index', query: '' },
  { name: '基础代谢', icon: '🔥', desc: 'BMR 与不同运动量的每日热量消耗', path: 'bmr/index', query: '' },
  { name: '时薪计算', icon: '⏱️', desc: '月薪换算时薪、日薪，可保存历史对比', path: 'hourly/index', query: '' },
  { name: '二维码生成', icon: '🔳', desc: '文本、网址、WiFi 生成二维码（QR），可调纠错等级', path: 'qrcode/index', query: '' },
  { name: '长度换算', icon: '📏', desc: '米、千米、英里、尺、寸等长度单位换算', path: 'convert/index', query: 'id=distance' },
  { name: '面积换算', icon: '📐', desc: '平方米、公顷、亩、平方英尺等面积换算', path: 'convert/index', query: 'id=area' },
  { name: '容量换算', icon: '🥛', desc: '升、毫升、加仑、品脱等容量换算', path: 'convert/index', query: 'id=volume' },
  { name: '重量换算', icon: '🏋️', desc: '千克、克、斤、磅、盎司等重量换算', path: 'convert/index', query: 'id=weight' },
  { name: '温度换算', icon: '🌡️', desc: '摄氏、华氏、开尔文温度互转', path: 'convert/index', query: 'id=temperature' },
  { name: '热量换算', icon: '🔥', desc: '千焦、千卡（大卡、卡路里）与食物热量换算', path: 'convert/index', query: 'id=energy' },
  { name: '压力换算', icon: '⚙️', desc: '帕、千帕、巴、大气压、psi 换算', path: 'convert/index', query: 'id=pressure' },
  { name: '速度换算', icon: '🏎️', desc: '米每秒、千米每小时、英里每小时、节', path: 'convert/index', query: 'id=speed' },
  { name: '世界时间', icon: '🌍', desc: '多城市时区对照，看各地当前时间', path: 'world-time/index', query: '' }
]

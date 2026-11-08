// 关于页面数据：更新日志

export type UpdateLogItem = {
  date: string
  title: string
  content: string[]
}

export const updateLogs: UpdateLogItem[] = [
  {
    date: '2026.11.06',
    title: '新增',
    content: [
      '长度换算',
      '面积换算',
      '容量换算',
      '重量换算',
      '温度换算',
      '热量换算',
      '压力换算',
      '速度换算',
      '基础代谢',
      '时薪计算',
      '二维码生成'
    ]
  },
  {
    date: '2026.09.09',
    title: '新增',
    content: [
      '模糊昵称',
      '个人所得税计算器',
      '房贷计算器',
      '复利计算器',
      '日期天干地支',
      '安全期计算',
      '预产期计算',
      '利率计算',
      '历史朝代',
      '退休年龄',
      '退休金计算',
      '抽奖转盘',
      '血型遗传',
      '车牌城市',
      '身份证号码解析'
    ]
  },
  {
    date: '2023.11.08',
    title: '新增',
    content: ['人民币大写', '世界时钟', 'BMI 计算器']
  },
  {
    date: '',
    title: '重构',
    content: ['升级为 Taro + React 架构', '支持小程序 / H5 / React Native 多端']
  }
]

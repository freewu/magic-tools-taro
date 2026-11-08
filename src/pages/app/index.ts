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
  // 待迁移：人民币大写 / BMI / 2027 放假 / 世界时间 / 模糊昵称 / 个税 / 房贷 / 复利 /
  //        天干地支 / 安全期 / 预产期 / 利率 / 朝代 / 退休年龄 / 退休金 / 抽奖转盘 /
  //        血型 / 车牌 / 身份证 / 单位换算 8 件套 / 基础代谢 / 时薪 / 二维码
]

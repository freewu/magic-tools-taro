// RN 端由 components/page-with-menu 自己管滚动（外层再套一层 ScrollView 会让 flex 高度失效），
// 小程序 / H5 保持系统滚动。
const isRN = process.env.TARO_ENV === 'rn'

export default definePageConfig({
  navigationBarTitleText: '世界时间',
  disableScroll: isRN
})

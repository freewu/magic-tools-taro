/**
 * RN 端专用的 postcss 插件：把 rpx 换算成 px。
 *
 * 背景：
 * - 项目样式统一按 750 设计稿写 rpx，小程序 / H5 端 Taro 的 postcss-pxtransform 会原样保留 rpx。
 * - RN 端走的是 taro-css-to-react-native，它只认 px / % / 无单位数字，
 *   遇到 `12rpx` 会抛 `Unexpected token type: word`。
 * - 这里按 1rpx = 0.5px（750 设计稿 → 375dp 屏幕）直接换算，
 *   换算结果与小程序端渲染尺寸一致。
 */
const RPX_RE = /(-?\d*\.?\d+)rpx/g

module.exports = (opts = {}) => {
  const ratio = typeof opts.ratio === 'number' ? opts.ratio : 0.5
  return {
    postcssPlugin: 'postcss-rpx',
    Declaration(decl) {
      if (!decl.value || decl.value.indexOf('rpx') === -1) return
      decl.value = decl.value.replace(RPX_RE, (_all, num) => {
        const px = Number(num) * ratio
        return `${Math.round(px * 1000) / 1000}px`
      })
    }
  }
}

module.exports.postcss = true

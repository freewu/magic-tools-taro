import { defineConfig, type UserConfigExport } from '@tarojs/cli'
import path from 'node:path'

import devConfig from './dev'
import prodConfig from './prod'

// 各端产物按平台分目录（dist/weapp、dist/alipay …），一个仓库就能同时预览多个平台
const platform = process.env.TARO_ENV || 'weapp'

const config: UserConfigExport = {
  projectName: 'magic-tools-taro',
  date: '2025-1-1',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    375: 2,
    828: 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot: `dist/${platform}`,
  // 飞书小程序没有内置平台插件，用社区版 @tarojs/plugin-platform-lark 注册 lark 平台
  plugins: ['@tarojs/plugin-platform-lark'],
  defineConstants: {},
  alias: {
    '@': path.resolve(__dirname, '..', 'src')
  },
  copy: {
    patterns: [],
    options: {}
  },
  framework: 'react',
  compiler: 'webpack5',
  cache: {
    enable: false
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {}
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    }
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    output: {
      filename: 'js/[name].[hash:8].js',
      chunkFilename: 'js/[name].[chunkhash:8].js'
    },
    miniCssExtractPluginOption: {
      ignoreOrder: true,
      filename: 'css/[name].[hash].css',
      chunkFilename: 'css/[name].[chunkhash].css'
    },
    postcss: {
      autoprefixer: {
        enable: true,
        config: {}
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    }
  }
}

export default defineConfig(async (merge) => {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, devConfig)
  }
  return merge({}, config, prodConfig)
})

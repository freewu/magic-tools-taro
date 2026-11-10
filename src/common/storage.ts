// 本地存储的统一入口。
//
// 小程序 / H5 的 Taro.getStorageSync / setStorageSync 都可用，但 RN（Android）端
// `@tarojs/taro-rn` 没有同步实现：调用会 console.error 并「返回一个 Error 对象」而不是抛错，
// 于是 `Taro.getStorageSync(key).split(...)` 之类的代码会直接崩（设置页进不去就是这个原因），
// 写入则是静默无效（改了设置下次进来又变回去）。
//
// 所以这里按端分流：
//   - 小程序 / H5：直接用同步 API；
//   - RN：用 AsyncStorage 实现的异步 getStorage / setStorage，在启动时把全部键读到内存缓存，
//     业务代码继续按同步方式读写（写的时候缓存立刻生效 + 异步落盘）。
//
// App 组件会在渲染页面前 await hydrateStorage()，保证页面首帧就能读到已保存的值。

import Taro from '@tarojs/taro'

/** RN 端没有同步存储 API，需要预热；其它端为 false */
const NEEDS_HYDRATE = process.env.TARO_ENV === 'rn'

/** RN 端的内存缓存（其它端不用） */
const cache = new Map<string, string>()

let hydrated = false

function toText(value: unknown): string {
  // 各端读不到时的返回值不统一（''、undefined、null），统一收敛成空串
  return typeof value === 'string' ? value : ''
}

// Taro 的 getStorageInfo / getStorage 声明成返回 CallbackResult（类型上丢了 keys / data），
// 这里按文档结构声明，避免到处 as any
type StorageInfoResult = { keys?: string[] }
type StorageValueResult = { data?: unknown }

/**
 * 把已保存的键值全部读进内存缓存。
 * 小程序 / H5 无需预热，直接 resolve；可重复调用，第二次起是空操作。
 */
export async function hydrateStorage(): Promise<void> {
  if (!NEEDS_HYDRATE || hydrated) {
    return
  }
  try {
    const info = (await Taro.getStorageInfo()) as StorageInfoResult
    const keys = info && info.keys ? info.keys : []
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      try {
        const res = (await Taro.getStorage({ key })) as StorageValueResult
        cache.set(key, toText(res && res.data))
      } catch (err) {
        // 单个键读失败（例如读的瞬间被清掉）不影响其它键
      }
    }
  } catch (err) {
    console.error('[storage] 预热本地存储失败，本次运行按未保存处理', err)
  }
  hydrated = true
}

/** 读取文本；没有记录时返回空串 */
export function readStorage(key: string): string {
  if (!NEEDS_HYDRATE) {
    return toText(Taro.getStorageSync(key))
  }
  const value = cache.get(key)
  return value == null ? '' : value
}

/** 写入文本（RN 端立即写缓存，落盘是异步的，失败只记日志） */
export function writeStorage(key: string, value: string): void {
  if (!NEEDS_HYDRATE) {
    Taro.setStorageSync(key, value)
    return
  }
  cache.set(key, value)
  Taro.setStorage({ key, data: value }).catch((err) => {
    console.error('[storage] 保存失败：' + key, err)
  })
}

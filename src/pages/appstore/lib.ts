// 应用置顶（收藏）状态的本地存取与排序

import Taro from '@tarojs/taro'

import { appList, type AppItem } from '../app/index'

/** 存储键：置顶的应用名，'\n' 分隔（最近置顶的在前） */
const PINNED_APPS_KEY = 'appstore-pinned-apps'

function findAppByName(name: string): AppItem | null {
  for (let i = 0; i < appList.length; i++) {
    if (appList[i].name === name) {
      return appList[i]
    }
  }
  return null
}

/** 读取置顶列表：忽略已下线的应用与重复项 */
export function loadPinnedNames(): string[] {
  const names: string[] = []
  const value = Taro.getStorageSync(PINNED_APPS_KEY)
  if (value == null || typeof value !== 'string' || value === '') {
    return names
  }
  const lines = value.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const name = lines[i].trim()
    if (name === '') {
      continue
    }
    if (names.indexOf(name) >= 0) {
      continue
    }
    if (findAppByName(name) == null) {
      continue
    }
    names.push(name)
  }
  return names
}

/** 写入置顶列表 */
export function savePinnedNames(names: string[]): void {
  Taro.setStorageSync(PINNED_APPS_KEY, names.join('\n'))
}

/** 展示顺序：置顶的应用在前（按置顶顺序），其余保持列表原顺序 */
export function arrangeApps(pinnedNames: string[]): AppItem[] {
  const out: AppItem[] = []
  for (let i = 0; i < pinnedNames.length; i++) {
    const app = findAppByName(pinnedNames[i])
    if (app != null) {
      out.push(app)
    }
  }
  for (let i = 0; i < appList.length; i++) {
    if (pinnedNames.indexOf(appList[i].name) < 0) {
      out.push(appList[i])
    }
  }
  return out
}

/** 切换置顶状态并立即保存：取消置顶 / 置于最前 */
export function togglePin(pinnedNames: string[], name: string): string[] {
  const out: string[] = []
  if (pinnedNames.indexOf(name) >= 0) {
    for (let i = 0; i < pinnedNames.length; i++) {
      if (pinnedNames[i] !== name) {
        out.push(pinnedNames[i])
      }
    }
  } else {
    out.push(name)
    for (let i = 0; i < pinnedNames.length; i++) {
      out.push(pinnedNames[i])
    }
  }
  savePinnedNames(out)
  return out
}

// 应用商店（tab 首页）：工具网格 + 置顶（收藏）

import { useState } from 'react'
import Taro from '@tarojs/taro'
import { Image, Input, Text, View } from '@tarojs/components'

import { type AppItem } from '../app/index'
import pinBlue from '../../static/pin-blue.png'
import pinGray from '../../static/pin-gray.png'
import { arrangeApps, filterApps, loadPinnedNames, togglePin } from './lib'

import NavBar from '../../components/nav-bar'

import './index.scss'

/** 图标底色按应用名散列取用，置顶导致顺序变化时配色保持稳定 */
const tints = ['#EAF2FF', '#FFF1E8', '#E9F7EF', '#FDECF0', '#F0EBFF', '#E8F6F8']

function tintAt(name: string): string {
  let sum = 0
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i)
  }
  return tints[sum % tints.length]
}

export default function AppStore() {
  const [pinnedNames, setPinnedNames] = useState<string[]>(() => loadPinnedNames())
  const [displayList, setDisplayList] = useState<AppItem[]>(() => arrangeApps(pinnedNames))
  const [keyword, setKeyword] = useState('')

  /** 搜索结果：在「置顶优先」的顺序上按关键词过滤名称与简介 */
  const visibleList = filterApps(displayList, keyword)

  const isPinned = (name: string): boolean => pinnedNames.indexOf(name) >= 0

  /** 顶部小字统计：应用总数，有置顶时追加之；搜索时只报命中数量 */
  const summaryText = (): string => {
    if (keyword.trim() !== '') {
      return `找到 ${visibleList.length} 个应用`
    }
    let text = `共 ${displayList.length} 个应用`
    if (pinnedNames.length > 0) {
      text = `${text} · 已置顶 ${pinnedNames.length} 个`
    }
    return text
  }

  /** 置顶图钉：未置顶灰色、已置顶主题蓝 */
  const pinIcon = (name: string): string => {
    return isPinned(name) ? pinBlue : pinGray
  }

  const onTogglePin = (name: string) => {
    const next = togglePin(pinnedNames, name)
    setPinnedNames(next)
    setDisplayList(arrangeApps(next))
  }

  const openApp = (app: AppItem) => {
    let url = `/pages/app/${app.path}`
    if (app.query !== '') {
      url = `${url}?${app.query}`
    }
    Taro.navigateTo({ url })
  }

  return (
    <View className='page'>
      <NavBar title='应用' back={false} />

      {/* 搜索：按应用名称与简介过滤，支持空格分隔多个关键词 */}
      <View className='search-row'>
        <View className='search-box'>
          <Text className='search-icon'>🔍</Text>
          <Input
            className='search-input'
            value={keyword}
            placeholder='搜应用名称或功能，如 月供、换算'
            placeholderClass='search-placeholder'
            confirmType='search'
            onInput={(event) => setKeyword(event.detail.value)}
          />
          {keyword !== '' && (
            <Text className='search-clear' onClick={() => setKeyword('')}>
              ✕
            </Text>
          )}
        </View>
      </View>

      {/* 顶部统计：应用总数（有置顶时附带置顶数量） */}
      <View className='summary-row'>
        <Text className='summary-text'>{summaryText()}</Text>
      </View>

      <View className='grid'>
        {visibleList.map((app) => (
          <View
            key={app.name}
            className='app-item'
            style={{ borderColor: isPinned(app.name) ? '#007AFF' : '#E5E5E5' }}
          >
            <View className='pin-row'>
              <View className='pin-btn' hoverClass='pin-btn-hover' onClick={() => onTogglePin(app.name)}>
                <Image className='pin-icon' src={pinIcon(app.name)} mode='aspectFit' />
              </View>
            </View>
            <View className='app-body' hoverClass='app-body-hover' onClick={() => openApp(app)}>
              <View className='app-icon' style={{ backgroundColor: tintAt(app.name) }}>
                <Text className='app-icon-text'>{app.icon}</Text>
              </View>
              <Text className='app-name'>{app.name}</Text>
            </View>
          </View>
        ))}
      </View>

      {visibleList.length === 0 ? (
        <View className='empty-row'>
          <Text className='empty-text'>没有匹配的应用，换个关键词试试</Text>
        </View>
      ) : null}

      <Text className='footer-tip'>更多小工具开发中，敬请期待</Text>
    </View>
  )
}

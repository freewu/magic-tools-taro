// 世界时间：多城市时钟（固定 UTC 偏移），支持增删城市与自定义偏移

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Taro, { useDidHide, useDidShow } from '@tarojs/taro'
import { Input, Picker, Text, View } from '@tarojs/components'

import AppMenu from '../../../components/app-menu'
import { CITY_CATALOG, type CityOption } from './cities'
import {
  appendCity,
  cityLabel,
  codeTextOf,
  dateTextOf,
  defaultCities,
  filterOptions,
  formatOffset,
  hasCity,
  isKnownOffset,
  loadCities,
  removeCityAt,
  saveCities,
  timeTextOf,
  type CityClock
} from './lib'

import './index.scss'

/** 只保留数字、一个小数点和开头的负号 */
function sanitizeOffset(raw: string): string {
  let out = ''
  let hasDot = false
  for (let i = 0; i < raw.length; i++) {
    const c = raw.substring(i, i + 1)
    if (c >= '0' && c <= '9') {
      out += c
    } else if (c === '-' && out.length === 0) {
      out += c
    } else if (c === '.' && !hasDot && out.length > 0 && out !== '-') {
      hasDot = true
      out += c
    }
  }
  return out
}

export default function WorldTime() {
  // 时钟列表（首次进入是默认五城，之后完全以存储为准，删空也保持为空）
  const [cities, setCities] = useState<CityClock[]>(() => loadCities())
  const [addPanelOpen, setAddPanelOpen] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customOffset, setCustomOffset] = useState('')
  const [nowMs, setNowMs] = useState(() => Date.now())
  const timerId = useRef<ReturnType<typeof setInterval> | null>(null)

  // 常用城市候选（已添加的不再出现）
  const addOptions = useMemo(() => filterOptions(CITY_CATALOG, cities), [cities])
  const addLabels = useMemo(() => addOptions.map((option: CityOption) => cityLabel(option)), [addOptions])

  // 每秒刷新一次时间
  const startTimer = useCallback(() => {
    if (timerId.current != null) {
      return
    }
    setNowMs(Date.now())
    timerId.current = setInterval(() => setNowMs(Date.now()), 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerId.current != null) {
      clearInterval(timerId.current)
      timerId.current = null
    }
  }, [])

  useEffect(() => {
    startTimer()
    return stopTimer
  }, [startTimer, stopTimer])

  useDidShow(() => startTimer())
  useDidHide(() => stopTimer())

  const updateCities = (next: CityClock[]) => {
    setCities(next)
    saveCities(next)
  }

  const onPickCity = (event) => {
    const index = Number(event.detail.value)
    if (index < 0 || index >= addOptions.length) {
      return
    }
    const option = addOptions[index]
    updateCities(appendCity(cities, option.name, option.code, option.offset))
  }

  const onAddCustom = () => {
    const name = customName.trim()
    if (name === '') {
      Taro.showToast({ title: '请填写城市名称', icon: 'none' })
      return
    }
    const offset = parseFloat(customOffset)
    if (!isKnownOffset(offset)) {
      Taro.showToast({ title: '偏移需在 -12 ~ 14 之间', icon: 'none' })
      return
    }
    // 同名城市直接视为已添加，不重复展示、也不提示
    if (hasCity(cities, name)) {
      return
    }
    updateCities(appendCity(cities, name, '', offset))
    setCustomName('')
    setCustomOffset('')
  }

  const onDeleteCity = (index: number) => {
    if (index < 0 || index >= cities.length) {
      return
    }
    const name = cities[index].name
    Taro.showModal({
      title: '移除城市',
      content: `确定移除 ${name} 吗？`,
      success: (res) => {
        if (!res.confirm) {
          return
        }
        updateCities(removeCityAt(cities, index))
      }
    })
  }

  const onRestoreDefault = () => {
    updateCities(defaultCities())
  }

  return (
    <View className='page-with-menu'>
      <View className='container'>
        <View className='card'>
          <View className='head-row'>
            <View className='head-text'>
              <Text className='card-title'>世界时间</Text>
              <Text className='card-tip'>显示为固定时区（UTC 偏移），未考虑夏令时，仅供参考。</Text>
            </View>
            <View
              className='add-toggle'
              hoverClass='add-toggle-hover'
              onClick={() => setAddPanelOpen(!addPanelOpen)}
            >
              <Text className='add-toggle-text'>{addPanelOpen ? '✕' : '+'}</Text>
            </View>
          </View>
        </View>

        {/* 添加城市：点右上角 + 展开 */}
        {addPanelOpen && (
          <View className='card'>
            <Text className='card-title'>添加城市</Text>
            {addLabels.length > 0 ? (
              <Picker className='pick' mode='selector' range={addLabels} value={0} onChange={onPickCity}>
                <View className='pick-box' hoverClass='pick-box-hover'>
                  <Text className='pick-text'>从常用城市选择</Text>
                  <Text className='pick-arrow'>▾</Text>
                </View>
              </Picker>
            ) : (
              <Text className='card-tip'>常用城市都已添加，可以在下面自定义。</Text>
            )}

            <View className='custom-row'>
              <Input
                className='custom-name'
                type='text'
                maxlength={12}
                placeholder='城市名称'
                value={customName}
                onInput={(event) => setCustomName(String(event.detail.value ?? ''))}
              />
              <Input
                className='custom-offset'
                type='text'
                maxlength={6}
                placeholder='偏移 8 / -5'
                value={customOffset}
                onInput={(event) => setCustomOffset(sanitizeOffset(String(event.detail.value ?? '')))}
              />
              <View className='add-btn' hoverClass='add-btn-hover' onClick={onAddCustom}>
                <Text className='add-btn-text'>添加</Text>
              </View>
            </View>
            <Text className='card-tip'>UTC 偏移按小时填写，可填小数：8、-5、5.5（UTC+5:30）。</Text>
          </View>
        )}

        {/* 时钟列表 */}
        {cities.map((city, index) => (
          <View className='city-card' key={city.name}>
            <View className='city-head'>
              <View className='city-name-box'>
                <Text className='city-name'>{city.name}</Text>
                <Text className='city-code'>{codeTextOf(city.code)}</Text>
              </View>
              <View className='city-del' hoverClass='city-del-hover' onClick={() => onDeleteCity(index)}>
                <Text className='city-del-text'>✕</Text>
              </View>
            </View>
            <View className='city-body'>
              <Text className='city-time'>{timeTextOf(city.offset, nowMs)}</Text>
              <Text className='city-offset'>{formatOffset(city.offset)}</Text>
            </View>
            <Text className='city-date'>{dateTextOf(city.offset, nowMs)}</Text>
          </View>
        ))}

        {cities.length === 0 && (
          <View className='card'>
            <Text className='empty-text'>还没有城市，点右上角的 + 添加。</Text>
            <View className='restore-btn' hoverClass='restore-btn-hover' onClick={onRestoreDefault}>
              <Text className='restore-btn-text'>恢复默认城市</Text>
            </View>
          </View>
        )}
      </View>
      <AppMenu />
    </View>
  )
}

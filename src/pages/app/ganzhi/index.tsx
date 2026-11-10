// 天干地支：查某一天的日干支，或按年份查干支纪年与生肖

import { useState } from 'react'
import { Input, Text, View } from '@tarojs/components'

import PageWithMenu from '../../../components/page-with-menu'
import Picker from '../../../components/picker'
import NavBar from '../../../components/nav-bar'
import {
  dayGanzhi,
  parseDate,
  todayKey,
  weekdayNameOf,
  yearGanzhi,
  zodiacOfYear
} from './lib'

import './index.scss'

export default function Ganzhi() {
  const [dateStr, setDateStr] = useState(() => todayKey())
  const [yearInput, setYearInput] = useState('')

  const [y, m, d] = parseDate(dateStr)
  const dateMetrics = [
    { label: '日干支', value: dayGanzhi(y, m, d) },
    { label: '星期', value: weekdayNameOf(y, m, d) },
    { label: '公历干支年', value: yearGanzhi(y) },
    { label: '生肖', value: zodiacOfYear(y) }
  ]

  const yearText = yearInput === '' ? '' : sanitizeYearInput(yearInput)
  const yearValue = yearText === '' ? NaN : parseInt(yearText)
  const yearVisible = yearText !== '' && isFinite(yearValue)
  const yearMetrics = yearVisible
    ? [
        { label: '干支纪年', value: yearGanzhi(yearValue) },
        { label: '生肖', value: zodiacOfYear(yearValue) }
      ]
    : []

  return (
    <PageWithMenu>
      <NavBar title='天干地支' />
      <View className='container'>
        {/* 日期 */}
        <View className='card'>
          <Text className='card-title'>公历日期</Text>
          <View className='field-row'>
            <Picker
              mode='date'
              value={dateStr}
              onChange={(event) => setDateStr(String(event.detail.value))}
            >
              <View className='pick-box' hoverClass='pick-box-hover'>
                <Text className='pick-text'>{dateStr}</Text>
                <Text className='pick-arrow'>▾</Text>
              </View>
            </Picker>
          </View>
          {dateMetrics.map((item) => (
            <View className='metric-row' key={item.label}>
              <Text className='metric-label'>{item.label}</Text>
              <Text className='metric-value'>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* 只填年份 */}
        <View className='card'>
          <Text className='card-title'>只填年份</Text>
          <View className='field-row'>
            <Text className='field-label'>年份</Text>
            <Input
              className='input-box'
              type='number'
              maxlength={4}
              placeholder='如 2026'
              value={yearInput}
              onInput={(event) => setYearInput(sanitizeYearInput(String(event.detail.value ?? '')))}
            />
          </View>
          {yearMetrics.map((item) => (
            <View className='metric-row' key={item.label}>
              <Text className='metric-label'>{item.label}</Text>
              <Text className='metric-value'>{item.value}</Text>
            </View>
          ))}
        </View>

        <Text className='tip-text page-tip'>
          日干支按公历逐日连续计算，可直接用于择日；年干支与生肖的「换年」实际在立春前后（年份输入按公历元旦粗略划分，春节前出生需自行核对农历）。
        </Text>
      </View>
    </PageWithMenu>
  )
}

/** 年份输入只留数字（这里不接受负号：干支纪年按公元年份推算） */
function sanitizeYearInput(raw: string): string {
  let out = ''
  for (let i = 0; i < raw.length; i++) {
    const c = raw.substring(i, i + 1)
    if (c >= '0' && c <= '9') {
      out += c
    }
  }
  return out
}

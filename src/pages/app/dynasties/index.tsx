// 历史朝代：按年份查朝代、起止时间与都城，并列出朝代年表

import { useState } from 'react'
import { Input, Text, View } from '@tarojs/components'

import AppMenu from '../../../components/app-menu'
import NavBar from '../../../components/nav-bar'
import { dynasties } from './data'
import { fmtRange, matchYear, sanitizeYear } from './lib'

import './index.scss'

const CURRENT_YEAR = new Date().getFullYear()

export default function Dynasties() {
  const [yearInput, setYearInput] = useState('')
  const match = matchYear(yearInput, CURRENT_YEAR)

  return (
    <View className='page-with-menu'>
      <NavBar title='历史朝代' />
      <View className='container'>
        <View className='card'>
          <Text className='card-title'>年份查询</Text>
          <View className='field-row'>
            <Text className='field-label'>年份</Text>
            <Input
              className='input-box'
              type='text'
              maxlength={6}
              placeholder='如 2026；公元前填负号，如 -221'
              value={yearInput}
              onInput={(event) => setYearInput(sanitizeYear(String(event.detail.value ?? '')))}
            />
          </View>
          {match.kind === 'hit' && (
            <View>
              <View className='metric-row'>
                <Text className='metric-label'>朝代</Text>
                <Text className='metric-value accent'>{match.item.name}</Text>
              </View>
              <View className='metric-row'>
                <Text className='metric-label'>起止时间</Text>
                <Text className='metric-value'>{match.range}</Text>
              </View>
              <View className='metric-row'>
                <Text className='metric-label'>主要都城</Text>
                <Text className='metric-value'>{match.item.capital}</Text>
              </View>
              {match.item.endYear !== 0 && (
                <View className='metric-row'>
                  <Text className='metric-label'>距今</Text>
                  <Text className='metric-value'>{match.years}</Text>
                </View>
              )}
            </View>
          )}
          {match.kind === 'miss' && <Text className='tip-text'>{match.text}</Text>}
        </View>

        <View className='card'>
          <Text className='card-title'>朝代年表</Text>
          {dynasties.map((item) => (
            <View className='row' key={item.name}>
              <View className='row-left'>
                <Text className='row-name'>{item.name}</Text>
                <Text className='row-sub'>{fmtRange(item.startYear, item.endYear)}</Text>
              </View>
              <Text className='row-right'>{item.capital}</Text>
            </View>
          ))}
        </View>

        <Text className='tip-text page-tip'>
          年份对照采用常用历史分期近似（含并立政权区间），都城为主要建都地；详细纪年请以权威年表为准。
        </Text>
      </View>
      <AppMenu />
    </View>
  )
}

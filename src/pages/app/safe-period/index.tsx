// 安全期：按末次月经与周期长度推算排卵日、危险期与安全期

import { useState } from 'react'
import { Input, Picker, Text, View } from '@tarojs/components'

import AppMenu from '../../../components/app-menu'
import { addDays, formatDate, parseDateKey, todayParts } from '../../../common/date'
import { sanitizeInt } from '../../../common/format'
import { calcSafePeriod } from './lib'

import './index.scss'

/** 默认末次月经：今天往前推 28 天，便于打开即演示 */
function defaultLmpKey(): string {
  const [y, m, d] = todayParts()
  return formatDate(addDays(y, m, d, -28))
}

export default function SafePeriod() {
  const [lmpStr, setLmpStr] = useState(() => defaultLmpKey())
  const [cycleInput, setCycleInput] = useState('28')
  const [periodInput, setPeriodInput] = useState('5')

  const cycle = parseInt(cycleInput)
  const periodLen = parseInt(periodInput)
  const [ly, lm, ld] = parseDateKey(lmpStr)
  const valid =
    isFinite(cycle) && cycle >= 15 && cycle <= 60 && isFinite(periodLen) && periodLen >= 1 && periodLen <= 15
  const [ty, tm, td] = todayParts()
  const result = valid ? calcSafePeriod(ly, lm, ld, cycle, periodLen, ty, tm, td) : null

  return (
    <View className='page-with-menu'>
      <View className='container'>
        <View className='card'>
          <Text className='card-title'>周期信息</Text>
          <View className='field-row'>
            <Text className='field-label'>末次月经</Text>
            <Picker mode='date' value={lmpStr} onChange={(event) => setLmpStr(String(event.detail.value))}>
              <View className='pick-box' hoverClass='pick-box-hover'>
                <Text className='pick-text'>{lmpStr}</Text>
                <Text className='pick-arrow'>▾</Text>
              </View>
            </Picker>
          </View>
          <View className='field-row'>
            <Text className='field-label'>月经周期</Text>
            <Input
              className='input-box'
              type='number'
              maxlength={2}
              placeholder='28（天）'
              value={cycleInput}
              onInput={(event) => setCycleInput(sanitizeInt(String(event.detail.value ?? '')))}
            />
          </View>
          <View className='field-row'>
            <Text className='field-label'>经期天数</Text>
            <Input
              className='input-box'
              type='number'
              maxlength={2}
              placeholder='5（天）'
              value={periodInput}
              onInput={(event) => setPeriodInput(sanitizeInt(String(event.detail.value ?? '')))}
            />
          </View>
        </View>

        <View className='card'>
          <Text className='card-title'>推算结果（按本轮周期）</Text>
          {result != null ? (
            <View>
              <View className='metric-row'>
                <Text className='metric-label'>排卵日</Text>
                <Text className='metric-value'>{result.ovulation}</Text>
              </View>
              <View className='metric-row'>
                <Text className='metric-label'>危险期（易孕）</Text>
                <Text className='metric-value accent'>{result.danger}</Text>
              </View>
              <View className='metric-row'>
                <Text className='metric-label'>前安全期</Text>
                <Text className='metric-value'>{result.safe1}</Text>
              </View>
              <View className='metric-row'>
                <Text className='metric-label'>后安全期</Text>
                <Text className='metric-value'>{result.safe2}</Text>
              </View>
              <Text className='tip-text'>{result.todayState}</Text>
            </View>
          ) : (
            <Text className='tip-text'>请检查周期（15–60 天）与经期（1–15 天）</Text>
          )}
        </View>

        <Text className='tip-text page-tip'>
          按「下次月经前 14 天排卵、排卵前 5 天 + 排卵后 4 天为易孕期」的日历法估算；安全期并不绝对安全，不适用于避孕决策，身体异常请咨询医生。
        </Text>
      </View>
      <AppMenu />
    </View>
  )
}

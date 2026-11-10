// 预产期：按末次月经 + 280 天推算，附当前孕周、距预产期与星座

import { useState } from 'react'
import { Text, View } from '@tarojs/components'

import PageWithMenu from '../../../components/page-with-menu'
import Picker from '../../../components/picker'
import NavBar from '../../../components/nav-bar'
import { parseDateKey, todayKey, todayParts } from '../../../common/date'
import { calcDueDate } from './lib'

import './index.scss'

export default function DueDate() {
  const [lmpStr, setLmpStr] = useState(() => todayKey())

  const [ly, lm, ld] = parseDateKey(lmpStr)
  const [ty, tm, td] = todayParts()
  const result = calcDueDate(ly, lm, ld, ty, tm, td)

  const weekText = result.valid ? `${result.weeks} 周 ${result.daysInWeek} 天` : '-'
  const daysText = result.valid ? `${result.weeks * 7 + result.daysInWeek} 天` : '-'
  const remainingText = result.remaining >= 0 ? `${result.remaining} 天` : `已过 ${-result.remaining} 天`

  return (
    <PageWithMenu>
      <NavBar title='预产期' />
      <View className='container'>
        <View className='card'>
          <Text className='card-title'>末次月经（LMP）</Text>
          <View className='field-row'>
            <Text className='field-label'>开始日期</Text>
            <Picker mode='date' value={lmpStr} onChange={(event) => setLmpStr(String(event.detail.value))}>
              <View className='pick-box' hoverClass='pick-box-hover'>
                <Text className='pick-text'>{lmpStr}</Text>
                <Text className='pick-arrow'>▾</Text>
              </View>
            </Picker>
          </View>
          <Text className='tip-text'>默认填今天；改成最近一次月经开始日期即可。</Text>
        </View>

        <View className='card'>
          <Text className='card-title'>推算结果</Text>
          <View className='metric-row'>
            <Text className='metric-label'>预产期</Text>
            <Text className='metric-value accent'>{result.dueDate}</Text>
          </View>
          <View className='metric-row'>
            <Text className='metric-label'>预产期星期</Text>
            <Text className='metric-value'>{result.weekday}</Text>
          </View>
          <View className='metric-row'>
            <Text className='metric-label'>当前孕周</Text>
            <Text className='metric-value'>{weekText}</Text>
          </View>
          <View className='metric-row'>
            <Text className='metric-label'>已孕天数</Text>
            <Text className='metric-value'>{daysText}</Text>
          </View>
          <View className='metric-row'>
            <Text className='metric-label'>距预产期</Text>
            <Text className='metric-value'>{result.valid ? remainingText : '-'}</Text>
          </View>
          <View className='metric-row'>
            <Text className='metric-label'>预产期星座</Text>
            <Text className='metric-value'>{result.sign}</Text>
          </View>
          {result.status !== '' && <Text className='tip-text'>{result.status}</Text>}
        </View>

        <Text className='tip-text page-tip'>
          按 Naegele 法则「末次月经 + 280 天（40 周）」推算，适用于月经周期约 28 天者；若周期不准或已有 B
          超核对，应以医生评估为准。
        </Text>
      </View>
    </PageWithMenu>
  )
}

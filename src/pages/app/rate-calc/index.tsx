// 浮动利率存款利息（单利）+ 存期单位选择

import { useState } from 'react'
import { Input, Picker, Text, View } from '@tarojs/components'

import AppMenu from '../../../components/app-menu'
import { formatMoney, sanitizeDecimal, toNumber } from '../../../common/format'
import { calcSavingsInterest } from './lib'

import './index.scss'

const unitNames: string[] = ['年', '月', '天']

export default function RateCalc() {
  const [principalInput, setPrincipalInput] = useState('')
  const [rateInput, setRateInput] = useState('')
  const [periodInput, setPeriodInput] = useState('')
  const [unitIndex, setUnitIndex] = useState(0)

  const principal = toNumber(principalInput)
  const rate = toNumber(rateInput)
  const period = toNumber(periodInput)
  const visible = principal > 0 && rate >= 0 && period > 0 && rateInput !== '' && periodInput !== ''
  const result = visible ? calcSavingsInterest(principal, rate, period, unitIndex) : null

  return (
    <View className='page-with-menu'>
      <View className='container'>
        <View className='card'>
          <Text className='card-title'>存款信息</Text>
          <View className='field-row'>
            <Text className='field-label'>本金</Text>
            <Input
              className='input-box'
              type='digit'
              placeholder='10000（元）'
              value={principalInput}
              onInput={(event) => setPrincipalInput(sanitizeDecimal(String(event.detail.value ?? '')))}
            />
          </View>
          <View className='field-row'>
            <Text className='field-label'>年利率</Text>
            <Input
              className='input-box'
              type='digit'
              placeholder='2.0（%）'
              value={rateInput}
              onInput={(event) => setRateInput(sanitizeDecimal(String(event.detail.value ?? '')))}
            />
          </View>
          <View className='field-row'>
            <Text className='field-label'>存期</Text>
            <Input
              className='input-box'
              type='digit'
              placeholder='1'
              value={periodInput}
              onInput={(event) => setPeriodInput(sanitizeDecimal(String(event.detail.value ?? '')))}
            />
            <Picker
              className='pick-wrap'
              mode='selector'
              range={unitNames}
              value={unitIndex}
              onChange={(event) => setUnitIndex(Number(event.detail.value))}
            >
              <View className='pick-box' hoverClass='pick-box-hover'>
                <Text className='pick-text'>{unitNames[unitIndex]}</Text>
                <Text className='pick-arrow'>▾</Text>
              </View>
            </Picker>
          </View>
        </View>

        {result != null && (
          <View className='card'>
            <Text className='card-title'>计算结果</Text>
            <View className='metric-row'>
              <Text className='metric-label'>存期（折年）</Text>
              <Text className='metric-value'>{result.yearsText}</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>到期利息</Text>
              <Text className='metric-value accent'>¥ {formatMoney(result.interest)}</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>本息合计</Text>
              <Text className='metric-value'>¥ {formatMoney(result.total)}</Text>
            </View>
          </View>
        )}

        <Text className='tip-text page-tip'>
          单利估算（利息 = 本金 × 年利率 × 存期）。整存整取到期一次还本付息；天数口径按银行「1 年 360
          天」惯例估算，仅供参考。利率请以银行挂牌为准。
        </Text>
      </View>
      <AppMenu />
    </View>
  )
}

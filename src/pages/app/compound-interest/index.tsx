// 复利计算：支持按期追加投入（普通年金）

import { useState } from 'react'
import { Input, Picker, Text, View } from '@tarojs/components'

import AppMenu from '../../../components/app-menu'
import { formatFixed, formatMoney, sanitizeDecimal, sanitizeInt, toNumber } from '../../../common/format'
import { calcCompound } from './lib'

import './index.scss'

const periodTexts: string[] = ['每月', '每季', '每半年', '每年']
const periodValues: number[] = [12, 4, 2, 1]

export default function CompoundInterest() {
  const [principalInput, setPrincipalInput] = useState('')
  const [rateInput, setRateInput] = useState('')
  const [yearsInput, setYearsInput] = useState('')
  const [contributionInput, setContributionInput] = useState('')
  const [periodIndex, setPeriodIndex] = useState(3)

  const principal = toNumber(principalInput)
  const annualRate = toNumber(rateInput)
  const years = Math.round(toNumber(yearsInput))
  const valid = principal > 0 && annualRate >= 0 && years >= 1 && years <= 100

  const result = valid
    ? calcCompound(principal, annualRate, years, periodValues[periodIndex], toNumber(contributionInput))
    : null

  return (
    <View className='page-with-menu'>
      <View className='container'>
        {/* 输入区 */}
        <View className='card'>
          <Text className='card-title'>投入与利率</Text>

          <View className='field-row'>
            <Text className='field-label'>初始本金</Text>
            <Input
              className='input-box'
              type='digit'
              maxlength={10}
              placeholder='请输入本金（元）'
              value={principalInput}
              onInput={(event) => setPrincipalInput(sanitizeDecimal(String(event.detail.value ?? '')))}
            />
          </View>
          <View className='field-row'>
            <Text className='field-label'>年利率</Text>
            <Input
              className='input-box'
              type='digit'
              maxlength={6}
              placeholder='如 4（%）'
              value={rateInput}
              onInput={(event) => setRateInput(sanitizeDecimal(String(event.detail.value ?? '')))}
            />
          </View>
          <View className='field-row'>
            <Text className='field-label'>期限</Text>
            <Input
              className='input-box'
              type='number'
              maxlength={3}
              placeholder='请输入年数，如 10'
              value={yearsInput}
              onInput={(event) => setYearsInput(sanitizeInt(String(event.detail.value ?? '')))}
            />
          </View>
          <View className='field-row'>
            <Text className='field-label'>计息周期</Text>
            <Picker
              className='pick-wrap'
              mode='selector'
              range={periodTexts}
              value={periodIndex}
              onChange={(event) => setPeriodIndex(Number(event.detail.value))}
            >
              <View className='pick-box' hoverClass='pick-box-hover'>
                <Text className='pick-text'>{periodTexts[periodIndex]}</Text>
                <Text className='pick-arrow'>▾</Text>
              </View>
            </Picker>
          </View>
          <View className='field-row'>
            <Text className='field-label'>每期追加</Text>
            <Input
              className='input-box'
              type='digit'
              maxlength={8}
              placeholder='定期追加金额（元），选填'
              value={contributionInput}
              onInput={(event) => setContributionInput(sanitizeDecimal(String(event.detail.value ?? '')))}
            />
          </View>
          <Text className='tip-text'>期限支持 1-100 年（整数）；每期追加默认为每期期末投入（普通年金）。</Text>
        </View>

        {/* 结果区 */}
        {result != null && (
          <View className='card'>
            <Text className='card-title'>到期结果</Text>

            <View className='metric-row'>
              <Text className='metric-label'>复利期数</Text>
              <Text className='metric-value'>{result.periods} 期</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>累计投入</Text>
              <Text className='metric-value'>{formatMoney(result.invested)} 元</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>总收益</Text>
              <Text className='metric-value metric-accent'>
                {result.gain <= 0 ? '0.00 元' : `${formatMoney(result.gain)} 元`}
              </Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>到期本息</Text>
              <Text className='metric-value'>{formatMoney(result.future)} 元</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>收益率</Text>
              <Text className='metric-value'>{formatFixed(result.gainRate, 2)}%</Text>
            </View>

            <Text className='tip-text'>以上为复利测算结果，不构成任何投资建议；实际收益以产品条款为准。</Text>
          </View>
        )}
      </View>
      <AppMenu />
    </View>
  )
}

// 房贷计算：等额本息 / 等额本金

import { useState } from 'react'
import { Input, Picker, Text, View } from '@tarojs/components'

import AppMenu from '../../../components/app-menu'
import NavBar from '../../../components/nav-bar'
import { formatMoney, sanitizeDecimal, sanitizeInt, toNumber } from '../../../common/format'
import { calcMortgageEI, calcMortgageEP } from './lib'

import './index.scss'

const unitTexts: string[] = ['万元', '元']
const unitFactors: number[] = [10000, 1]
const planTexts: string[] = ['等额本息', '等额本金']

export default function Mortgage() {
  const [amountInput, setAmountInput] = useState('')
  const [rateInput, setRateInput] = useState('')
  const [yearsInput, setYearsInput] = useState('')
  const [unitIndex, setUnitIndex] = useState(0)
  const [planIndex, setPlanIndex] = useState(0)

  const principal = toNumber(amountInput) * unitFactors[unitIndex]
  const annualRate = toNumber(rateInput)
  const years = Math.round(toNumber(yearsInput))
  const valid = principal > 0 && annualRate > 0 && years >= 1 && years <= 30

  let resultTitle = ''
  let tipText = ''
  let metricTexts: string[] = ['', '', '']
  if (valid) {
    if (planIndex === 0) {
      const r = calcMortgageEI(principal, annualRate, years)
      resultTitle = '计算结果（等额本息）'
      tipText = '月供按「等额本息」测算，四舍五入到分；实际放款以银行还款计划为准。'
      metricTexts = [`${formatMoney(r[0])} 元`, `${formatMoney(r[2])} 元`, `${formatMoney(r[1])} 元`]
    } else {
      const r = calcMortgageEP(principal, annualRate, years)
      const months = years * 12
      resultTitle = '计算结果（等额本金）'
      tipText = `首月月供 ${formatMoney(r[0])} 元，之后每月递减 ${formatMoney(r[1])} 元，共 ${months} 期；实际以银行还款计划为准。`
      metricTexts = [`首月 ${formatMoney(r[0])} 元`, `${formatMoney(r[3])} 元`, `${formatMoney(r[2])} 元`]
    }
  }

  return (
    <View className='page-with-menu'>
      <NavBar title='房贷计算' />
      <View className='container'>
        {/* 输入区 */}
        <View className='card'>
          <Text className='card-title'>贷款信息</Text>

          <View className='field-row'>
            <Text className='field-label'>贷款金额</Text>
            <Input
              className='input-box'
              type='digit'
              maxlength={9}
              placeholder='请输入贷款金额'
              value={amountInput}
              onInput={(event) => setAmountInput(sanitizeDecimal(String(event.detail.value ?? '')))}
            />
            <Picker
              className='pick-wrap'
              mode='selector'
              range={unitTexts}
              value={unitIndex}
              onChange={(event) => setUnitIndex(Number(event.detail.value))}
            >
              <View className='pick-box' hoverClass='pick-box-hover'>
                <Text className='pick-text'>{unitTexts[unitIndex]}</Text>
                <Text className='pick-arrow'>▾</Text>
              </View>
            </Picker>
          </View>
          <View className='field-row'>
            <Text className='field-label'>年利率</Text>
            <Input
              className='input-box'
              type='digit'
              maxlength={6}
              placeholder='如 3.85（%）'
              value={rateInput}
              onInput={(event) => setRateInput(sanitizeDecimal(String(event.detail.value ?? '')))}
            />
          </View>
          <View className='field-row'>
            <Text className='field-label'>贷款期限</Text>
            <Input
              className='input-box'
              type='number'
              maxlength={2}
              placeholder='请输入年数，如 30'
              value={yearsInput}
              onInput={(event) => setYearsInput(sanitizeInt(String(event.detail.value ?? '')))}
            />
          </View>
          <View className='field-row'>
            <Text className='field-label'>还款方式</Text>
            <Picker
              className='pick-wrap'
              mode='selector'
              range={planTexts}
              value={planIndex}
              onChange={(event) => setPlanIndex(Number(event.detail.value))}
            >
              <View className='pick-box' hoverClass='pick-box-hover'>
                <Text className='pick-text'>{planTexts[planIndex]}</Text>
                <Text className='pick-arrow'>▾</Text>
              </View>
            </Picker>
          </View>
          <Text className='tip-text'>贷款期限支持 1-30 年（整数）；利率按商业贷款年利率填写。</Text>
        </View>

        {/* 结果区 */}
        {valid && (
          <View className='card'>
            <Text className='card-title'>{resultTitle}</Text>

            <View className='metric-row'>
              <Text className='metric-label'>月供</Text>
              <Text className='metric-value metric-accent'>{metricTexts[0]}</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>支付总利息</Text>
              <Text className='metric-value'>{metricTexts[1]}</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>还款总额</Text>
              <Text className='metric-value'>{metricTexts[2]}</Text>
            </View>

            <Text className='tip-text'>{tipText}</Text>
          </View>
        )}
      </View>
      <AppMenu />
    </View>
  )
}

// 个税计算：按全年综合所得均摊到月，套用年度税率表

import { useState } from 'react'
import { Input, Text, View } from '@tarojs/components'

import PageWithMenu from '../../../components/page-with-menu'
import NavBar from '../../../components/nav-bar'
import { formatMoney, sanitizeDecimal, toNumber } from '../../../common/format'
import { calcIncomeTax } from './lib'

import './index.scss'

export default function IncomeTax() {
  const [salaryInput, setSalaryInput] = useState('')
  const [insuranceInput, setInsuranceInput] = useState('')
  const [extraInput, setExtraInput] = useState('')

  const salary = toNumber(salaryInput)
  const resultVisible = salary > 0
  const result = resultVisible ? calcIncomeTax(salary, toNumber(insuranceInput), toNumber(extraInput)) : null

  return (
    <PageWithMenu>
      <NavBar title='个税计算' />
      <View className='container'>
        {/* 输入区 */}
        <View className='card'>
          <Text className='card-title'>收入与扣除（每月）</Text>

          <View className='field-row'>
            <Text className='field-label'>税前月薪</Text>
            <Input
              className='input-box'
              type='digit'
              maxlength={9}
              placeholder='请输入税前月薪（元）'
              value={salaryInput}
              onInput={(event) => setSalaryInput(sanitizeDecimal(String(event.detail.value ?? '')))}
            />
          </View>
          <View className='field-row'>
            <Text className='field-label'>五险一金</Text>
            <Input
              className='input-box'
              type='digit'
              maxlength={8}
              placeholder='个人缴纳部分（元），选填'
              value={insuranceInput}
              onInput={(event) => setInsuranceInput(sanitizeDecimal(String(event.detail.value ?? '')))}
            />
          </View>
          <View className='field-row'>
            <Text className='field-label'>专项附加</Text>
            <Input
              className='input-box'
              type='digit'
              maxlength={8}
              placeholder='房租/子女教育等合计（元），选填'
              value={extraInput}
              onInput={(event) => setExtraInput(sanitizeDecimal(String(event.detail.value ?? '')))}
            />
          </View>
          <Text className='tip-text'>起征点按每月 5000 元扣除；三险一金、专项附加扣除按当月合计金额填写。</Text>
        </View>

        {/* 结果区 */}
        {result != null && (
          <View className='card'>
            <Text className='card-title'>计算结果</Text>

            <View className='metric-row'>
              <Text className='metric-label'>月应纳税所得额</Text>
              <Text className='metric-value'>{formatMoney(result.monthTaxable)} 元</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>年应纳税所得额</Text>
              <Text className='metric-value'>{formatMoney(result.annualTaxable)} 元</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>适用税率</Text>
              <Text className='metric-value'>
                {result.ratePct === 0 ? '免税（未达起征点）' : `${result.ratePct}%`}
              </Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>速算扣除数（月）</Text>
              <Text className='metric-value'>{formatMoney(result.monthQuick)} 元</Text>
            </View>

            <View className='metric-row'>
              <Text className='metric-label'>月应缴个税</Text>
              <Text className='metric-value metric-accent'>
                {result.monthTax <= 0 ? '0.00 元' : `${formatMoney(result.monthTax)} 元`}
              </Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>税后月收入</Text>
              <Text className='metric-value'>{formatMoney(result.netMonthly)} 元</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>年应缴个税合计</Text>
              <Text className='metric-value'>{formatMoney(result.annualTax)} 元</Text>
            </View>

            <Text className='tip-text'>
              按全年综合所得均摊测算；实际发薪由单位按「累计预扣预缴法」申报，结果会有细微差异。
            </Text>
          </View>
        )}
      </View>
    </PageWithMenu>
  )
}

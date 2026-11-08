// 退休金：按计发基数 / 缴费指数 / 缴费年限 / 个人账户估算月养老金

import { useState } from 'react'
import { Input, Picker, Text, View } from '@tarojs/components'

import AppMenu from '../../../components/app-menu'
import { formatMoney, sanitizeDecimal, toNumber } from '../../../common/format'
import { AGE_NAMES, AGE_OPTIONS, calcPension } from './lib'

import './index.scss'

export default function Pension() {
  const [baseInput, setBaseInput] = useState('')
  const [indexInput, setIndexInput] = useState('')
  const [yearsInput, setYearsInput] = useState('')
  const [ageIndex, setAgeIndex] = useState(2)
  const [accountInput, setAccountInput] = useState('')

  const base = toNumber(baseInput)
  const years = toNumber(yearsInput)
  const account = toNumber(accountInput)
  // 缴费指数据实输入后钳制在 0.4 ~ 3（低于下限的按下限估）
  let idx = toNumber(indexInput)
  if (idx < 0.4) {
    idx = 0.4
  }
  if (idx > 3) {
    idx = 3
  }
  const filled = indexInput !== '' && yearsInput !== '' && accountInput !== ''
  const visible = base > 0 && years > 0 && account > 0 && filled
  const result = visible ? calcPension(base, idx, years, AGE_OPTIONS[ageIndex], account) : null

  return (
    <View className='page-with-menu'>
      <View className='container'>
        <View className='card'>
          <Text className='card-title'>参保信息</Text>
          <View className='field-row'>
            <Text className='field-label'>计发基数</Text>
            <Input
              className='input-box'
              type='digit'
              placeholder='当地计发基数，如 8000（元/月）'
              value={baseInput}
              onInput={(event) => setBaseInput(sanitizeDecimal(String(event.detail.value ?? '')))}
            />
          </View>
          <View className='field-row'>
            <Text className='field-label'>平均缴费指数</Text>
            <Input
              className='input-box'
              type='digit'
              placeholder='通常 0.6~3，如 1.0'
              value={indexInput}
              onInput={(event) => setIndexInput(sanitizeDecimal(String(event.detail.value ?? '')))}
            />
          </View>
          <View className='field-row'>
            <Text className='field-label'>累计缴费年限</Text>
            <Input
              className='input-box'
              type='digit'
              placeholder='含视同缴费，如 30（年）'
              value={yearsInput}
              onInput={(event) => setYearsInput(sanitizeDecimal(String(event.detail.value ?? '')))}
            />
          </View>
          <View className='field-row'>
            <Text className='field-label'>退休年龄</Text>
            <Picker
              className='pick-wrap'
              mode='selector'
              range={AGE_NAMES}
              value={ageIndex}
              onChange={(event) => setAgeIndex(Number(event.detail.value))}
            >
              <View className='pick-box' hoverClass='pick-box-hover'>
                <Text className='pick-text'>{AGE_NAMES[ageIndex]}</Text>
                <Text className='pick-arrow'>▾</Text>
              </View>
            </Picker>
          </View>
          <View className='field-row'>
            <Text className='field-label'>个人账户储存额</Text>
            <Input
              className='input-box'
              type='digit'
              placeholder='如 100000（元）'
              value={accountInput}
              onInput={(event) => setAccountInput(sanitizeDecimal(String(event.detail.value ?? '')))}
            />
          </View>
        </View>

        {result != null && (
          <View className='card'>
            <Text className='card-title'>预估结果（每月）</Text>
            <View className='metric-row'>
              <Text className='metric-label'>基础养老金</Text>
              <Text className='metric-value'>¥ {formatMoney(result.basePension)}</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>个人账户养老金</Text>
              <Text className='metric-value'>¥ {formatMoney(result.personalPension)}</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>计发月数</Text>
              <Text className='metric-value'>{result.months} 个月</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>预估月养老金</Text>
              <Text className='metric-value accent'>¥ {formatMoney(result.totalPension)}</Text>
            </View>
          </View>
        )}

        <Text className='tip-text page-tip'>
          按现行基本养老金计发办法估算（不含过渡性养老金及地方性调整/高龄补贴），计发基数请填退休当年参保地标准；指数按
          0.4~3 钳制计算。结果仅供参考。
        </Text>
      </View>
      <AppMenu />
    </View>
  )
}

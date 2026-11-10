// 退休年龄：按出生年月与身份测算渐进式延迟后的法定退休年龄

import { useState } from 'react'
import { Input, Text, View } from '@tarojs/components'

import PageWithMenu from '../../../components/page-with-menu'
import Picker from '../../../components/picker'
import NavBar from '../../../components/nav-bar'
import { sanitizeInt } from '../../../common/format'
import { GROUP_NAMES, MONTH_NAMES, calcRetirement } from './lib'

import './index.scss'

export default function RetirementAge() {
  const [yearInput, setYearInput] = useState('')
  const [monthIndex, setMonthIndex] = useState(0)
  const [groupIndex, setGroupIndex] = useState(0)

  const year = parseInt(yearInput)
  const visible = yearInput.length >= 4 && isFinite(year) && year >= 1940 && year <= 2010
  const result = visible ? calcRetirement(year, monthIndex + 1, groupIndex) : null

  return (
    <PageWithMenu>
      <NavBar title='退休年龄' />
      <View className='container'>
        <View className='card'>
          <Text className='card-title'>出生信息</Text>
          <View className='field-row'>
            <Text className='field-label'>出生年份</Text>
            <Input
              className='input-box'
              type='number'
              maxlength={4}
              placeholder='如 1975'
              value={yearInput}
              onInput={(event) => setYearInput(sanitizeInt(String(event.detail.value ?? '')))}
            />
          </View>
          <View className='field-row'>
            <Text className='field-label'>出生月份</Text>
            <Picker
              mode='selector'
              range={MONTH_NAMES}
              value={monthIndex}
              onChange={(event) => setMonthIndex(Number(event.detail.value))}
            >
              <View className='pick-box' hoverClass='pick-box-hover'>
                <Text className='pick-text'>{MONTH_NAMES[monthIndex]}</Text>
                <Text className='pick-arrow'>▾</Text>
              </View>
            </Picker>
          </View>
          <View className='field-row'>
            <Text className='field-label'>人员身份</Text>
            <Picker
              mode='selector'
              range={GROUP_NAMES}
              value={groupIndex}
              onChange={(event) => setGroupIndex(Number(event.detail.value))}
            >
              <View className='pick-box' hoverClass='pick-box-hover'>
                <Text className='pick-text'>{GROUP_NAMES[groupIndex]}</Text>
                <Text className='pick-arrow'>▾</Text>
              </View>
            </Picker>
          </View>
        </View>

        {result != null && (
          <View className='card'>
            <Text className='card-title'>测算结果</Text>
            <View className='metric-row'>
              <Text className='metric-label'>原法定退休年龄</Text>
              <Text className='metric-value'>{result.originalAge} 岁</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>延迟月数</Text>
              <Text className='metric-value'>{result.delayMonths} 个月</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>新法定退休年龄</Text>
              <Text className='metric-value accent'>{result.newAgeText}</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>法定退休时间</Text>
              <Text className='metric-value'>
                {result.retireYear} 年 {result.retireMonth} 月
              </Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>最低缴费年限</Text>
              <Text className='metric-value'>{result.minYearsText}</Text>
            </View>
          </View>
        )}

        <Text className='tip-text page-tip'>
          按《实施渐进式延迟法定退休年龄的决定》测算：2025 年 1 月起男职工原 60 岁每 4 个月延迟 1 个月至 63；女 55
          岁档同规则至 58；女 50 岁档每 2 个月延迟 1 个月至 55。灵活就业、特殊工种及提前退休另有规定，结果仅供参考。
        </Text>
      </View>
    </PageWithMenu>
  )
}

// 基础代谢：按 Mifflin-St Jeor 公式估算 BMR 与各活动水平下的 TDEE

import { useEffect, useState } from 'react'
import { Input, Text, View } from '@tarojs/components'

import PageWithMenu from '../../../components/page-with-menu'
import Picker from '../../../components/picker'
import NavBar from '../../../components/nav-bar'
import { formatFixed, sanitizeDecimal, sanitizeInt } from '../../../common/format'
import {
  BMR_ACTIVITIES,
  BMR_GENDERS,
  activityIndexOf,
  calculateBmr,
  genderIndexOf,
  loadBmrDraft,
  saveBmrDraft
} from './lib'

import './index.scss'

const genderLabels: string[] = BMR_GENDERS.map((item) => item.label)
const activityLabels: string[] = BMR_ACTIVITIES.map((item) => item.label)

/** 空串按 -1 处理，交给 calculateBmr 判为不合法 */
function parseInput(text: string): number {
  if (text === '') {
    return -1
  }
  return parseFloat(text)
}

export default function Bmr() {
  const draft = loadBmrDraft()
  const [genderIndex, setGenderIndex] = useState(() => genderIndexOf(draft.genderCode))
  const [activityIndex, setActivityIndex] = useState(() => activityIndexOf(draft.activityCode))
  const [ageInput, setAgeInput] = useState(() => draft.ageText)
  const [heightInput, setHeightInput] = useState(() => draft.heightText)
  const [weightInput, setWeightInput] = useState(() => draft.weightText)

  // 每次改动都存一份，下次打开直接回显
  useEffect(() => {
    saveBmrDraft({
      genderCode: BMR_GENDERS[genderIndex].code,
      ageText: ageInput,
      heightText: heightInput,
      weightText: weightInput,
      activityCode: BMR_ACTIVITIES[activityIndex].code
    })
  }, [genderIndex, activityIndex, ageInput, heightInput, weightInput])

  const result = calculateBmr(
    BMR_GENDERS[genderIndex].code,
    parseInput(ageInput),
    parseInput(heightInput),
    parseInput(weightInput),
    BMR_ACTIVITIES[activityIndex].code
  )

  return (
    <PageWithMenu>
      <NavBar title='基础代谢' />
      <View className='container'>
        <View className='card'>
          <Text className='card-title'>身体信息</Text>
          <View className='field-row'>
            <Text className='field-label'>性别</Text>
            <View className='segments'>
              {genderLabels.map((label, index) => (
                <View
                  className={index === genderIndex ? 'segment segment-active' : 'segment'}
                  key={label}
                  hoverClass='segment-hover'
                  onClick={() => setGenderIndex(index)}
                >
                  <Text className={index === genderIndex ? 'segment-text segment-text-active' : 'segment-text'}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <View className='field-row'>
            <Text className='field-label'>年龄</Text>
            <Input
              className='input-box'
              type='number'
              placeholder='30（岁）'
              value={ageInput}
              onInput={(event) => setAgeInput(sanitizeInt(String(event.detail.value ?? '')))}
            />
            <Text className='unit-suffix'>岁</Text>
          </View>
          <View className='field-row'>
            <Text className='field-label'>身高</Text>
            <Input
              className='input-box'
              type='digit'
              placeholder='175（厘米）'
              value={heightInput}
              onInput={(event) => setHeightInput(sanitizeDecimal(String(event.detail.value ?? '')))}
            />
            <Text className='unit-suffix'>cm</Text>
          </View>
          <View className='field-row'>
            <Text className='field-label'>体重</Text>
            <Input
              className='input-box'
              type='digit'
              placeholder='70（千克）'
              value={weightInput}
              onInput={(event) => setWeightInput(sanitizeDecimal(String(event.detail.value ?? '')))}
            />
            <Text className='unit-suffix'>kg</Text>
          </View>
          <View className='field-row'>
            <Text className='field-label'>活动</Text>
            <Picker
              className='pick-box'
              mode='selector'
              range={activityLabels}
              value={activityIndex}
              onChange={(event) => setActivityIndex(Number(event.detail.value))}
            >
              <View className='pick-inner' hoverClass='pick-box-hover'>
                <Text className='pick-text'>{activityLabels[activityIndex]}</Text>
                <Text className='pick-arrow'>▾</Text>
              </View>
            </Picker>
          </View>
          <Text className='hint-text'>身高填 1.75 也可（小于 3 按米理解）；年龄按整岁计算。</Text>
        </View>

        {result != null ? (
          <View>
            <View className='card'>
              <Text className='card-title'>计算结果</Text>
              <View className='metric-row'>
                <Text className='metric-label'>基础代谢 BMR</Text>
                <Text className='metric-value'>{formatFixed(result.bmr, 1)} 千卡 / 天</Text>
              </View>
              <View className='metric-row'>
                <Text className='metric-label'>每日总消耗 TDEE</Text>
                <Text className='metric-value metric-accent'>{formatFixed(result.tdee, 1)} 千卡 / 天</Text>
              </View>
              <View className='metric-row'>
                <Text className='metric-label'>活动消耗</Text>
                <Text className='metric-value'>{formatFixed(result.activityCalories, 1)} 千卡 / 天</Text>
              </View>
            </View>

            <View className='card'>
              <Text className='card-title'>不同活动水平</Text>
              {BMR_ACTIVITIES.map((activity, index) => (
                <View className='tdee-row' key={activity.code}>
                  <Text className={index === activityIndex ? 'tdee-label tdee-active' : 'tdee-label'}>
                    {activity.label}
                  </Text>
                  <Text className={index === activityIndex ? 'tdee-value tdee-active' : 'tdee-value'}>
                    {formatFixed(result.tdeeByActivity[index], 1)} 千卡
                  </Text>
                </View>
              ))}
              <Text className='hint-text'>计算公式：Mifflin-St Jeor，结果为估算值，仅供参考。</Text>
            </View>
          </View>
        ) : (
          <View className='card'>
            <Text className='empty-text'>填完性别、年龄、身高、体重后显示结果</Text>
          </View>
        )}
      </View>
    </PageWithMenu>
  )
}

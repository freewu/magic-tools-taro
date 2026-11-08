// 设置页：BMI 计算的默认单位

import { useState } from 'react'
import { Picker, Text, View } from '@tarojs/components'

import {
  lengthUnitTexts,
  lengthUnitValues,
  unitValueIndex,
  weightUnitTexts,
  weightUnitValues
} from '../app/bmi/data'
import { getDefaultLengthUnit, getDefaultWeightUnit, setDefaultLengthUnit, setDefaultWeightUnit } from '../app/bmi/lib'

import './index.scss'

export default function Settings() {
  const [weightUnitIndex, setWeightUnitIndex] = useState(() =>
    unitValueIndex(weightUnitValues, getDefaultWeightUnit())
  )
  const [lengthUnitIndex, setLengthUnitIndex] = useState(() =>
    unitValueIndex(lengthUnitValues, getDefaultLengthUnit())
  )

  const onWeightUnitChange = (event) => {
    const index = Number(event.detail.value)
    setWeightUnitIndex(index)
    setDefaultWeightUnit(weightUnitValues[index])
  }

  const onLengthUnitChange = (event) => {
    const index = Number(event.detail.value)
    setLengthUnitIndex(index)
    setDefaultLengthUnit(lengthUnitValues[index])
  }

  return (
    <View className='page'>
      <View className='container'>
        {/* BMI 计算默认单位 */}
        <View className='card'>
          <Text className='card-title'>BMI 计算默认单位</Text>
          <View className='field-row'>
            <Text className='field-label'>默认体重单位</Text>
            <Picker
              mode='selector'
              range={weightUnitTexts}
              value={weightUnitIndex}
              onChange={onWeightUnitChange}
            >
              <View className='picker-box'>
                <Text className='picker-text'>{weightUnitTexts[weightUnitIndex]}</Text>
                <Text className='picker-arrow'>▾</Text>
              </View>
            </Picker>
          </View>
          <View className='field-row'>
            <Text className='field-label'>默认身高单位</Text>
            <Picker
              mode='selector'
              range={lengthUnitTexts}
              value={lengthUnitIndex}
              onChange={onLengthUnitChange}
            >
              <View className='picker-box'>
                <Text className='picker-text'>{lengthUnitTexts[lengthUnitIndex]}</Text>
                <Text className='picker-arrow'>▾</Text>
              </View>
            </Picker>
          </View>
          <Text className='field-tip'>打开“BMI 计算”时会自动使用这里选择的默认单位</Text>
        </View>
      </View>
    </View>
  )
}

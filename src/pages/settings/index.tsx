// 设置页：BMI 默认单位 + 单位换算偏好

import { useState } from 'react'
import { Switch, Text, View } from '@tarojs/components'

import Picker from '../../components/picker'
import {
  lengthUnitTexts,
  lengthUnitValues,
  unitValueIndex,
  weightUnitTexts,
  weightUnitValues
} from '../app/bmi/data'
import { getDefaultLengthUnit, getDefaultWeightUnit, setDefaultLengthUnit, setDefaultWeightUnit } from '../app/bmi/lib'
import { type ConvertPrefs, loadPrefs, savePrefs } from '../app/convert/prefs'
import {
  type ConvertBlock,
  buildBlocks,
  setBlockSystem,
  setBlockTabSystem,
  setBlockUnit
} from '../app/convert/blocks'

import NavBar from '../../components/nav-bar'

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

  // ---- 单位换算：显示常见参照物 + 每种换算类型各自的默认体系 / 单位 / 结果体系 ----

  // prefs 就地修改（与源项目一致），改完 savePrefs + 重建 blocks 即可
  const [prefs] = useState<ConvertPrefs>(() => loadPrefs())
  const [showSamples, setShowSamples] = useState(() => prefs.showSamples)
  const [blocks, setBlocks] = useState<ConvertBlock[]>(() => buildBlocks(prefs))

  const afterEdit = (ok: boolean) => {
    if (!ok) {
      return
    }
    savePrefs(prefs)
    setBlocks(buildBlocks(prefs))
  }

  const onShowSamplesChange = (event) => {
    const checked = Boolean(event.detail.value)
    prefs.showSamples = checked
    setShowSamples(checked)
    savePrefs(prefs)
  }

  return (
    <View className='page'>
      <NavBar title='设置' back={false} />
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

        {/* 单位换算：每种换算类型各占一块，全部展开 */}
        <View className='card'>
          <Text className='card-title'>单位换算</Text>
          <View className='field-row'>
            <Text className='field-label'>显示常见参照物</Text>
            <Switch checked={showSamples} color='#007AFF' onChange={onShowSamplesChange} />
          </View>

          {blocks.map((block, index) => (
            <View className='block' key={block.catalogId}>
              <Text className='block-title'>{block.title}</Text>
              {block.systems.length > 1 && (
                <View className='field-row'>
                  <Text className='field-label'>默认展示体系</Text>
                  <Picker
                    mode='selector'
                    range={block.systems}
                    value={block.systemIndex}
                    onChange={(event) => afterEdit(setBlockSystem(prefs, index, Number(event.detail.value)))}
                  >
                    <View className='picker-box'>
                      <Text className='picker-text'>{block.systems[block.systemIndex]}</Text>
                      <Text className='picker-arrow'>▾</Text>
                    </View>
                  </Picker>
                </View>
              )}
              <View className='field-row'>
                <Text className='field-label'>默认展示单位</Text>
                <Picker
                  mode='selector'
                  range={block.units}
                  value={block.unitIndex}
                  onChange={(event) => afterEdit(setBlockUnit(prefs, index, Number(event.detail.value)))}
                >
                  <View className='picker-box'>
                    <Text className='picker-text'>{block.units[block.unitIndex]}</Text>
                    <Text className='picker-arrow'>▾</Text>
                  </View>
                </Picker>
              </View>
              {block.systems.length > 1 && (
                <View className='field-row'>
                  <Text className='field-label'>默认换算结果体系</Text>
                  <Picker
                    mode='selector'
                    range={block.systems}
                    value={block.tabIndex}
                    onChange={(event) => afterEdit(setBlockTabSystem(prefs, index, Number(event.detail.value)))}
                  >
                    <View className='picker-box'>
                      <Text className='picker-text'>{block.systems[block.tabIndex]}</Text>
                      <Text className='picker-arrow'>▾</Text>
                    </View>
                  </Picker>
                </View>
              )}
            </View>
          ))}

          <Text className='field-tip'>
            每种换算类型单独保存默认体系与单位，打开对应页面时按其初始化；“显示常见参照物”关闭后所有换算页都不再显示常见参照物卡片
          </Text>
        </View>
      </View>
    </View>
  )
}

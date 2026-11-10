// BMI 计算：身高 / 体重输入（单位可切换）+ 分级刻度条 + 建议

import { useEffect, useMemo, useRef, useState } from 'react'
import { Input, Text, View } from '@tarojs/components'

import PageWithMenu from '../../../components/page-with-menu'
import Picker from '../../../components/picker'
import NavBar from '../../../components/nav-bar'
import { formatFixed, sanitizeDecimal } from '../../../common/format'
import {
  lengthUnitShortTexts,
  lengthUnitTexts,
  lengthUnitValues,
  unitValueIndex,
  weightUnitShortTexts,
  weightUnitTexts,
  weightUnitValues,
  weightUnitShortName
} from './data'
import {
  bmiDraftText,
  bmiGaugeLabels,
  bmiGaugeSegments,
  bmiLevelOf,
  calcStandardValue,
  fromKilograms,
  fromMeters,
  gaugePercent,
  idealWeightKg,
  loadBmiDraft,
  saveBmiDraft,
  toKilograms,
  toMeters,
  type BmiDraft
} from './lib'

import './index.scss'

const gaugeSegments = bmiGaugeSegments()
const gaugeLabels = bmiGaugeLabels()

export default function Bmi() {
  const [draft] = useState<BmiDraft>(() => loadBmiDraft())
  const [lengthInput, setLengthInput] = useState(draft.lengthInput)
  const [weightInput, setWeightInput] = useState(draft.weightInput)
  const [lengthUnitIndex, setLengthUnitIndex] = useState(() => unitValueIndex(lengthUnitValues, draft.lengthUnit))
  const [weightUnitIndex, setWeightUnitIndex] = useState(() => unitValueIndex(weightUnitValues, draft.weightUnit))

  // 已写入存储的草稿文本，避免每次输入都重复写
  const savedDraftText = useRef(bmiDraftText(draft))

  // 输入变化即写入草稿（内容没变就不写）
  useEffect(() => {
    const current: BmiDraft = {
      lengthInput,
      weightInput,
      lengthUnit: lengthUnitValues[lengthUnitIndex],
      weightUnit: weightUnitValues[weightUnitIndex]
    }
    const text = bmiDraftText(current)
    if (text === savedDraftText.current) {
      return
    }
    savedDraftText.current = text
    saveBmiDraft(current)
  }, [lengthInput, weightInput, lengthUnitIndex, weightUnitIndex])

  const result = useMemo(() => {
    if (weightInput === '' || lengthInput === '') {
      return null
    }
    const weight = parseFloat(weightInput)
    const length = parseFloat(lengthInput)
    if (!(weight > 0) || !(length > 0)) {
      return null
    }
    const weightUnit = weightUnitValues[weightUnitIndex]
    const lengthUnit = lengthUnitValues[lengthUnitIndex]
    const weightKg = toKilograms(weight, weightUnit)
    const lengthM = toMeters(length, lengthUnit)
    if (weightKg <= 0 || lengthM <= 0) {
      return null
    }
    const bmi = weightKg / (lengthM * lengthM)
    if (!(bmi >= 10 && bmi <= 50)) {
      return null
    }

    const level = bmiLevelOf(bmi)
    const shortName = weightUnitShortName(weightUnit)
    const standard = calcStandardValue(lengthM, weightUnit)

    // 距理想体重（BMI 21 对应的体重），按当前体重单位展示
    const ideal = fromKilograms(idealWeightKg(lengthM), weightUnit)
    const delta = ideal - weight
    let deltaIcon = '↓'
    let deltaText = ''
    if (Math.abs(delta) < 0.05) {
      deltaIcon = '✓'
      deltaText = '已在理想体重'
    } else if (delta > 0) {
      deltaIcon = '↑'
      deltaText = `增重 ${delta.toFixed(1)} ${shortName}`
    } else {
      deltaText = `减重 ${(-delta).toFixed(1)} ${shortName}`
    }

    return {
      bmiText: bmi.toFixed(1),
      level,
      markerPercent: gaugePercent(bmi),
      summaryText: `身高 ${lengthInput} ${lengthUnit} · 体重 ${weightInput} ${shortName}`,
      rangeText: `${standard[0]} ~ ${standard[1]} ${shortName}`,
      deltaIcon,
      deltaText
    }
  }, [lengthInput, weightInput, lengthUnitIndex, weightUnitIndex])

  const onLengthInput = (event) => {
    setLengthInput(sanitizeDecimal(String(event.detail.value ?? '')))
  }

  const onWeightInput = (event) => {
    setWeightInput(sanitizeDecimal(String(event.detail.value ?? '')))
  }

  // 切换单位：按新旧单位换算当前数值，BMI 结果保持不变
  const onWeightUnitChange = (event) => {
    const index = Number(event.detail.value)
    if (index === weightUnitIndex) {
      return
    }
    const value = parseFloat(weightInput)
    if (weightInput !== '' && isFinite(value) && value > 0) {
      const kg = toKilograms(value, weightUnitValues[weightUnitIndex])
      if (kg > 0) {
        setWeightInput(formatFixed(fromKilograms(kg, weightUnitValues[index]), 2))
      }
    }
    setWeightUnitIndex(index)
  }

  const onLengthUnitChange = (event) => {
    const index = Number(event.detail.value)
    if (index === lengthUnitIndex) {
      return
    }
    const value = parseFloat(lengthInput)
    if (lengthInput !== '' && isFinite(value) && value > 0) {
      const meters = toMeters(value, lengthUnitValues[lengthUnitIndex])
      if (meters > 0) {
        setLengthInput(formatFixed(fromMeters(meters, lengthUnitValues[index]), 2))
      }
    }
    setLengthUnitIndex(index)
  }

  return (
    <PageWithMenu>
      <NavBar title='BMI 计算' />
      <View className='container'>
        {/* 输入：身高 / 体重并排，右侧单位可切换 */}
        <View className='card'>
          <View className='field-row'>
            <View className='field'>
              <Text className='field-label'>身高</Text>
              <View className='field-box'>
                <Input
                  className='field-input'
                  type='digit'
                  maxlength={6}
                  placeholder='170'
                  value={lengthInput}
                  onInput={onLengthInput}
                />
                <Picker
                  mode='selector'
                  range={lengthUnitTexts}
                  value={lengthUnitIndex}
                  onChange={onLengthUnitChange}
                >
                  <View className='unit-chip' hoverClass='unit-chip-hover'>
                    <Text className='unit-text'>{lengthUnitShortTexts[lengthUnitIndex]}</Text>
                    <Text className='unit-arrow'>▾</Text>
                  </View>
                </Picker>
              </View>
            </View>
            <View className='field field-gap'>
              <Text className='field-label'>体重</Text>
              <View className='field-box'>
                <Input
                  className='field-input'
                  type='digit'
                  maxlength={6}
                  placeholder='65'
                  value={weightInput}
                  onInput={onWeightInput}
                />
                <Picker
                  mode='selector'
                  range={weightUnitTexts}
                  value={weightUnitIndex}
                  onChange={onWeightUnitChange}
                >
                  <View className='unit-chip' hoverClass='unit-chip-hover'>
                    <Text className='unit-text'>{weightUnitShortTexts[weightUnitIndex]}</Text>
                    <Text className='unit-arrow'>▾</Text>
                  </View>
                </Picker>
              </View>
            </View>
          </View>
          <Text className='hint-text'>
            身高可填 1.7（按米理解）；切换单位会自动换算，结果不变；本次输入会自动记住。
          </Text>
        </View>

        {/* 结果 */}
        <View className='card'>
          {result == null ? (
            <View className='empty'>
              <Text className='empty-icon'>⚖️</Text>
              <Text className='empty-text'>输入身高与体重后自动计算</Text>
            </View>
          ) : (
            <View>
              {/* 数值 + 分级胶囊 */}
              <View className='result-head'>
                <Text className='result-label'>BMI</Text>
                <Text className='result-value'>{result.bmiText}</Text>
                <View
                  className='level-chip'
                  style={{ backgroundColor: result.level.tint, borderColor: result.level.border }}
                >
                  <Text className='level-chip-text' style={{ color: result.level.color }}>
                    {result.level.text}
                  </Text>
                </View>
              </View>
              <Text className='result-summary'>{result.summaryText}</Text>

              {/* 刻度条：14~34 四段 + 当前位置游标 + 边界标注 + 图例 */}
              <View className='gauge'>
                <View className='gauge-track'>
                  <View className='gauge-bar'>
                    {gaugeSegments.map((seg) => (
                      <View
                        className='gauge-seg'
                        key={seg.label}
                        style={{ width: `${seg.width}%`, backgroundColor: seg.color }}
                      />
                    ))}
                    <View className='gauge-marker' style={{ left: `${result.markerPercent}%` }} />
                  </View>
                  <Text className='gauge-arrow' style={{ left: `${result.markerPercent}%` }}>
                    ▼
                  </Text>
                </View>
                <View className='gauge-scale'>
                  {gaugeSegments.map((seg) => (
                    <View className='scale-item' key={seg.label} style={{ width: `${seg.width}%` }}>
                      <Text className='scale-text'>{gaugeLabels[gaugeSegments.indexOf(seg)]}</Text>
                    </View>
                  ))}
                </View>
                <View className='gauge-legend'>
                  {gaugeSegments.map((seg) => (
                    <View className='legend-item' key={seg.label}>
                      <View className='legend-dot' style={{ backgroundColor: seg.color }} />
                      <Text className='legend-text'>{seg.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 正常体重范围 / 距理想体重 */}
              <View className='stat-row'>
                <Text className='stat-icon' style={{ color: '#07C160' }}>
                  ✓
                </Text>
                <Text className='stat-label'>正常体重范围</Text>
                <Text className='stat-value' style={{ color: '#07C160' }}>
                  {result.rangeText}
                </Text>
              </View>
              <View className='stat-row'>
                <Text className='stat-icon' style={{ color: result.level.color }}>
                  {result.deltaIcon}
                </Text>
                <Text className='stat-label'>距理想体重</Text>
                <Text className='stat-value'>{result.deltaText}</Text>
              </View>

              {/* 分级建议 */}
              <View className='advice' style={{ backgroundColor: result.level.tint }}>
                <View className='advice-bar' style={{ backgroundColor: result.level.color }} />
                <Text className='advice-text'>{result.level.advice}</Text>
              </View>

              <Text className='disclaimer'>
                分级依据：中国成人 BMI 标准（WS/T 428—2013）。结果仅供健康参考，不构成医疗建议。
              </Text>
            </View>
          )}
        </View>
      </View>
    </PageWithMenu>
  )
}

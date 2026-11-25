// 保质期计算：生产日期 + 保质期时长 → 到期日、剩余天数与已过进度

import { useEffect, useMemo, useState } from 'react'
import { Input, Text, View } from '@tarojs/components'

import PageWithMenu from '../../../components/page-with-menu'
import NavBar from '../../../components/nav-bar'
import Picker from '../../../components/picker'
import {
  SHELF_PRESETS,
  SHELF_UNITS,
  dateText,
  dayNumber,
  loadShelfDraft,
  parseDateText,
  saveShelfDraft,
  shelfLifeOf,
  statusColors,
  todayParts,
  weekdayOfDayNumber,
  weekdayText
} from './lib'
import type { ShelfPreset } from './lib'

import './index.scss'

const TIPS: string[] = [
  '· 到期日 = 生产日期 + 保质期时长，按「到期日当天仍在保质期内」理解，次日才算过期。',
  '· 天 / 周直接累加天数；月 / 年按日历顺延，月末自动回退（1 月 31 日 + 1 个月 = 2 月 28 日，闰年为 29 日）。',
  '· 剩余天数按本机今天的日期计算，「临近到期」为剩余不足 20% 或 3 天。',
  '· 表里标注的保质期通常是未开封、按规定条件贮存（常温 / 冷藏 / 冷冻）下的期限，开封后请以包装说明为准。'
]

/** 时长输入框 → 数字（只认纯数字，空或非法当 0，交给校验提示） */
function spanValueOf(text: string): number {
  const trimmed = text.trim()
  if (trimmed === '') {
    return 0
  }
  let value = 0
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i)
    if (code < 48 || code > 57) {
      return 0
    }
    value = value * 10 + (code - 48)
  }
  return value
}

function weekdayOfDateText(text: string): string {
  const parts = parseDateText(text)
  if (parts.length !== 3) {
    return ''
  }
  return weekdayText(weekdayOfDayNumber(dayNumber(parts[0], parts[1], parts[2])))
}

export default function ShelfLife() {
  const today = todayParts()
  const draft = loadShelfDraft(today)
  const [production, setProduction] = useState(() => draft.production)
  const [valueText, setValueText] = useState(() => draft.valueText)
  const [unitCode, setUnitCode] = useState(() => draft.unit)

  // 每次改动都存一份，下次打开直接回显
  useEffect(() => {
    saveShelfDraft({ production, valueText, unit: unitCode })
  }, [production, valueText, unitCode])

  const productionWeekday = useMemo(() => weekdayOfDateText(production), [production])
  const result = useMemo(
    () => shelfLifeOf(parseDateText(production), spanValueOf(valueText), unitCode, today),
    // today 是本次渲染时取的本机日期，不随渲染变化
    [production, valueText, unitCode]
  )

  const colors = statusColors(result.status)
  const metrics = result.valid
    ? [
        { label: '生产日期', value: result.productionText },
        { label: '保质期', value: result.spanText },
        { label: '总天数', value: `${result.totalDays} 天` },
        { label: '已过', value: `${result.usedDays} 天（${result.progressText}）` },
        {
          label: '剩余',
          value: result.remainDays < 0 ? `已过期 ${-result.remainDays} 天` : `${result.remainDays} 天`
        }
      ]
    : []

  const pickPreset = (preset: ShelfPreset) => {
    setValueText(`${preset.value}`)
    setUnitCode(preset.unit)
  }

  const isPresetActive = (preset: ShelfPreset) =>
    preset.unit === unitCode && `${preset.value}` === valueText.trim()

  return (
    <PageWithMenu>
      <NavBar title='保质期计算' />
      <View className='container'>
        <View className='card'>
          <View className='card-head'>
            <Text className='card-title'>生产日期</Text>
            <Text
              className='head-action'
              onClick={() => setProduction(dateText(today[0], today[1], today[2]))}
            >
              今天
            </Text>
          </View>
          <View className='field-row'>
            <Picker mode='date' value={production} onChange={(event) => setProduction(String(event.detail.value))}>
              <View className='pick-box' hoverClass='pick-box-hover'>
                <Text className='pick-text'>{production}</Text>
                <Text className='pick-arrow'>▾</Text>
              </View>
            </Picker>
            <Text className='pick-note'>{productionWeekday}</Text>
          </View>

          <View className='field-row field-gap'>
            <Text className='field-label'>保质期</Text>
            <Input
              className='value-input'
              type='number'
              maxlength={4}
              placeholder='如 12'
              value={valueText}
              onInput={(event) => setValueText(String(event.detail.value ?? ''))}
            />
            <View className='unit-wrap'>
              {SHELF_UNITS.map((unit) => (
                <View
                  className={unit.code === unitCode ? 'unit-chip unit-chip-active' : 'unit-chip'}
                  key={unit.code}
                  hoverClass='chip-hover'
                  onClick={() => setUnitCode(unit.code)}
                >
                  <Text className={unit.code === unitCode ? 'unit-text unit-text-active' : 'unit-text'}>
                    {unit.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Text className='hint-text'>常用保质期，点一下直接代入：</Text>
          <View className='chip-wrap'>
            {SHELF_PRESETS.map((preset) => (
              <View
                className={isPresetActive(preset) ? 'preset-chip preset-chip-active' : 'preset-chip'}
                key={`${preset.value}-${preset.unit}`}
                hoverClass='chip-hover'
                onClick={() => pickPreset(preset)}
              >
                <Text className={isPresetActive(preset) ? 'preset-text preset-text-active' : 'preset-text'}>
                  {preset.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {result.valid ? (
          <View className='card'>
            <View className='result-head'>
              <View className='result-left'>
                <Text className='result-label'>到期日</Text>
                <Text className='result-date'>{result.endText}</Text>
                <Text className='result-weekday'>{result.endWeekday}</Text>
              </View>
              <View className='status-box' style={`background-color:${colors.bg}`}>
                <Text className='status-text' style={`color:${colors.color}`}>
                  {result.statusText}
                </Text>
              </View>
            </View>

            {result.remainMonthsText !== '' && <Text className='remain-text'>折合 {result.remainMonthsText}</Text>}

            <View className='bar-head'>
              <Text className='bar-label'>已过 {result.progressText}</Text>
              <Text className='bar-label'>
                {result.usedDays} / {result.totalDays} 天
              </Text>
            </View>
            <View className='bar-track'>
              <View
                className='bar-fill'
                style={`width:${result.progressText};background-color:${colors.color}`}
              />
            </View>

            {metrics.map((metric) => (
              <View className='metric-row' key={metric.label}>
                <Text className='metric-label'>{metric.label}</Text>
                <Text className='metric-value'>{metric.value}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View className='card'>
            <View className='empty-box'>
              <Text className='empty-icon'>🥫</Text>
              <Text className='empty-text'>{result.error}</Text>
            </View>
          </View>
        )}

        <View className='card'>
          <Text className='card-title'>说明</Text>
          {TIPS.map((tip) => (
            <Text className='tip-text' key={tip}>
              {tip}
            </Text>
          ))}
        </View>
      </View>
    </PageWithMenu>
  )
}

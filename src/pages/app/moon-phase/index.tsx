// 月相日历：整月每天的月相图 + 选中日月龄 / 照明度 / 下次朔望

import { useEffect, useMemo, useState } from 'react'
import Taro from '@tarojs/taro'
import { Text, View } from '@tarojs/components'

import PageWithMenu from '../../../components/page-with-menu'
import NavBar from '../../../components/nav-bar'
import {
  MOON_PHASES,
  SYNODIC_MONTH,
  dateText,
  dayNumber,
  loadMoonDraft,
  monthGridOf,
  monthRowsOf,
  monthTitleOf,
  phaseRangeText,
  saveMoonDraft,
  shiftMonth,
  summaryOf,
  todayParts,
  weekdayOfDayNumber,
  weekdayText
} from './lib'

import './index.scss'

const WEEK_NAMES: string[] = ['日', '一', '二', '三', '四', '五', '六']
const SYNODIC_TEXT = `${Math.round(SYNODIC_MONTH * 100) / 100}`

const TIPS: string[] = [
  `· 月相按当天 12:00 计算：月龄是距离上次新月的天数（0 ~ ${SYNODIC_TEXT}），每 1/8 个朔望月换一档月相。`,
  '· 朔 / 望时刻用 Meeus《Astronomical Algorithms》第 49 章的截断公式推算，与天文年历对比误差约 2 分钟，够日历使用。',
  '· 亮度是月亮被照亮的比例，用月龄的余弦模型估算，满月 ≈ 100%、上下弦 ≈ 50%。',
  '· 月相图默认按北半球习惯绘制；农历日期、潮汐、月出月落时间需要更完整的星历数据，不在本工具范围内。'
]

export default function MoonPhase() {
  const today = todayParts()
  const draft = loadMoonDraft(today)

  const [year, setYear] = useState(() => draft.year)
  const [month, setMonth] = useState(() => draft.month)
  const [selectedDay, setSelectedDay] = useState(() =>
    today[0] === draft.year && today[1] === draft.month ? today[2] : 1
  )

  useEffect(() => {
    saveMoonDraft({ year, month })
  }, [year, month])

  const monthTitle = monthTitleOf(year, month)
  const grid = useMemo(() => monthGridOf(year, month, today), [year, month])
  const rows = useMemo(() => monthRowsOf(grid), [grid])
  const summary = useMemo(() => summaryOf(year, month, selectedDay), [year, month, selectedDay])

  const selectedText = `${dateText(year, month, selectedDay)} · ${weekdayText(
    weekdayOfDayNumber(dayNumber(year, month, selectedDay))
  )}`

  const metrics = [
    { label: '月龄', value: summary.ageText },
    { label: '照明度', value: summary.illuminationText },
    { label: '下次新月', value: summary.nextNewText },
    { label: '下次满月', value: summary.nextFullText }
  ]

  const goMonth = (delta: number) => {
    const next = shiftMonth(year, month, delta)
    setYear(next[0])
    setMonth(next[1])
    setSelectedDay(1)
  }

  const backToday = () => {
    const parts = todayParts()
    setYear(parts[0])
    setMonth(parts[1])
    setSelectedDay(parts[2])
  }

  // 图例里点某个月相，把选中日挪到该月相最典型的一天
  const pickPhase = (index: number) => {
    const target = (index * SYNODIC_MONTH) / 8
    let bestDay = 0
    let bestDiff = 10000
    for (let i = 0; i < grid.length; i++) {
      const cell = grid[i]
      if (cell.blank || cell.phaseIndex !== index) {
        continue
      }
      // 取距离该月相中点最近的一天
      let diff = cell.age - target
      if (diff < -SYNODIC_MONTH / 2) {
        diff += SYNODIC_MONTH
      }
      if (diff < 0) {
        diff = -diff
      }
      if (diff < bestDiff) {
        bestDiff = diff
        bestDay = cell.day
      }
    }
    if (bestDay > 0) {
      setSelectedDay(bestDay)
    } else {
      Taro.showToast({ title: `这个月的月相里没有「${MOON_PHASES[index].name}」`, icon: 'none' })
    }
  }

  return (
    <PageWithMenu>
      <NavBar title='月相日历' />
      <View className='container'>
        <View className='card'>
          <View className='cal-head'>
            <Text className='cal-nav' onClick={() => goMonth(-1)}>
              ‹
            </Text>
            <Text className='cal-title'>{monthTitle}</Text>
            <Text className='cal-nav' onClick={() => goMonth(1)}>
              ›
            </Text>
          </View>
          <View className='head-actions'>
            <Text className='head-action' onClick={backToday}>
              回到今天
            </Text>
          </View>

          <View className='week-row'>
            {WEEK_NAMES.map((name, index) => (
              <Text
                className={index === 0 || index === 6 ? 'week-text week-text-weekend' : 'week-text'}
                key={name}
              >
                {name}
              </Text>
            ))}
          </View>

          {rows.map((row, rowIndex) => (
            <View className='day-row' key={`row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <View
                  className='day-cell'
                  key={`cell-${rowIndex}-${cellIndex}`}
                  onClick={() => {
                    if (!cell.blank) {
                      setSelectedDay(cell.day)
                    }
                  }}
                >
                  {!cell.blank && (
                    <View
                      className={
                        cell.isToday
                          ? 'day-box day-box-today'
                          : cell.day === selectedDay
                            ? 'day-box day-box-selected'
                            : 'day-box'
                      }
                    >
                      <Text className='day-emoji'>{cell.emoji}</Text>
                      <Text
                        className={
                          cell.isToday
                            ? 'day-num day-num-today'
                            : cell.isWeekend
                              ? 'day-num day-num-weekend'
                              : 'day-num'
                        }
                      >
                        {cell.day}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>

        <View className='card'>
          <View className='detail-head'>
            <Text className='detail-emoji'>{summary.emoji}</Text>
            <View className='detail-main'>
              <Text className='detail-phase'>{summary.phaseName}</Text>
              <Text className='detail-en'>{summary.phaseEn}</Text>
            </View>
          </View>
          <Text className='detail-date'>{selectedText}</Text>
          {metrics.map((metric) => (
            <View className='metric-row' key={metric.label}>
              <Text className='metric-label'>{metric.label}</Text>
              <Text className='metric-value'>{metric.value}</Text>
            </View>
          ))}
        </View>

        <View className='card'>
          <Text className='card-title'>八种月相</Text>
          <Text className='card-note'>一个朔望月约 {SYNODIC_TEXT} 天，从新月数起每八分之一换一种月相。</Text>
          {MOON_PHASES.map((phase) => (
            <View className='legend-row' key={phase.name} hoverClass='legend-hover' onClick={() => pickPhase(phase.index)}>
              <Text className='legend-emoji'>{phase.emoji}</Text>
              <View className='legend-main'>
                <Text className={summary.phaseIndex === phase.index ? 'legend-name legend-name-active' : 'legend-name'}>
                  {phase.name}
                </Text>
                <Text className='legend-en'>{phase.en}</Text>
              </View>
              <Text className='legend-range'>{phaseRangeText(phase.index)}</Text>
            </View>
          ))}
        </View>

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

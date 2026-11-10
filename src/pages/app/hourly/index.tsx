// 时薪：按月薪、工作日制度与每日工时算时薪，可保存记录横向对比

import { useEffect, useMemo, useState } from 'react'
import Taro from '@tarojs/taro'
import { Input, Text, View } from '@tarojs/components'

import PageWithMenu from '../../../components/page-with-menu'
import NavBar from '../../../components/nav-bar'
import { formatFixed, sanitizeDecimal, trimNumber } from '../../../common/format'
import {
  HOURLY_HISTORY_LIMIT,
  WORK_SCHEDULES,
  calculateHourly,
  formatSavedAt,
  loadHourlyDraft,
  loadHourlyHistory,
  recordOf,
  sameInputAs,
  saveHourlyDraft,
  saveHourlyHistory,
  scheduleIndexOf,
  scheduleLabelOf
} from './lib'
import type { HourlyRecord, HistoryRow } from './lib'

import './index.scss'

/** 空串按 -1 处理，交给 calculateHourly 判为不合法 */
function parseInput(text: string): number {
  if (text === '') {
    return -1
  }
  return parseFloat(text)
}

export default function Hourly() {
  const draft = loadHourlyDraft()
  const [salaryInput, setSalaryInput] = useState(() => draft.salaryText)
  const [hoursInput, setHoursInput] = useState(() => draft.hoursText)
  const [scheduleIndex, setScheduleIndex] = useState(() => {
    const index = scheduleIndexOf(draft.scheduleCode)
    return index < 0 ? 0 : index
  })
  const [records, setRecords] = useState<HourlyRecord[]>(() => loadHourlyHistory())

  const schedule = WORK_SCHEDULES[scheduleIndex]

  // 每次改动都存一份，下次打开直接回显
  useEffect(() => {
    saveHourlyDraft({ salaryText: salaryInput, scheduleCode: schedule.code, hoursText: hoursInput })
  }, [salaryInput, hoursInput, schedule])

  const result = useMemo(
    () => calculateHourly(parseInput(salaryInput), schedule.code, parseInput(hoursInput)),
    [salaryInput, schedule.code, hoursInput]
  )

  // 历史记录 + 与当前结果的对比
  const historyRows = useMemo<HistoryRow[]>(() => {
    const rows: HistoryRow[] = []
    const baseHourly = result == null ? 0 : result.hourly
    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      let diffText = ''
      if (baseHourly > 0) {
        const diff = ((record.hourly - baseHourly) / baseHourly) * 100
        diffText = diff >= 0 ? `比当前高 ${formatFixed(diff, 1)}%` : `比当前低 ${formatFixed(-diff, 1)}%`
      }
      const highlight =
        result != null &&
        record.monthlySalary === result.monthlySalary &&
        record.hoursPerDay === result.hoursPerDay &&
        record.scheduleCode === result.scheduleCode
      rows.push({
        hourlyText: `¥ ${formatFixed(record.hourly, 2)} / 小时`,
        detailText: `月薪 ${trimNumber(record.monthlySalary)} · ${scheduleLabelOf(record.scheduleCode)} · 每天 ${trimNumber(
          record.hoursPerDay
        )} 小时`,
        timeText: formatSavedAt(record.savedAt),
        diffText,
        highlight
      })
    }
    return rows
  }, [records, result])

  const hintText = `按「${schedule.label}」计：每月 ${trimNumber(schedule.daysPerMonth)} 天、每天 ${trimNumber(
    schedule.hoursPerDay
  )} 小时；月工时 = 天数 × 每日工时。`

  // 点制度：自动填入该制度常见的每日工时
  const pickSchedule = (index: number) => {
    if (index < 0 || index >= WORK_SCHEDULES.length) {
      return
    }
    setScheduleIndex(index)
    setHoursInput(trimNumber(WORK_SCHEDULES[index].hoursPerDay))
  }

  const saveRecord = () => {
    if (result == null) {
      Taro.showToast({ title: '先填写月薪与工时', icon: 'none' })
      return
    }
    const record = recordOf(result)
    if (records.length > 0 && sameInputAs(records[0], record)) {
      Taro.showToast({ title: '已经保存过相同的输入', icon: 'none' })
      return
    }
    const next = [record, ...records].slice(0, HOURLY_HISTORY_LIMIT)
    setRecords(next)
    saveHourlyHistory(next)
    Taro.showToast({ title: '已保存', icon: 'none' })
  }

  const clearHistory = () => {
    setRecords([])
    saveHourlyHistory([])
  }

  return (
    <PageWithMenu>
      <NavBar title='时薪计算' />
      <View className='container'>
        <View className='card'>
          <Text className='card-title'>工资信息</Text>
          <View className='field-row'>
            <Text className='field-label'>月薪</Text>
            <Input
              className='input-box'
              type='digit'
              placeholder='10000（元）'
              value={salaryInput}
              onInput={(event) => setSalaryInput(sanitizeDecimal(String(event.detail.value ?? '')))}
            />
            <Text className='unit-suffix'>元</Text>
          </View>
          <View className='field-row'>
            <Text className='field-label'>制度</Text>
            <View className='radio-group'>
              {WORK_SCHEDULES.map((item, index) => (
                <View
                  className={index === scheduleIndex ? 'radio-item radio-item-active' : 'radio-item'}
                  key={item.code}
                  hoverClass='radio-item-hover'
                  onClick={() => pickSchedule(index)}
                >
                  <Text className={index === scheduleIndex ? 'radio-text radio-text-active' : 'radio-text'}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <View className='field-row'>
            <Text className='field-label'>每日工时</Text>
            <Input
              className='input-box'
              type='digit'
              placeholder='8'
              value={hoursInput}
              onInput={(event) => setHoursInput(sanitizeDecimal(String(event.detail.value ?? '')))}
            />
            <Text className='unit-suffix'>小时</Text>
          </View>
          <Text className='hint-text'>{hintText}</Text>
        </View>

        {result != null ? (
          <View className='card'>
            <Text className='card-title'>计算结果</Text>
            <View className='result-head'>
              <Text className='result-value'>{formatFixed(result.hourly, 2)}</Text>
              <Text className='result-unit'>元 / 小时</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>日薪</Text>
              <Text className='metric-value'>{formatFixed(result.dailyWage, 2)} 元</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>每月工时</Text>
              <Text className='metric-value'>{formatFixed(result.monthlyHours, 1)} 小时</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>每月工作天数</Text>
              <Text className='metric-value'>{formatFixed(result.workDays, 2)} 天</Text>
            </View>
            <View className='action-row'>
              <View className='action-btn' hoverClass='action-hover' onClick={saveRecord}>
                <Text className='action-text'>保存记录对比</Text>
              </View>
            </View>
          </View>
        ) : (
          <View className='card'>
            <Text className='empty-text'>填入月薪与每日工时后显示结果</Text>
          </View>
        )}

        {historyRows.length > 0 && (
          <View className='card'>
            <View className='card-head'>
              <Text className='card-title'>历史记录</Text>
              <Text className='head-action' onClick={clearHistory}>
                清空
              </Text>
            </View>
            {historyRows.map((row, index) => (
              <View className='history-item' key={`${row.timeText}-${index}`}>
                <View className='history-head'>
                  <Text className={row.highlight ? 'history-hourly highlight' : 'history-hourly'}>{row.hourlyText}</Text>
                  <Text className='history-time'>{row.timeText}</Text>
                </View>
                <Text className='history-detail'>{row.detailText}</Text>
                {row.diffText !== '' && <Text className='history-diff'>{row.diffText}</Text>}
              </View>
            ))}
          </View>
        )}
      </View>
    </PageWithMenu>
  )
}

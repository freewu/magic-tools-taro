// 2027 放假安排：节日详情 + 月历（放假 / 调休标注）+ 节日切换

import { useMemo, useState } from 'react'
import { Text, View } from '@tarojs/components'

import AppMenu from '../../../components/app-menu'
import { HOLIDAY_YEAR, holidaySource, holidays, type HolidayPlan } from './data'
import {
  WEEK_LABELS,
  crossWorkdayNote,
  monthBlocksOf,
  monthOf,
  nearestPlanIndex,
  planCovering,
  rangeTextOf,
  todayKey,
  workdaysTextOf,
  type DayCell
} from './calendar'

import './index.scss'

const initialMonth = monthOf(holidays[nearestPlanIndex(todayKey())].start)

/** 法定放假浅绿、调休上班浅红、双休浅灰，普通工作日不填色 */
function cellBg(cell: DayCell): string {
  if (!cell.inMonth) {
    return 'transparent'
  }
  if (cell.state === 'holiday') {
    return '#E7F7EE'
  }
  if (cell.state === 'workday') {
    return '#FDECEC'
  }
  if (cell.state === 'weekend') {
    return '#F1F3F6'
  }
  return 'transparent'
}

function cellColor(cell: DayCell): string {
  if (!cell.inMonth) {
    return '#CCCCCC'
  }
  if (cell.state === 'holiday') {
    return '#1F9D55'
  }
  if (cell.state === 'workday') {
    return '#D93025'
  }
  if (cell.state === 'weekend') {
    return '#666666'
  }
  return '#333333'
}

export default function Holiday2027() {
  const [currentMonth, setCurrentMonth] = useState(() => initialMonth)

  // 月历区块：普通月份 1 块，跨月假期 2 块（起始月 + 结束月）
  const view = useMemo(() => {
    const m = currentMonth < 1 ? 1 : currentMonth > 12 ? 12 : currentMonth
    const blocks = monthBlocksOf(HOLIDAY_YEAR, m)
    const multiMonth = blocks.length > 1

    // 跨月（含调休上班日跨月）的标题带上起止月份，如「2027 年 1 月 ~ 2 月」
    let monthTitle = ''
    if (multiMonth) {
      const first = blocks[0]
      const last = blocks[blocks.length - 1]
      monthTitle =
        first.year !== last.year
          ? `${first.year} 年 ${first.month} 月 ~ ${last.year} 年 ${last.month} 月`
          : `${first.year} 年 ${first.month} 月 ~ ${last.month} 月`
    } else {
      monthTitle = `${blocks[0].year} 年 ${blocks[0].month} 月`
    }

    // 跨月假期在本月也能看到它的详情（起止月份都算）
    const plan = planCovering(m)
    // 有节日时只看该节日的标注，不再提示别的节日；空态月份才补一句「本月某天是某节日的调休」
    const noteText = plan != null ? '' : crossWorkdayNote(m)

    return { month: m, blocks, multiMonth, monthTitle, plan, noteText }
  }, [currentMonth])

  const isActive = (plan: HolidayPlan): boolean => {
    const current = planCovering(view.month)
    return current != null && current.name === plan.name
  }

  return (
    <View className='page-with-menu'>
      <View className='container'>
        {/* 节日详情：放在月历上方 */}
        {view.plan != null ? (
          <View className='card info-card'>
            <View className='card-head'>
              <Text className='card-title'>{view.plan.name}</Text>
              <View className='days-box'>
                <Text className='days-text'>共 {view.plan.days} 天</Text>
              </View>
            </View>
            <View className='info-row'>
              <Text className='info-label'>放假时间</Text>
              <Text className='info-value'>{rangeTextOf(view.plan)}</Text>
            </View>
            <View className='info-row'>
              <Text className='info-label'>调休上班</Text>
              <Text className='info-value'>{workdaysTextOf(view.plan)}</Text>
            </View>
            {view.noteText !== '' && <Text className='note-text'>{view.noteText}</Text>}
          </View>
        ) : (
          <View className='card info-card'>
            <Text className='empty-text'>本月没有节假日安排，可点右侧节日查看对应月份</Text>
            {view.noteText !== '' && <Text className='note-text'>{view.noteText}</Text>}
          </View>
        )}

        <View className='main-row'>
          {/* 月历：绿色 = 放假，红色 = 调休上班 */}
          <View className='card calendar-card'>
            <View className='calendar-head'>
              <Text className='month-title'>{view.monthTitle}</Text>
            </View>

            {/* 跨月假期展示两个月的卡片，普通月份只有一个月 */}
            {view.blocks.map((block) => (
              <View className='month-block' key={`${block.year}-${block.month}`}>
                {view.multiMonth && <Text className='block-title'>{block.title}</Text>}
                <View className='week-row'>
                  {WEEK_LABELS.map((w, wi) => (
                    <View className='week-cell' key={w}>
                      <Text className='week-text' style={{ color: wi === 0 || wi === 6 ? '#999999' : '#666666' }}>
                        {w}
                      </Text>
                    </View>
                  ))}
                </View>
                <View className='days-wrap'>
                  {block.cells.map((cell) => (
                    <View className='day-cell' key={cell.date}>
                      <View className='day-box' style={{ backgroundColor: cellBg(cell) }}>
                        <Text className='day-num' style={{ color: cellColor(cell) }}>
                          {cell.day}
                        </Text>
                        {cell.mark !== '' && (
                          <Text className='day-mark' style={{ color: cellColor(cell) }}>
                            {cell.mark}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <View className='legend-row'>
              <View className='legend-item'>
                <View className='legend-dot legend-dot-holiday' />
                <Text className='legend-text'>放假</Text>
              </View>
              <View className='legend-item legend-item-gap'>
                <View className='legend-dot legend-dot-workday' />
                <Text className='legend-text'>调休上班</Text>
              </View>
              <View className='legend-item legend-item-gap'>
                <View className='legend-dot legend-dot-weekend' />
                <Text className='legend-text'>双休</Text>
              </View>
              <View className='legend-item legend-item-gap'>
                <View className='legend-dot legend-dot-normal' />
                <Text className='legend-text'>工作日</Text>
              </View>
            </View>
          </View>

          {/* 右侧节日 tab：点击跳到该节日的月份 */}
          <View className='tab-col'>
            {holidays.map((plan) => (
              <View
                className='tab-item'
                hoverClass='tab-item-hover'
                key={plan.name}
                style={{ backgroundColor: isActive(plan) ? '#007AFF' : '#FFFFFF' }}
                onClick={() => setCurrentMonth(monthOf(plan.start))}
              >
                <Text className='tab-text' style={{ color: isActive(plan) ? '#FFFFFF' : '#555555' }}>
                  {plan.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text className='source'>※ {holidaySource}</Text>
      </View>
      <AppMenu />
    </View>
  )
}

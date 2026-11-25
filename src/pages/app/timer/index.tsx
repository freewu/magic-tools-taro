// 计时器：开始 / 暂停 / 继续 / 结束 + 记一笔 + 历史记录（含平均、最快、最慢）

import { useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { Text, View } from '@tarojs/components'

import PageWithMenu from '../../../components/page-with-menu'
import NavBar from '../../../components/nav-bar'
import {
  addTimerRecord,
  clearTimerHistory,
  loadTimerHistory,
  removeTimerRecordAt,
  saveTimerHistory,
  splitElapsed,
  summarize,
  toRows
} from './lib'
import type { TimerRecord, TimerRow } from './lib'

import './index.scss'

type TimerState = 'idle' | 'running' | 'paused' | 'stopped'

/** 约 30fps：毫秒位看起来在连续跳，又不至于每帧都刷新 */
const TICK_MS = 33

const STATUS: Record<TimerState, { text: string; color: string; bg: string }> = {
  idle: { text: '未开始', color: '#8a94a6', bg: '#f2f5fa' },
  running: { text: '计时中', color: '#007aff', bg: '#e8f3ff' },
  paused: { text: '已暂停', color: '#b4740b', bg: '#fff6e0' },
  stopped: { text: '已结束', color: '#2c3e50', bg: '#eaeef3' }
}

const PRIMARY_LABEL: Record<TimerState, string> = {
  idle: '开始',
  running: '暂停',
  paused: '继续',
  stopped: '重新开始'
}

export default function Timer() {
  const [state, setState] = useState<TimerState>('idle')
  const [parts, setParts] = useState(() => splitElapsed(0))
  const [records, setRecords] = useState<TimerRecord[]>(loadTimerHistory)
  const [rows, setRows] = useState<TimerRow[]>([])
  const [summary, setSummary] = useState('')

  // 累计毫秒（已暂停/结束的段）与本段起点
  const accumulated = useRef(0)
  const segmentStart = useRef(0)
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTick = () => {
    if (tickTimer.current != null) {
      clearInterval(tickTimer.current)
      tickTimer.current = null
    }
  }

  const refreshHistory = (list: TimerRecord[]) => {
    setRecords(list)
    setRows(toRows(list))
    setSummary(summarize(list))
  }

  // 首屏把历史记录格式化成展示行
  useEffect(() => {
    setRows(toRows(records))
    setSummary(summarize(records))
    // 只在挂载时跑一次，之后由 refreshHistory 同步
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 页面离开就停掉定时器（本页不做后台计时）
  useEffect(() => clearTick, [])

  const pushRecord = (ms: number) => {
    if (ms <= 0) {
      return
    }
    const next = addTimerRecord(records, { elapsed: Math.round(ms), endedAt: Date.now() })
    saveTimerHistory(next)
    refreshHistory(next)
  }

  const onTick = () => {
    setParts(splitElapsed(accumulated.current + (Date.now() - segmentStart.current)))
  }

  const startSegment = () => {
    segmentStart.current = Date.now()
    setState('running')
    setParts(splitElapsed(accumulated.current))
    clearTick()
    tickTimer.current = setInterval(onTick, TICK_MS)
  }

  const pause = () => {
    accumulated.current += Date.now() - segmentStart.current
    clearTick()
    setState('paused')
    setParts(splitElapsed(accumulated.current))
  }

  // 主按钮：未开始→开始；计时中→暂停；暂停→继续；已结束→重新开始（先清零）
  const onPrimary = () => {
    if (state === 'running') {
      pause()
      return
    }
    if (state === 'stopped') {
      accumulated.current = 0
      setParts(splitElapsed(0))
    }
    startSegment()
  }

  // 结束：把本次耗时写进历史
  const onFinish = () => {
    if (state === 'running') {
      accumulated.current += Date.now() - segmentStart.current
    }
    if (state !== 'running' && state !== 'paused') {
      return
    }
    clearTick()
    setState('stopped')
    setParts(splitElapsed(accumulated.current))
    pushRecord(accumulated.current)
  }

  // 清零，回到未开始
  const onReset = () => {
    clearTick()
    accumulated.current = 0
    setState('idle')
    setParts(splitElapsed(0))
  }

  // 不停表记一笔：把当前耗时存进历史，计时继续
  const onLap = () => {
    if (state !== 'running' && state !== 'paused') {
      return
    }
    const ms =
      state === 'running' ? accumulated.current + (Date.now() - segmentStart.current) : accumulated.current
    pushRecord(ms)
    Taro.showToast({ title: `已记录 ${splitElapsed(ms).duration}`, icon: 'none' })
  }

  const copyText = (text: string) => {
    Taro.setClipboardData({ data: text })
      .then(() => Taro.showToast({ title: `已复制 ${text}`, icon: 'none' }))
      .catch(() => Taro.showToast({ title: '复制失败', icon: 'none' }))
  }

  const removeRecord = (index: number) => {
    if (index < 0 || index >= records.length) {
      return
    }
    Taro.showModal({
      title: '删除记录',
      content: `确定删除 ${rows[index].elapsedText} 这条记录吗？`
    }).then((res) => {
      if (!res.confirm) {
        return
      }
      const next = removeTimerRecordAt(records, index)
      saveTimerHistory(next)
      refreshHistory(next)
    })
  }

  const onClearHistory = () => {
    if (records.length === 0) {
      return
    }
    Taro.showModal({
      title: '清空历史记录',
      content: `共 ${records.length} 条记录，清空后无法恢复`
    }).then((res) => {
      if (!res.confirm) {
        return
      }
      refreshHistory(clearTimerHistory())
    })
  }

  const status = STATUS[state]
  const running = state === 'running' || state === 'paused'

  return (
    <PageWithMenu>
      <NavBar title='计时器' />
      <View className='container'>
        <View className='card timer-card'>
          <View className='timer-status-row'>
            <View className='status-pill' style={`background-color:${status.bg}`}>
              <Text className='status-text' style={`color:${status.color}`}>
                {status.text}
              </Text>
            </View>
            <Text className='copy-text' onClick={() => copyText(parts.full)}>
              复制
            </Text>
          </View>

          {/* 按段渲染：每段固定宽度，毫秒跳动时整行不会左右晃 */}
          <View className='clock-row'>
            <Text className='clock-seg'>{parts.hours}</Text>
            <Text className='clock-sep'>:</Text>
            <Text className='clock-seg'>{parts.minutes}</Text>
            <Text className='clock-sep'>:</Text>
            <Text className='clock-seg'>{parts.seconds}</Text>
            <Text className='clock-sep'>.</Text>
            <Text className='clock-ms'>{parts.millis}</Text>
          </View>
          <Text className='duration-text'>{parts.duration}</Text>

          <View className='btn-row'>
            <View className='btn btn-primary' hoverClass='btn-primary-hover' onClick={onPrimary}>
              <Text className='btn-text'>{PRIMARY_LABEL[state]}</Text>
            </View>
            {running && (
              <View className='btn btn-danger' hoverClass='btn-danger-hover' onClick={onFinish}>
                <Text className='btn-text'>结束</Text>
              </View>
            )}
            {state === 'stopped' && (
              <View className='btn btn-ghost' hoverClass='btn-ghost-hover' onClick={onReset}>
                <Text className='btn-ghost-text'>清空</Text>
              </View>
            )}
          </View>

          {running && (
            <View className='lap-btn' hoverClass='lap-btn-hover' onClick={onLap}>
              <Text className='lap-btn-text'>记一笔（不停止计时）</Text>
            </View>
          )}

          <Text className='tip-text'>
            点「开始」计时，点「结束」停止并把耗时存进历史；暂停后可以继续。计时按本机系统时间计算，切后台回来也不会变慢。
          </Text>
        </View>

        <View className='card'>
          <View className='card-head'>
            <Text className='card-title'>历史记录</Text>
            {records.length > 0 ? (
              <Text className='head-action' onClick={onClearHistory}>
                清空
              </Text>
            ) : (
              <Text className='card-count'>0 条</Text>
            )}
          </View>
          {records.length > 0 && <Text className='summary-text'>{summary}</Text>}
          {rows.map((row, index) => (
            <View className='record-row' key={`${row.elapsedText}-${index}`}>
              <View className='record-main' hoverClass='record-main-hover' onClick={() => copyText(row.elapsedText)}>
                <Text className='record-elapsed'>{row.elapsedText}</Text>
                <Text className='record-meta'>
                  {row.durationText} · {row.endedText}
                </Text>
              </View>
              <View className='record-del' hoverClass='record-del-hover' onClick={() => removeRecord(index)}>
                <Text className='record-del-text'>×</Text>
              </View>
            </View>
          ))}
          {records.length === 0 && (
            <Text className='hint-text'>还没有记录：结束一次计时后会自动出现在这里</Text>
          )}
        </View>
      </View>
    </PageWithMenu>
  )
}

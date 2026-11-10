// 抽奖转盘：奖项逐格高亮跑动后停在随机结果上

import { useEffect, useMemo, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { Text, Textarea, View } from '@tarojs/components'

import PageWithMenu from '../../../components/page-with-menu'
import NavBar from '../../../components/nav-bar'
import { DEFAULT_PRIZES, parsePrizes, pickPrize } from './lib'

import './index.scss'

export default function LuckyWheel() {
  const [prizesInput, setPrizesInput] = useState(() => DEFAULT_PRIZES.join('\n'))
  const [cursor, setCursor] = useState(-1)
  const [spinning, setSpinning] = useState(false)
  const [resultText, setResultText] = useState('')

  const parsed = useMemo(() => parsePrizes(prizesInput), [prizesInput])
  // 少于 2 个有效奖项时保持上一次可用的列表，避免列表闪空
  const prizes = parsed.length >= 2 ? parsed : DEFAULT_PRIZES

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 列表变化时钳制高亮下标
  useEffect(() => {
    setCursor((prev) => (prev >= prizes.length ? prizes.length - 1 : prev))
  }, [prizes.length])

  // 页面卸载时清掉跑动定时器
  useEffect(() => {
    return () => {
      if (timerRef.current != null) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  const onSpin = () => {
    if (spinning) {
      return
    }
    if (prizes.length < 2) {
      Taro.showToast({ title: '至少填写 2 个奖项', icon: 'none' })
      return
    }
    setSpinning(true)
    setResultText('')
    const target = pickPrize(prizes.length)
    const len = prizes.length
    const totalTicks = 20 + Math.floor(Math.random() * 8)
    let ticks = 0
    let index = cursor
    timerRef.current = setInterval(() => {
      ticks++
      index = index < 0 ? 0 : (index + 1) % len
      if (ticks >= totalTicks) {
        if (timerRef.current != null) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        setCursor(target)
        setSpinning(false)
        setResultText(`🎉 ${prizes[target]}`)
        return
      }
      setCursor(index)
    }, 80)
  }

  return (
    <PageWithMenu>
      <NavBar title='抽奖转盘' />
      <View className='container'>
        <View className='card'>
          <Text className='card-title'>转盘设置</Text>
          <Text className='field-label'>奖项</Text>
          <Textarea
            className='input-area'
            maxlength={300}
            placeholder='每行一项，可用顿号或逗号分隔'
            value={prizesInput}
            onInput={(event) => setPrizesInput(String(event.detail.value ?? ''))}
          />
          <View className='prize-list'>
            {prizes.map((prize, index) => (
              <View className={index === cursor ? 'prize-row prize-active' : 'prize-row'} key={`${prize}-${index}`}>
                <Text className='prize-name'>{prize}</Text>
                <Text className='prize-idx'>{index + 1}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className='card center-card'>
          {resultText !== '' ? (
            <Text className='result-title'>{resultText}</Text>
          ) : (
            <Text className='result-sub'>{spinning ? '转动中…' : '点击下方按钮开始抽奖'}</Text>
          )}
          <View className={spinning ? 'btn btn-disabled' : 'btn'} hoverClass='btn-hover' onClick={onSpin}>
            <Text className='btn-text'>{spinning ? '转动中…' : '开始抽奖'}</Text>
          </View>
        </View>
      </View>
    </PageWithMenu>
  )
}

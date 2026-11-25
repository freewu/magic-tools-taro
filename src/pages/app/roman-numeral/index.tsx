// 罗马数字：1 - 3999 与标准写法双向转换 + 速查表

import { useState } from 'react'
import Taro from '@tarojs/taro'
import { Text, Textarea, View } from '@tarojs/components'

import PageWithMenu from '../../../components/page-with-menu'
import NavBar from '../../../components/nav-bar'
import {
  ROMAN_EXAMPLES,
  ROMAN_MAX,
  ROMAN_MIN,
  ROMAN_MODE_TO_ARABIC,
  ROMAN_MODE_TO_ROMAN,
  ROMAN_PAIRS,
  ROMAN_SYMBOLS,
  arabicToRoman,
  breakdownOf,
  loadRomanDraft,
  randomValue,
  romanOf,
  romanToArabic,
  saveRomanDraft,
  tokenNote
} from './lib'
import type { RomanExample, RomanResult } from './lib'

import './index.scss'

const MODE_LABELS = ['数字 → 罗马', '罗马 → 数字']

type ViewResult = {
  /** 结果文本 */
  text: string
  /** 结果卡片标题 */
  label: string
  /** 结果下方说明 */
  detail: string
  /** 失败原因（空串表示成功） */
  warn: string
}

function emptyResult(label: string, detail: string, warn: string): ViewResult {
  return { text: '', label, detail, warn }
}

function toViewResult(mode: string, result: RomanResult): ViewResult {
  if (!result.ok) {
    return emptyResult(mode === ROMAN_MODE_TO_ROMAN ? '罗马数字' : '阿拉伯数字', '', result.error)
  }
  if (mode === ROMAN_MODE_TO_ROMAN) {
    return {
      text: result.text,
      label: '罗马数字',
      detail: `${result.value} = ${result.detail}，共 ${result.text.length} 个符号`,
      warn: ''
    }
  }
  return { text: result.text, label: '阿拉伯数字', detail: `拆分：${result.detail}`, warn: '' }
}

export default function RomanNumeral() {
  const draft = loadRomanDraft()
  const [mode, setMode] = useState(() => draft.mode)
  const [inputText, setInputText] = useState(() => draft.text)

  const toRoman = mode === ROMAN_MODE_TO_ROMAN
  const inputPlaceholder = toRoman
    ? `输入阿拉伯数字，例如 ${ROMAN_MAX}`
    : '输入罗马数字，例如 MMMCMXCIX'
  const emptyHint = toRoman
    ? `输入 ${ROMAN_MIN} - ${ROMAN_MAX} 之间的整数后自动转成罗马数字`
    : '输入罗马数字（I - MMMCMXCIX）后自动转成阿拉伯数字'

  const result =
    inputText.trim() === ''
      ? emptyResult(toRoman ? '罗马数字' : '阿拉伯数字', '', '')
      : toViewResult(mode, toRoman ? arabicToRoman(inputText) : romanToArabic(inputText))

  const commit = (text: string, nextMode: string) => {
    setMode(nextMode)
    setInputText(text)
    saveRomanDraft({ mode: nextMode, text })
  }

  const switchMode = (next: string) => {
    if (next === mode) {
      return
    }
    // 切换方向时保留输入，方便对照两个方向的差异
    commit(inputText, next)
  }

  const swap = () => {
    if (result.text === '') {
      Taro.showToast({ title: '还没有结果', icon: 'none' })
      return
    }
    commit(result.text, toRoman ? ROMAN_MODE_TO_ARABIC : ROMAN_MODE_TO_ROMAN)
  }

  const random = () => {
    const value = randomValue()
    commit(toRoman ? `${value}` : romanOf(value), mode)
  }

  const pickExample = (row: RomanExample) => {
    commit(toRoman ? row.arabic : row.roman, mode)
  }

  const copy = () => {
    if (result.text === '') {
      Taro.showToast({ title: '还没有结果', icon: 'none' })
      return
    }
    Taro.setClipboardData({ data: result.text })
      .then(() => Taro.showToast({ title: '已复制', icon: 'none' }))
      .catch(() => Taro.showToast({ title: '复制失败', icon: 'none' }))
  }

  return (
    <PageWithMenu>
      <NavBar title='罗马数字' />
      <View className='container'>
        <View className='card'>
          <View className='card-head'>
            <Text className='card-title'>输入</Text>
            <Text className='head-action' onClick={() => commit('', mode)}>
              清空
            </Text>
          </View>

          <View className='seg-row'>
            {MODE_LABELS.map((label, index) => {
              const value = index === 0 ? ROMAN_MODE_TO_ROMAN : ROMAN_MODE_TO_ARABIC
              const active = value === mode
              return (
                <View
                  className={active ? 'seg seg-active' : 'seg'}
                  key={value}
                  hoverClass='seg-hover'
                  onClick={() => switchMode(value)}
                >
                  <Text className={active ? 'seg-text seg-text-active' : 'seg-text'}>{label}</Text>
                </View>
              )
            })}
          </View>

          <Textarea
            className='input-area'
            maxlength={-1}
            value={inputText}
            placeholder={inputPlaceholder}
            onInput={(event) => commit(String(event.detail.value ?? ''), mode)}
          />

          <View className='btn-row'>
            <View className='btn' hoverClass='btn-hover' onClick={copy}>
              <Text className='btn-text btn-text-action'>复制结果</Text>
            </View>
            <View className='btn' hoverClass='btn-hover' onClick={swap}>
              <Text className={result.text === '' ? 'btn-text btn-text-off' : 'btn-text btn-text-action'}>反向</Text>
            </View>
            <View className='btn' hoverClass='btn-hover' onClick={random}>
              <Text className='btn-text btn-text-action'>随机一个</Text>
            </View>
          </View>
          <Text className='hint-text'>
            支持 1 - 3999（I - MMMCMXCIX）。罗马数字大小写均可，但必须是标准写法（IIII、IC、VX
            会被判为非法）。「反向」把结果填回输入框并切换方向。
          </Text>
        </View>

        {result.text !== '' ? (
          <View className='card'>
            <View className='card-head'>
              <Text className='result-label'>{result.label}</Text>
              <Text className='head-action' onClick={copy}>
                复制
              </Text>
            </View>
            <View className='output-box'>
              <Text className='output-text' selectable>
                {result.text}
              </Text>
            </View>
            {result.detail !== '' && <Text className='stat-text'>{result.detail}</Text>}
          </View>
        ) : (
          <View className='card'>
            <View className='empty-box'>
              <Text className='empty-icon'>🏛️</Text>
              <Text className='empty-text'>{emptyHint}</Text>
            </View>
            {result.warn !== '' && <Text className='warn-text'>{result.warn}</Text>}
          </View>
        )}

        <View className='card'>
          <Text className='card-title'>基本符号（7 个）</Text>
          <View className='grid'>
            {ROMAN_SYMBOLS.map((row) => (
              <View className='grid-item' key={row.symbol}>
                <Text className='grid-char'>{row.symbol}</Text>
                <Text className='grid-code'>{row.value}</Text>
              </View>
            ))}
          </View>

          <Text className='card-title'>减法组合（6 种）</Text>
          <View className='grid'>
            {ROMAN_PAIRS.map((row) => (
              <View className='grid-item' key={row.pair}>
                <Text className='grid-char'>{row.pair}</Text>
                <Text className='grid-code'>{row.value}</Text>
              </View>
            ))}
          </View>

          <Text className='card-title'>常见示例（点按填入）</Text>
          {ROMAN_EXAMPLES.map((row) => (
            <View className='example-row' key={row.arabic} hoverClass='example-row-hover' onClick={() => pickExample(row)}>
              <Text className='example-value'>{row.arabic}</Text>
              <Text className='example-arrow'>=</Text>
              <Text className='example-value'>{row.roman}</Text>
            </View>
          ))}
        </View>

        <View className='card'>
          <Text className='card-title'>说明</Text>
          {explainLines.map((line) => (
            <Text className='tip-text' key={line}>
              {line}
            </Text>
          ))}
        </View>
      </View>
    </PageWithMenu>
  )
}

const explainLines: string[] = [
  '· 大数在左、小数在右表示相加（XII = 12）；小数写在大数左侧表示相减（IV = 4），标准写法只允许 IV / IX / XL / XC / CD / CM 六种组合。',
  '· 同一符号最多连续出现三次（III = 3，XXX = 30，CCC = 300，MMM = 3000）；V（5）、L（50）、D（500）永不重复。',
  '· 只能对「紧随其后的大数」做减法，所以 IIII（4）、IC（99）、VX（5）都是非标准写法，应写作 IV、XCIX、V。',
  '· 罗马数字没有 0 和负数，不加上划线（乘 1000 记法）时最大只能表示 3999（MMMCMXCIX），因此本工具支持 1 - 3999 的双向转换。',
  '· 转换按 1000 → 900 → 500 → 400 → 100 → 90 → 50 → 40 → 10 → 9 → 5 → 4 → 1 的顺序贪心拆解，结果即唯一的标准写法。'
]

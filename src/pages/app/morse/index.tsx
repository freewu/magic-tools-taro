// 摩斯码：文字 ↔ 摩斯双向转换、按 ITU 时序播放、速查表点按输入

import { useEffect, useMemo, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { Text, Textarea, View } from '@tarojs/components'

import PageWithMenu from '../../../components/page-with-menu'
import NavBar from '../../../components/nav-bar'
import {
  MORSE_GROUP_DIGIT,
  MORSE_GROUP_LETTER,
  MORSE_GROUP_PUNCT,
  MORSE_MAX_PLAY_MS,
  MORSE_MODE_DECODE,
  MORSE_MODE_ENCODE,
  MORSE_STYLE_NAMES,
  buildRows,
  buildTones,
  decodeMorse,
  encodeText,
  loadMorseDraft,
  saveMorseDraft,
  styleOfCode
} from './lib'
import type { MorseRow, MorseTone } from './lib'
import { playMorseTones, stopMorseAudio } from './audio'

import './index.scss'

const LETTER_ROWS: MorseRow[] = buildRows(MORSE_GROUP_LETTER)
const DIGIT_ROWS: MorseRow[] = buildRows(MORSE_GROUP_DIGIT)
const PUNCT_ROWS: MorseRow[] = buildRows(MORSE_GROUP_PUNCT)

export default function Morse() {
  const draft = loadMorseDraft()
  const [mode, setMode] = useState(() => draft.mode)
  const [inputText, setInputText] = useState(() => draft.text)
  const [styleIndex, setStyleIndex] = useState(() => draft.style)
  const [playing, setPlaying] = useState(false)

  const playTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    saveMorseDraft({ mode, text: inputText, style: styleIndex })
  }, [mode, inputText, styleIndex])

  const stopPlay = () => {
    stopMorseAudio()
    setPlaying(false)
    if (playTimer.current != null) {
      clearTimeout(playTimer.current)
      playTimer.current = null
    }
  }

  // 页面离开时停掉排队中的音
  useEffect(() => () => stopPlay(), [])

  const encoding = mode === MORSE_MODE_ENCODE

  const view = useMemo(() => {
    if (inputText.trim() === '') {
      return { outputText: '', statsText: '', warnText: '', tones: [] as MorseTone[] }
    }
    if (encoding) {
      const result = encodeText(inputText, styleIndex)
      return {
        outputText: result.morse,
        statsText: result.stats.summaryText,
        warnText: result.unsupported === '' ? '' : `码表里没有这些字符，已跳过：${result.unsupported}`,
        tones: buildTones(result.plain)
      }
    }
    const result = decodeMorse(inputText)
    let warnText = ''
    if (result.unknown !== '') {
      warnText = `这些码无法识别，已跳过：${result.unknown}`
    } else if (result.junk !== '') {
      warnText = `这些字符不是摩斯码，已忽略：${result.junk}`
    }
    return {
      outputText: result.text,
      statsText: result.stats.summaryText,
      warnText,
      tones: buildTones(result.plain)
    }
  }, [inputText, encoding, styleIndex])

  const outputText = view.outputText
  const tones = view.tones

  const styledCode = (code: string) => styleOfCode(code, styleIndex)

  const inputPlaceholder = encoding
    ? '输入英文或数字，例如 HELLO WORLD'
    : '输入摩斯码，例如 .... . .-.. .-.. --- / .-- --- .-. .-.. -..'
  const emptyHint = encoding ? '输入文字后自动转成摩斯码' : '输入摩斯码后自动解出文字'

  const changeInput = (text: string) => {
    stopPlay()
    setInputText(text)
  }

  const pickMode = (next: string) => {
    if (next === mode) {
      return
    }
    stopPlay()
    setMode(next)
  }

  const pickStyle = (next: number) => {
    if (next === styleIndex) {
      return
    }
    stopPlay()
    setStyleIndex(next)
  }

  // 反向：把结果搬回输入框并切换方向
  const onSwap = () => {
    if (outputText === '') {
      Taro.showToast({ title: '还没有结果', icon: 'none' })
      return
    }
    stopPlay()
    setMode(encoding ? MORSE_MODE_DECODE : MORSE_MODE_ENCODE)
    setInputText(outputText)
  }

  const onCopy = () => {
    if (outputText === '') {
      Taro.showToast({ title: '还没有结果', icon: 'none' })
      return
    }
    Taro.setClipboardData({ data: outputText })
      .then(() => Taro.showToast({ title: '已复制', icon: 'none' }))
      .catch(() => Taro.showToast({ title: '复制失败', icon: 'none' }))
  }

  // 播放 / 停止；过长时只播开头一段
  const onTogglePlay = () => {
    if (playing) {
      stopPlay()
      return
    }
    if (tones.length === 0) {
      Taro.showToast({ title: '没有可以播放的码', icon: 'none' })
      return
    }
    const playback = playMorseTones(tones, MORSE_MAX_PLAY_MS)
    if (playback.count === 0) {
      return
    }
    setPlaying(true)
    if (playback.count < playback.total) {
      Taro.showToast({ title: '内容较长，只播放前 20 秒', icon: 'none' })
    }
    playTimer.current = setTimeout(() => {
      setPlaying(false)
      playTimer.current = null
    }, playback.endMs + 300)
  }

  // 点速查表：编码模式追加字符，解码模式追加码
  const pickRow = (row: MorseRow) => {
    stopPlay()
    if (encoding) {
      setInputText(inputText + row.char)
      return
    }
    const current = inputText
    const needSpace = current !== '' && current.charAt(current.length - 1) !== ' '
    setInputText(`${current}${needSpace ? ' ' : ''}${styledCode(row.code)} `)
  }

  const renderGrid = (rows: MorseRow[]) => (
    <View className='grid'>
      {rows.map((row) => (
        <View className='grid-item' key={row.char} hoverClass='grid-hover' onClick={() => pickRow(row)}>
          <Text className='grid-char'>{row.char}</Text>
          <Text className='grid-code'>{styledCode(row.code)}</Text>
        </View>
      ))}
    </View>
  )

  return (
    <PageWithMenu>
      <NavBar title='摩斯码' />
      <View className='container'>
        <View className='card'>
          <View className='card-head'>
            <Text className='card-title'>输入</Text>
            <Text className='head-action' onClick={() => changeInput('')}>
              清空
            </Text>
          </View>

          <View className='seg-row'>
            <View
              className={encoding ? 'seg seg-active' : 'seg'}
              hoverClass='seg-hover'
              onClick={() => pickMode(MORSE_MODE_ENCODE)}
            >
              <Text className={encoding ? 'seg-text seg-text-active' : 'seg-text'}>文字 → 摩斯</Text>
            </View>
            <View
              className={encoding ? 'seg' : 'seg seg-active'}
              hoverClass='seg-hover'
              onClick={() => pickMode(MORSE_MODE_DECODE)}
            >
              <Text className={encoding ? 'seg-text' : 'seg-text seg-text-active'}>摩斯 → 文字</Text>
            </View>
          </View>

          <Textarea
            className='input-area'
            maxlength={-1}
            value={inputText}
            placeholder={inputPlaceholder}
            onInput={(event) => changeInput(String(event.detail.value ?? ''))}
          />

          <Text className='sub-label'>输出编码写法</Text>
          <View className='chip-row'>
            {MORSE_STYLE_NAMES.map((name, index) => (
              <View
                className={styleIndex === index ? 'chip chip-active' : 'chip'}
                key={name}
                hoverClass='chip-hover'
                onClick={() => pickStyle(index)}
              >
                <Text className={styleIndex === index ? 'chip-text chip-text-active' : 'chip-text'}>{name}</Text>
              </View>
            ))}
          </View>

          <View className='btn-row'>
            <View className='btn' hoverClass='btn-hover' onClick={onCopy}>
              <Text className='btn-text'>复制结果</Text>
            </View>
            <View className='btn' hoverClass='btn-hover' onClick={onTogglePlay}>
              <Text className={playing ? 'btn-text' : 'btn-text'}>{playing ? '停止' : '播放'}</Text>
            </View>
            <View className='btn' hoverClass='btn-hover' onClick={onSwap}>
              <Text className='btn-text'>反向</Text>
            </View>
          </View>
          <Text className='hint-text'>
            「反向」把结果填回输入框并切换编码 / 解码方向。播放按 20 WPM（1 个单位 = 60ms）。切换「输出编码写法」只改结果的显示方式：标准「. -」、短长「· −」、数字「1 0」；解码时三种写法都能自动识别。
          </Text>
        </View>

        {outputText !== '' ? (
          <View className='card'>
            <Text className='result-label'>{encoding ? '摩斯码' : '解出的文字'}</Text>
            <View className='output-box'>
              <Text className='output-text' selectable>
                {outputText}
              </Text>
            </View>
            <Text className='stat-text'>{view.statsText}</Text>
            {view.warnText !== '' && <Text className='warn-text'>{view.warnText}</Text>}
          </View>
        ) : (
          <View className='card'>
            <View className='empty-box'>
              <Text className='empty-icon'>📡</Text>
              <Text className='empty-text'>{emptyHint}</Text>
            </View>
            {/* 全是码表不支持的字符时，也把原因显示出来 */}
            {view.warnText !== '' && <Text className='warn-text'>{view.warnText}</Text>}
          </View>
        )}

        <View className='card'>
          <Text className='card-title'>速查表（点按追加）</Text>
          <Text className='sub-label'>字母</Text>
          {renderGrid(LETTER_ROWS)}
          <Text className='sub-label'>数字</Text>
          {renderGrid(DIGIT_ROWS)}
          <Text className='sub-label'>标点</Text>
          {renderGrid(PUNCT_ROWS)}
          <Text className='hint-text'>
            码表为 ITU 标准：点 = 1 个单位、划 = 3 个单位，字符内间隔 1、字符间 3、词间 7 个单位。不支持中文、日文等非拉丁字符，需要时请先转写成拼音或英文。
          </Text>
        </View>
      </View>
    </PageWithMenu>
  )
}

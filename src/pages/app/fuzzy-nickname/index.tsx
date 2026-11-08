// 模糊昵称：往昵称每个字符后插入 Unicode 组合修饰符，生成「模糊」风格名字

import { useRef, useState } from 'react'
import Taro, { useDidHide } from '@tarojs/taro'
import { Input, Text, View } from '@tarojs/components'

import AppMenu from '../../../components/app-menu'
import NavBar from '../../../components/nav-bar'
import { effectNames, strengthShortTexts } from './data'
import { fuzzyDraftText, fuzzyNickname, loadFuzzyDraft, saveFuzzyDraft, type FuzzyDraft } from './lib'

import './index.scss'

export default function FuzzyNickname() {
  // 首次进入读上次输入（默认 bluefrog / 模糊 / 1 层）
  const [draft] = useState(() => loadFuzzyDraft())
  const savedText = useRef(fuzzyDraftText(draft))

  const [nickInput, setNickInput] = useState(draft.nickname)
  const [effectIndex, setEffectIndex] = useState(draft.effect)
  const [strengthIndex, setStrengthIndex] = useState(draft.strength)
  const [resultText, setResultText] = useState(() =>
    draft.nickname === '' ? '' : fuzzyNickname(draft.nickname, draft.effect, draft.strength + 1)
  )

  const showClear = nickInput !== ''
  const resultVisible = nickInput !== ''

  // 记住上次输入（内容没变就不写存储）
  const persistDraft = () => {
    const next: FuzzyDraft = {
      nickname: nickInput.trim(),
      effect: effectIndex,
      strength: strengthIndex
    }
    const text = fuzzyDraftText(next)
    if (text === savedText.current) {
      return
    }
    savedText.current = text
    saveFuzzyDraft(next)
  }

  // 离开页面（含切 tab）时落盘最后一次输入
  useDidHide(() => persistDraft())

  const onNickInput = (value: string) => {
    setNickInput(value)
    setResultText(value === '' ? '' : fuzzyNickname(value, effectIndex, strengthIndex + 1))
  }

  const onPickEffect = (index: number) => {
    if (effectIndex === index) {
      return
    }
    setEffectIndex(index)
    setResultText(nickInput === '' ? '' : fuzzyNickname(nickInput, index, strengthIndex + 1))
    persistDraftLater(index, strengthIndex)
  }

  const onPickStrength = (index: number) => {
    if (strengthIndex === index) {
      return
    }
    setStrengthIndex(index)
    setResultText(nickInput === '' ? '' : fuzzyNickname(nickInput, effectIndex, index + 1))
    persistDraftLater(effectIndex, index)
  }

  // 选项变化时立刻记录（此时 state 还没更新，传入新值）
  const persistDraftLater = (effect: number, strength: number) => {
    const next: FuzzyDraft = { nickname: nickInput.trim(), effect, strength }
    const text = fuzzyDraftText(next)
    if (text === savedText.current) {
      return
    }
    savedText.current = text
    saveFuzzyDraft(next)
  }

  const clearAll = () => {
    setNickInput('')
    setResultText('')
  }

  const copyResult = () => {
    if (resultText === '') {
      Taro.showToast({ title: '暂无结果', icon: 'none' })
      return
    }
    Taro.setClipboardData({ data: resultText })
  }

  return (
    <View className='page-with-menu'>
      <NavBar title='模糊昵称' />
      <View className='container'>
        {/* 昵称输入 */}
        <View className='card'>
          <Text className='card-title'>昵称</Text>
          <View className='field-row'>
            <Input
              className='name-input'
              maxlength={20}
              placeholder='请输入昵称'
              value={nickInput}
              onInput={(event) => onNickInput(String(event.detail.value ?? ''))}
            />
            {showClear && (
              <View className='clear-btn' hoverClass='clear-btn-hover' onClick={clearAll}>
                <Text className='clear-text'>×</Text>
              </View>
            )}
          </View>
          {nickInput !== '' && (
            <View className='hint-row'>
              <Text className='hint-label'>原色昵称</Text>
              <Text className='hint-value'>{nickInput}</Text>
            </View>
          )}
        </View>

        {/* 效果设置：效果与强度同一行切换 */}
        <View className='card'>
          <Text className='card-title'>模糊效果</Text>
          <View className='switch-row'>
            <Text className='switch-label'>效果</Text>
            {effectNames.map((item, index) => (
              <View
                className={effectIndex === index ? 'seg-chip seg-chip-on' : 'seg-chip'}
                hoverClass='seg-chip-hover'
                key={`e${item}`}
                onClick={() => onPickEffect(index)}
              >
                <Text className={effectIndex === index ? 'chip-text chip-text-on' : 'chip-text'}>{item}</Text>
              </View>
            ))}
            <Text className='switch-label switch-label-gap'>强度</Text>
            {strengthShortTexts.map((item, index) => (
              <View
                className={strengthIndex === index ? 'seg-chip seg-chip-on' : 'seg-chip'}
                hoverClass='seg-chip-hover'
                key={`s${item}`}
                onClick={() => onPickStrength(index)}
              >
                <Text className={strengthIndex === index ? 'chip-text chip-text-on' : 'chip-text'}>{item}</Text>
              </View>
            ))}
          </View>
          <Text className='tip-text'>
            「模糊」在每个字符后加 ҈（如 b҈l҈u҈e҈…）；「雪点」「雨点」分别在字符上方、下方叠加组合符，强度即每个字符叠加的层数（1~4
            层）。
          </Text>
        </View>

        {/* 结果 */}
        {resultVisible && (
          <View className='card'>
            <Text className='card-title'>模糊昵称</Text>
            <View className='result-box' hoverClass='result-box-hover' onClick={copyResult}>
              <Text className='result-text' selectable>
                {resultText}
              </Text>
            </View>
            <Text className='tip-text'>
              共 {resultText.length} 个字符（含组合符）。轻点结果即可复制，实际观感取决于聊天软件字体对组合符的支持。
            </Text>
          </View>
        )}

        <Text className='tip-text page-tip'>
          昵称、效果与强度会自动记住；把昵称留空后下次进入会回到默认昵称 bluefrog。
        </Text>
      </View>
      <AppMenu />
    </View>
  )
}

// 亲戚称呼：一步步选关系查称谓，也支持输入称谓反查关系链

import { useMemo, useState } from 'react'
import Taro from '@tarojs/taro'
import { Input, Text, View } from '@tarojs/components'

import PageWithMenu from '../../../components/page-with-menu'
import NavBar from '../../../components/nav-bar'
import {
  REL_MAX_STEPS,
  REL_STEPS,
  chainOf,
  chainTextOf,
  loadRelDraft,
  lookupChain,
  lookupName,
  nameTextOf,
  relationCount,
  reverseTextOf,
  saveRelDraft,
  stepsOf
} from './lib'

import './index.scss'

const HOT_NAMES: string[] = ['奶奶', '姥姥', '舅妈', '堂哥', '侄子', '姨奶奶', '小舅子', '姑父', '岳母']

export default function Relationship() {
  const draft = loadRelDraft()
  const [steps, setSteps] = useState<string[]>(() => stepsOf(draft.code))
  const [query, setQuery] = useState(() => draft.query)
  const relationTotal = useMemo(() => relationCount(), [])

  const persist = (nextSteps: string[], nextQuery: string) => {
    saveRelDraft({ code: chainOf(nextSteps), query: nextQuery })
  }

  const currentCode = chainOf(steps)
  const chainText = chainTextOf(currentCode)

  // 正向：关系链 → 称谓
  const result = useMemo(() => {
    if (steps.length === 0) {
      return { found: false, name: '', reverse: '' }
    }
    const entry = lookupChain(currentCode)
    if (entry == null) {
      return { found: false, name: '—', reverse: '' }
    }
    return { found: true, name: nameTextOf(entry), reverse: reverseTextOf(entry) }
  }, [currentCode, steps.length])

  // 反查：称谓 → 关系链
  const queryView = useMemo(() => {
    const key = query.trim()
    if (key === '') {
      return { found: false, code: '', name: '', chain: '', reverse: '' }
    }
    const entry = lookupName(key)
    if (entry == null) {
      return { found: false, code: '', name: '', chain: '', reverse: '' }
    }
    return {
      found: true,
      code: entry.code,
      name: nameTextOf(entry),
      chain: chainTextOf(entry.code),
      reverse: reverseTextOf(entry)
    }
  }, [query])

  const onPickStep = (code: string) => {
    if (steps.length >= REL_MAX_STEPS) {
      Taro.showToast({ title: `最多 ${REL_MAX_STEPS} 步`, icon: 'none' })
      return
    }
    const next = [...steps, code]
    setSteps(next)
    persist(next, query)
  }

  const onBack = () => {
    if (steps.length === 0) {
      return
    }
    const next = steps.slice(0, steps.length - 1)
    setSteps(next)
    persist(next, query)
  }

  const onClear = () => {
    setSteps([])
    persist([], query)
  }

  const changeQuery = (text: string) => {
    setQuery(text)
    persist(steps, text)
  }

  // 反查结果反向填回关系链
  const onUseQueryChain = () => {
    const code = queryView.code
    if (code === '') {
      return
    }
    const next = stepsOf(code)
    setSteps(next)
    persist(next, query)
    Taro.showToast({ title: '已填入关系链', icon: 'none' })
  }

  return (
    <PageWithMenu>
      <NavBar title='亲戚称呼' />
      <View className='container'>
        {/* 一步步选关系 */}
        <View className='card'>
          <View className='card-head'>
            <Text className='card-title'>一步步选关系</Text>
            <Text className='head-note'>最多 {REL_MAX_STEPS} 步</Text>
          </View>
          <Text className='chain-text'>{chainText}</Text>
          {steps.length > 0 && (
            <View className='action-row'>
              <Text className='action-btn' onClick={onBack}>
                ↺ 退一步
              </Text>
              <Text className='action-btn' onClick={onClear}>
                ✕ 清空
              </Text>
            </View>
          )}

          <View className='chip-wrap'>
            {REL_STEPS.map((step) => (
              <View className='step-chip' key={step.code} hoverClass='chip-hover' onClick={() => onPickStep(step.code)}>
                <Text className='step-text'>{step.name}</Text>
              </View>
            ))}
          </View>
          <Text className='hint-text'>依次点选每一层关系，例如「爸爸 → 妈妈 → 哥哥」= 爸爸的妈妈的哥哥。</Text>
        </View>

        {/* 结果 */}
        {steps.length > 0 && (
          <View className='card'>
            <Text className='result-label'>称谓</Text>
            <Text className='result-name'>{result.name}</Text>
            <Text className='result-chain'>{chainText}</Text>

            {result.found ? (
              <View className='reverse-box'>
                <Text className='reverse-label'>反过来，对方称呼我为</Text>
                <Text className='reverse-name'>{result.reverse}</Text>
              </View>
            ) : (
              <Text className='tip-text'>
                这个组合没有对应的称谓，换个关系试试（最多 {REL_MAX_STEPS} 层）。
              </Text>
            )}
          </View>
        )}

        {/* 称谓反查 */}
        <View className='card'>
          <View className='card-head'>
            <Text className='card-title'>称谓反查</Text>
            <Text className='head-note'>输入称谓看关系链</Text>
          </View>
          <Input
            className='query-input'
            placeholder='如 舅妈 / 堂哥 / 小舅子'
            value={query}
            onInput={(event) => changeQuery(String(event.detail.value ?? ''))}
            onConfirm={() => persist(steps, query)}
          />
          <View className='chip-wrap chip-wrap-tight'>
            {HOT_NAMES.map((name) => (
              <View className='hot-chip' key={name} hoverClass='chip-hover' onClick={() => changeQuery(name)}>
                <Text className='hot-text'>{name}</Text>
              </View>
            ))}
          </View>

          {query !== '' && (
            <View className='query-result'>
              {queryView.found ? (
                <View>
                  <View className='query-head'>
                    <Text className='query-name'>{queryView.name}</Text>
                    <Text className='query-link' onClick={onUseQueryChain}>
                      用这条关系链 ↑
                    </Text>
                  </View>
                  <Text className='query-chain'>{queryView.chain}</Text>
                  <View className='reverse-box reverse-box-inline'>
                    <Text className='reverse-label'>对方称呼我为</Text>
                    <Text className='reverse-name'>{queryView.reverse}</Text>
                  </View>
                </View>
              ) : (
                <Text className='tip-text'>
                  没收录「{query}」这个称谓，试试别的叫法（如 姥姥 / 外婆）。
                </Text>
              )}
            </View>
          )}
        </View>

        {/* 说明 */}
        <View className='card'>
          <Text className='card-title'>说明</Text>
          <Text className='tip-text'>
            · 数据来自开源项目 mumuy/relationship（MIT），已把「最多 {REL_MAX_STEPS} 层、每层 10 种关系」的全部组合算好内置进包内，共{' '}
            {relationTotal} 条，离线可用。
            {'\n'}· 每层可选：爸爸 / 妈妈 / 老公 / 老婆 / 儿子 / 女儿 / 哥哥 / 弟弟 / 姐姐 / 妹妹，长幼不明时会给出几个候选（如「姑表哥 / 姑表弟」）。
            {'\n'}· 结果按「我」是男性计算；含「老公」的组合按「我」是女性计算，所以会出现婆婆 / 儿媳这类称谓。
            {'\n'}· 各地叫法差别很大（姥姥 / 外婆、姑父 / 姑丈…），反查已收录常见别名，仍有出入属正常。
            {'\n'}· 仅供查称呼、写称呼参考，不作其他用途。
          </Text>
        </View>
      </View>
    </PageWithMenu>
  )
}

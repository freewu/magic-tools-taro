// 常用编码：Base64 / URL / Unicode / HTML 实体 / 十六进制 / 二进制 / ROT13 一键互转

import { useEffect, useMemo, useState } from 'react'
import Taro from '@tarojs/taro'
import { Text, Textarea, View } from '@tarojs/components'

import PageWithMenu from '../../../components/page-with-menu'
import NavBar from '../../../components/nav-bar'
import { CODEC_OPTIONS, codecByCode, codecNote, encodeAll, loadCodecDraft, runCodec, saveCodecDraft } from './lib'

import './index.scss'

const TIPS: string[] = [
  '· Base64 / URL / 十六进制 / 二进制都按 UTF-8 字节计算，一个汉字占 3 字节，emoji 占 4 字节；解码支持 URL 安全的 - _ 变体。',
  "· URL 编码遵循 RFC 3986（同 encodeURIComponent），非保留字符 A–Z a–z 0–9 - _ . ! ~ * ' ( ) 原样保留。",
  '· HTML 实体支持 &amp; &lt; &gt; &quot; &#39; 与 &#xXXXX; 形式，解码也支持 &nbsp; &copy; 等常用命名实体。',
  '· ROT13 只是字母位移 13 位，编码与解码是同一个操作，中文与数字保持不变。'
]

export default function Codec() {
  const draft = loadCodecDraft()
  const [codec, setCodec] = useState(() => draft.codec)
  const [encode, setEncode] = useState(() => draft.encode)
  const [inputText, setInputText] = useState(() => draft.text)

  useEffect(() => {
    saveCodecDraft({ codec, encode, text: inputText })
  }, [codec, encode, inputText])

  const option = codecByCode(codec)
  const result = useMemo(() => runCodec(codec, inputText, encode), [codec, inputText, encode])
  const noteText = useMemo(() => codecNote(codec, inputText, encode, result), [codec, inputText, encode, result])
  const allRows = useMemo(() => encodeAll(inputText), [inputText])

  const resultLabel = `${option.label} ${encode ? '编码结果' : '解码结果'}`
  const placeholder = encode ? '输入要编码的文字，例如 Hello 你好' : `粘贴要解码的内容，例如 ${option.sample}`
  const emptyHint = encode ? '选择编码方式并输入内容后自动计算' : `粘贴 ${option.label} 内容后自动解码`

  const copy = (value: string) => {
    if (value === '') {
      Taro.showToast({ title: '没有可复制的内容', icon: 'none' })
      return
    }
    Taro.setClipboardData({ data: value })
      .then(() => Taro.showToast({ title: '已复制', icon: 'none' }))
      .catch(() => Taro.showToast({ title: '复制失败', icon: 'none' }))
  }

  const hasResult = result.text !== '' || result.error !== ''

  return (
    <PageWithMenu>
      <NavBar title='常用编码' />
      <View className='container'>
        <View className='card'>
          <View className='card-head'>
            <Text className='card-title'>输入</Text>
            <Text className='head-action' onClick={() => setInputText('')}>
              清空
            </Text>
          </View>

          <View className='chip-wrap'>
            {CODEC_OPTIONS.map((item) => (
              <View
                className={item.code === codec ? 'chip chip-active' : 'chip'}
                key={item.code}
                hoverClass='chip-hover'
                onClick={() => setCodec(item.code)}
              >
                <Text className={item.code === codec ? 'chip-text chip-text-active' : 'chip-text'}>{item.label}</Text>
              </View>
            ))}
          </View>

          <View className='seg-row'>
            <View
              className={encode ? 'seg seg-active' : 'seg'}
              hoverClass='seg-hover'
              onClick={() => setEncode(true)}
            >
              <Text className={encode ? 'seg-text seg-text-active' : 'seg-text'}>编码</Text>
            </View>
            <View
              className={encode ? 'seg' : 'seg seg-active'}
              hoverClass='seg-hover'
              onClick={() => setEncode(false)}
            >
              <Text className={encode ? 'seg-text' : 'seg-text seg-text-active'}>解码</Text>
            </View>
          </View>

          <Textarea
            className='input-area'
            maxlength={-1}
            value={inputText}
            placeholder={placeholder}
            onInput={(event) => setInputText(String(event.detail.value ?? ''))}
          />
        </View>

        {hasResult ? (
          <View className='card'>
            <View className='card-head'>
              <Text className='result-label'>{resultLabel}</Text>
              {result.text !== '' && (
                <Text className='head-action' onClick={() => copy(result.text)}>
                  复制
                </Text>
              )}
            </View>
            {result.text !== '' && (
              <View className='output-box'>
                <Text className='output-text' selectable>
                  {result.text}
                </Text>
              </View>
            )}
            {noteText !== '' && <Text className='stat-text'>{noteText}</Text>}
            {result.error !== '' && <Text className='warn-text'>{result.error}</Text>}
          </View>
        ) : (
          <View className='card'>
            <View className='empty-box'>
              <Text className='empty-icon'>🔤</Text>
              <Text className='empty-text'>{emptyHint}</Text>
            </View>
          </View>
        )}

        <View className='card'>
          <Text className='card-title'>全部编码</Text>
          <Text className='hint-text'>同一段文字按所有方式编码一遍，点任意一行复制该结果。</Text>
          {allRows.map((row) => (
            <View className='codec-row' key={row.label} hoverClass='codec-row-hover' onClick={() => copy(row.value)}>
              <Text className='codec-label'>{row.label}</Text>
              <Text className='codec-value'>{row.short}</Text>
            </View>
          ))}
          {allRows.length === 0 && (
            <View className='empty-box'>
              <Text className='empty-text'>输入内容后这里会列出 7 种编码结果</Text>
            </View>
          )}
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

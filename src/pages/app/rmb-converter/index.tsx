// 人民币大写：数字金额 → 中文大写

import { useState } from 'react'
import Taro from '@tarojs/taro'
import { Input, Text, View } from '@tarojs/components'

import AppMenu from '../../../components/app-menu'
import NavBar from '../../../components/nav-bar'
import { sanitizeDecimal } from '../../../common/format'
import { convertCurrency } from './lib'

import './index.scss'

export default function RmbConverter() {
  const [amount, setAmount] = useState('')
  const [resultText, setResultText] = useState('')

  const convert = (value: string) => {
    setResultText(value === '' ? '' : convertCurrency(value))
  }

  const onAmountInput = (event) => {
    const value = sanitizeDecimal(String(event.detail.value ?? ''))
    setAmount(value)
    convert(value)
  }

  const clearAll = () => {
    setAmount('')
    setResultText('')
  }

  const copyResult = () => {
    if (resultText === '') {
      Taro.showToast({ title: '暂无转换结果', icon: 'none' })
      return
    }
    Taro.setClipboardData({
      data: resultText,
      success: () => {
        Taro.showToast({ title: '已复制到剪贴板', icon: 'none' })
      },
      fail: () => {
        Taro.showToast({ title: '复制失败', icon: 'none' })
      }
    })
  }

  return (
    <View className='page-with-menu'>
      <NavBar title='人民币大写' />
      <View className='container'>
        {/* 输入区 */}
        <View className='card'>
          <View className='field-row'>
            <Input
              className='amount-input'
              type='digit'
              maxlength={14}
              placeholder='请输入金额，如 12345.67'
              value={amount}
              onInput={onAmountInput}
            />
            {amount.length > 0 && (
              <Text className='clear-btn' onClick={clearAll}>
                ×
              </Text>
            )}
          </View>
        </View>

        {/* 分隔标题 */}
        <View className='divider-row'>
          <View className='divider-line' />
          <Text className='divider-text'>转换结果</Text>
          <View className='divider-line' />
        </View>

        {/* 结果区 */}
        <View className='card'>
          <View className='result-box' onClick={copyResult}>
            {resultText !== '' ? (
              <Text className='result-text' selectable>
                {resultText}
              </Text>
            ) : (
              <Text className='result-text result-placeholder'>转换结果将显示在这里</Text>
            )}
          </View>
          <Text className='tip'>轻点结果即可复制到剪贴板</Text>
        </View>
      </View>
      <AppMenu />
    </View>
  )
}

// 身份证解析：校验 18 位号码，解析省份 / 出生日期 / 性别 / 周岁

import { useState } from 'react'
import { Input, Text, View } from '@tarojs/components'

import PageWithMenu from '../../../components/page-with-menu'
import NavBar from '../../../components/nav-bar'
import { pad2, todayParts } from '../../../common/date'
import { parseIdCard } from './lib'

import './index.scss'

export default function IdCard() {
  const [idInput, setIdInput] = useState('')

  const [ty, tm, td] = todayParts()
  const result = parseIdCard(idInput, ty, tm, td)
  // 长度 / 字符不合法时 birthYear 为 0，只显示提示
  const formatBad = result.message !== '' && result.birthYear === 0
  const show = idInput.trim() !== ''

  return (
    <PageWithMenu>
      <NavBar title='身份证解析' />
      <View className='container'>
        <View className='card'>
          <Text className='card-title'>身份证号码</Text>
          <View className='field-row'>
            <Input
              className='input-box'
              type='text'
              maxlength={18}
              placeholder='18 位身份证号（末位可为 X）'
              value={idInput}
              onInput={(event) => setIdInput(String(event.detail.value ?? ''))}
            />
          </View>
        </View>

        {show && (
          <View className='card'>
            <Text className='card-title'>解析结果</Text>
            <View className='metric-row'>
              <Text className='metric-label'>校验</Text>
              <Text className={result.checksumOk ? 'metric-value ok' : 'metric-value warn'}>
                {formatBad ? '无效' : result.checksumOk ? '校验通过' : '校验失败'}
              </Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>户籍省份</Text>
              <Text className='metric-value'>{formatBad ? '-' : result.province}</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>出生日期</Text>
              <Text className='metric-value'>
                {formatBad ? '-' : `${result.birthYear}-${pad2(result.birthMonth)}-${pad2(result.birthDay)}`}
              </Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>性别</Text>
              <Text className='metric-value'>{formatBad ? '-' : result.gender}</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>周岁</Text>
              <Text className='metric-value'>{formatBad || result.age < 0 ? '-' : result.age}</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>地区代码</Text>
              <Text className='metric-value'>{formatBad ? '-' : result.regionRaw}</Text>
            </View>
            {result.message !== '' && <Text className='tip-text'>{result.message}</Text>}
          </View>
        )}

        <Text className='tip-text page-tip'>
          按 GB 11643 校验位规则解析 18 位号码：前 6 位为行政区划代码（此处仅解析到省级），7–14 位出生日期，15–17
          位顺序码（奇男偶女），第 18 位为校验码。仅供格式参考，请勿在公开场合随意输入他人证件。
        </Text>
      </View>
    </PageWithMenu>
  )
}

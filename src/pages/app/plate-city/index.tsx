// 车牌归属地：输入车牌或选择省份 + 字母，查车辆登记地

import { useMemo, useState } from 'react'
import { Input, Picker, Text, View } from '@tarojs/components'

import AppMenu from '../../../components/app-menu'
import NavBar from '../../../components/nav-bar'
import { plateProvinces } from './data'
import {
  indexOfLetter,
  letterLabelsOf,
  letterOfIndex,
  letterRowsOf,
  lookupPlate,
  provinceIndexOf,
  provinceLabelOf
} from './lib'

import './index.scss'

const samples: string[] = ['浙A', '粤B', '京A12345', '苏E', '川A']

export default function PlateCity() {
  const [plateInput, setPlateInput] = useState('浙A')

  // 查询结果与输入框单向绑定；选择器状态由结果反推，避免两份状态不同步
  const result = useMemo(() => lookupPlate(plateInput), [plateInput])
  const provinceIndex = useMemo(() => (result.matched ? provinceIndexOf(result.prefix) : 0), [result])
  const prov = plateProvinces[provinceIndex >= 0 ? provinceIndex : 0]
  const letterLabels = useMemo(() => letterLabelsOf(prov), [prov])
  const letterIndex = result.matched ? indexOfLetter(result.letter) : 0

  const provinceLabels = useMemo(() => plateProvinces.map(provinceLabelOf), [])

  const rows = result.matched && result.letter === '' ? letterRowsOf(prov) : []
  const showAllRows = rows.length > 0

  const pickProvince = (index: number) => {
    const next = plateProvinces[index]
    if (next == null) {
      return
    }
    // 换省份时字母重置为「不限」
    setPlateInput(next.prefix)
  }

  const pickLetter = (index: number) => {
    setPlateInput(prov.prefix + letterOfIndex(index))
  }

  return (
    <View className='page-with-menu'>
      <NavBar title='车牌归属地' />
      <View className='container'>
        <View className='card'>
          <Text className='card-title'>输入车牌</Text>
          <View className='field-row'>
            <Text className='field-label'>车牌号</Text>
            <Input
              className='input-box'
              type='text'
              maxlength={10}
              placeholder='如 浙A12345 / 粤B'
              value={plateInput}
              onInput={(event) => setPlateInput(String(event.detail.value ?? ''))}
            />
          </View>
          <View className='pick-row'>
            <View className='pick-cell'>
              <Picker
                className='pick-picker'
                mode='selector'
                range={provinceLabels}
                value={provinceIndex >= 0 ? provinceIndex : 0}
                onChange={(event) => pickProvince(Number(event.detail.value))}
              >
                <View className='pick-box' hoverClass='pick-box-hover'>
                  <Text className='pick-text'>{provinceLabelOf(prov)}</Text>
                  <Text className='pick-arrow'>▾</Text>
                </View>
              </Picker>
            </View>
            <View className='pick-cell pick-cell-gap'>
              <Picker
                className='pick-picker'
                mode='selector'
                range={letterLabels}
                value={letterIndex}
                onChange={(event) => pickLetter(Number(event.detail.value))}
              >
                <View className='pick-box' hoverClass='pick-box-hover'>
                  <Text className='pick-text'>{letterLabels[letterIndex]}</Text>
                  <Text className='pick-arrow'>▾</Text>
                </View>
              </Picker>
            </View>
          </View>
          <Text className='hint-text'>也可以直接输入完整车牌（如 浙A12345）。只选省份时为该省全部号段。</Text>
          <View className='chips'>
            {samples.map((sample) => (
              <View className='chip' key={sample} hoverClass='chip-hover' onClick={() => setPlateInput(sample)}>
                <Text className='chip-text'>{sample}</Text>
              </View>
            ))}
          </View>
        </View>

        {result.matched ? (
          <View className='card'>
            <Text className='card-title'>查询结果</Text>
            <View className='metric-row'>
              <Text className='metric-label'>号牌归属</Text>
              <Text className='metric-value accent'>{result.detail}</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>所在省份</Text>
              <Text className='metric-value'>{result.provinceName}</Text>
            </View>
            <View className='metric-row'>
              <Text className='metric-label'>号牌前缀</Text>
              <Text className='metric-value'>{result.prefix + result.letter}</Text>
            </View>
            {result.note !== '' && <Text className='tip-text'>{result.note}</Text>}
          </View>
        ) : (
          plateInput !== '' && (
            <View className='card'>
              <Text className='card-title'>查询结果</Text>
              <Text className='tip-text'>{result.note}</Text>
            </View>
          )
        )}

        {showAllRows && (
          <View className='card'>
            <Text className='card-title'>
              {prov.prefix} · {prov.name}（{rows.length} 个号段）
            </Text>
            {rows.map((row) => (
              <View
                className='row-item'
                key={row.letter}
                hoverClass='row-item-hover'
                onClick={() => setPlateInput(prov.prefix + row.letter)}
              >
                <Text className='row-code'>
                  {prov.prefix}
                  {row.letter}
                </Text>
                <Text className='row-city'>{row.city}</Text>
              </View>
            ))}
            <Text className='hint-text'>点任意一行可直接查询该字母的归属地。</Text>
          </View>
        )}

        <Text className='tip-text page-tip'>
          收录 92 式号牌编排，按各地交管现行规则整理；直辖市字母只表示发牌顺序，不区分城区。
        </Text>
      </View>
      <AppMenu />
    </View>
  )
}

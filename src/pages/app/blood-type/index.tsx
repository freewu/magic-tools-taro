// 血型遗传：按父母 ABO 表型估算子女各血型概率

import { useState } from 'react'
import { Picker, Text, View } from '@tarojs/components'

import AppMenu from '../../../components/app-menu'
import NavBar from '../../../components/nav-bar'
import { TYPE_NAMES, calcChildren } from './lib'

import './index.scss'

export default function BloodType() {
  const [fatherIdx, setFatherIdx] = useState(0)
  const [motherIdx, setMotherIdx] = useState(2)

  const children = calcChildren(fatherIdx, motherIdx)

  return (
    <View className='page-with-menu'>
      <NavBar title='血型遗传' />
      <View className='container'>
        <View className='card'>
          <Text className='card-title'>父母血型</Text>
          <View className='field-row'>
            <Text className='field-label'>父亲</Text>
            <Picker
              mode='selector'
              range={TYPE_NAMES}
              value={fatherIdx}
              onChange={(event) => setFatherIdx(Number(event.detail.value))}
            >
              <View className='pick-box' hoverClass='pick-box-hover'>
                <Text className='pick-text'>{TYPE_NAMES[fatherIdx]}</Text>
                <Text className='pick-arrow'>▾</Text>
              </View>
            </Picker>
          </View>
          <View className='field-row'>
            <Text className='field-label'>母亲</Text>
            <Picker
              mode='selector'
              range={TYPE_NAMES}
              value={motherIdx}
              onChange={(event) => setMotherIdx(Number(event.detail.value))}
            >
              <View className='pick-box' hoverClass='pick-box-hover'>
                <Text className='pick-text'>{TYPE_NAMES[motherIdx]}</Text>
                <Text className='pick-arrow'>▾</Text>
              </View>
            </Picker>
          </View>
        </View>

        <View className='card'>
          <Text className='card-title'>子女血型（按概率排序）</Text>
          {children.map((item, index) => (
            <View className='metric-row' key={item.typeName}>
              <Text className='metric-label'>{item.typeName}</Text>
              <Text className={index === 0 ? 'metric-value accent' : 'metric-value'}>{item.pct}%</Text>
            </View>
          ))}
          <Text className='tip-text'>不可能出现的血型不会列入，所列血型均有可能。</Text>
        </View>

        <Text className='tip-text page-tip'>
          按 ABO 血型孟德尔遗传估算（采用中国人群大致基因频率），仅为参考；若遇亲子血型不符的疑问请以医院正规血型鉴定及医学咨询为准。
        </Text>
      </View>
      <AppMenu />
    </View>
  )
}

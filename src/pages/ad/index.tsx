import Taro from '@tarojs/taro'
import { Text, View } from '@tarojs/components'

import './index.scss'

const buttonNames = ['主要按钮', '成功按钮', '信息按钮', '警告按钮', '危险按钮']
const buttonColors = ['#2979FF', '#19BE6B', '#909399', '#FF9900', '#FA3534']

export default function Ad() {
  const onDemoTap = (name: string) => {
    Taro.showToast({ title: `${name}（示例）`, icon: 'none' })
  }

  return (
    <View className='page'>
      <View className='container'>
        <View className='card'>
          <Text className='card-title'>广告</Text>
          <Text className='card-text'>
            此处为广告位预留区域，当前未接入任何广告 SDK，以下按钮为原生按钮的样式演示。
          </Text>
        </View>

        <View className='card'>
          <Text className='card-title'>按钮样式预览</Text>
          {buttonNames.map((name, index) => (
            <View className='btn-row' key={name}>
              <View
                className='demo-btn'
                style={{ backgroundColor: buttonColors[index] }}
                hoverClass='demo-btn-hover'
                onClick={() => onDemoTap(name)}
              >
                <Text className='demo-btn-text'>{name}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

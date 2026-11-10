import { Text, View } from '@tarojs/components'

import { updateLogs } from './data'

import NavBar from '../../components/nav-bar'

import './index.scss'

export default function About() {
  return (
    <View className='page'>
      <NavBar title='关于' back={false} />
      <View className='container'>
        <View className='card'>
          <Text className='card-title'>应用说明</Text>
          <Text className='card-text'>
            Magic 工具箱 是一个常用工具应用合集，目前包含人民币大写、BMI 计算、世界时间、2027 放假查询等小工具。
          </Text>
          <Text className='card-text'>本应用由 Taro + React 构建，可运行在小程序、H5 以及 React Native 平台。</Text>
          <Text className='card-text'>有想法或发现 bug，欢迎联系作者 freewu@github 反馈。</Text>
        </View>

        <View className='card'>
          <Text className='card-title'>更新记录</Text>
          {updateLogs.map((log, index) => (
            <View className='log-item' key={`${log.title}-${index}`}>
              <View className='log-head'>
                <Text className='log-title'>{log.title}</Text>
                {log.date !== '' && <Text className='log-date'>{log.date}</Text>}
              </View>
              {log.content.map((line, lineIndex) => (
                <View className='log-line' key={lineIndex}>
                  <Text className='log-dot'>•</Text>
                  <Text className='log-text'>{line}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

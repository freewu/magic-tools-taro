import { useEffect, useState, type PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'

import AntdProvider from './common/antd-provider'
import { hydrateStorage } from './common/storage'

import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  // RN 端本地存储是异步的（见 common/storage.ts），先把已保存的设置读进内存再渲染页面，
  // 否则首页会先用默认值渲染、设置页也可能读到空值。
  const [ready, setReady] = useState(false)

  useLaunch(() => {
    console.log('magic-tools-taro launched')
  })

  useEffect(() => {
    let alive = true
    hydrateStorage().then(() => {
      if (alive) {
        setReady(true)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  if (!ready) {
    return null
  }

  // RN 端需要 antd 的 Provider（内部挂 Portal.Host），否则 Picker 的弹层渲染不出来
  return <AntdProvider>{children}</AntdProvider>
}

export default App

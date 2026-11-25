// 摩斯码播放：点（dot）与划（dash）两段短音，用定时器按 ITU 时序排队播放。
//
// 音频文件来自原项目 static/audio（wav，各平台都能直接播）：
// 点 60ms、划 180ms、620Hz，对应 20 WPM。
// 播放失败（平台不支持 / 文件缺失 / 静音模式）一律静默忽略，不影响编解码。

import Taro from '@tarojs/taro'

import type { MorseTone } from './lib'

import dotSource from '../../../static/audio/morse-dot.wav'
import dahSource from '../../../static/audio/morse-dah.wav'

let dotAudio: Taro.InnerAudioContext | null = null
let dahAudio: Taro.InnerAudioContext | null = null
let audioReady = false
/** 已排队的定时器，停止时统一清掉 */
let timers: ReturnType<typeof setTimeout>[] = []

function createPlayer(src: string): Taro.InnerAudioContext | null {
  try {
    const player = Taro.createInnerAudioContext()
    player.src = src
    player.volume = 0.9
    return player
  } catch (e) {
    return null
  }
}

/** 首次播放前把两个播放器建好 */
export function prepareMorseAudio(): void {
  if (audioReady) {
    return
  }
  audioReady = true
  dotAudio = createPlayer(dotSource)
  dahAudio = createPlayer(dahSource)
}

/** 停掉所有排队中的音 */
export function stopMorseAudio(): void {
  for (let i = 0; i < timers.length; i++) {
    try {
      clearTimeout(timers[i])
    } catch (e) {
      // 忽略
    }
  }
  timers = []
  try {
    dotAudio?.stop()
    dahAudio?.stop()
  } catch (e) {
    // 忽略
  }
}

/** 一次播放的情况：排入的音数与预计结束时间 */
export type MorsePlayback = {
  /** 实际排入的音数（超过上限的部分被截断） */
  count: number
  /** 总音数 */
  total: number
  /** 预计结束时间（毫秒，从开始播放算） */
  endMs: number
}

/** 按起始时间把音排进定时器；超过 limitMs 的部分直接丢弃 */
export function playMorseTones(tones: MorseTone[], limitMs: number): MorsePlayback {
  const playback: MorsePlayback = { count: 0, total: tones.length, endMs: 0 }
  prepareMorseAudio()
  for (let i = 0; i < tones.length; i++) {
    const tone = tones[i]
    if (tone.startMs > limitMs) {
      break
    }
    const isDah = tone.isDah
    const id = setTimeout(() => {
      const player = isDah ? dahAudio : dotAudio
      if (player == null) {
        return
      }
      try {
        player.stop()
        player.play()
      } catch (e) {
        // 忽略
      }
    }, tone.startMs)
    timers.push(id)
    playback.count += 1
    const end = tone.startMs + tone.durationMs
    if (end > playback.endMs) {
      playback.endMs = end
    }
  }
  return playback
}

// RN 端的播放实现：Taro 的 createInnerAudioContext 在 RN 下依赖 expo-av
// （需要额外的原生模块），本项目没有引入，所以 Android 端不出声。
//
// 这里保持与 audio.ts 完全一致的导出，页面代码两端共用；页面读到
// MORSE_AUDIO_SUPPORTED === false 时会把「播放」按钮换成提示。

import type { MorseTone } from './lib'

/** 当前平台能否出声 */
export const MORSE_AUDIO_SUPPORTED = false

/** 一次播放的情况：排入的音数与预计结束时间 */
export type MorsePlayback = {
  /** 实际排入的音数（超过上限的部分被截断） */
  count: number
  /** 总音数 */
  total: number
  /** 预计结束时间（毫秒，从开始播放算） */
  endMs: number
}

/** RN 端不需要预热音频 */
export function prepareMorseAudio(): void {
  // 无音频模块，忽略
}

/** RN 端没有排队中的音 */
export function stopMorseAudio(): void {
  // 无音频模块，忽略
}

/** RN 端不播放，直接返回空结果 */
export function playMorseTones(tones: MorseTone[], _limitMs: number): MorsePlayback {
  return { count: 0, total: tones.length, endMs: 0 }
}

// 生肖年龄：年份 ↔ 生肖 / 干支互查 + 虚岁周岁换算 + 十二生肖速查

import { useEffect, useMemo, useState } from 'react'
import { Input, Text, View } from '@tarojs/components'

import PageWithMenu from '../../../components/page-with-menu'
import NavBar from '../../../components/nav-bar'
import {
  ZODIACS,
  ageOf,
  benmingTextOf,
  chongOf,
  ganzhiOfYear,
  liuheOf,
  loadZodiacDraft,
  nextYearOfZodiac,
  parseYearText,
  recentYearsText,
  sanheOf,
  saveZodiacDraft,
  yearsOfZodiac,
  yearsTitleOf,
  zodiacByIndex,
  zodiacHourLine,
  zodiacIndexOfYear,
  zodiacNameWithBranch,
  zodiacOfYear,
  zodiacTitle,
  zodiacYearAgeText,
  zodiacYearTag,
  zhouTextOf,
  xuTextOf
} from './lib'

import './index.scss'

/** 今年的公历年（虚岁 / 周岁 / 本命年都以此为准） */
const CURRENT_YEAR = new Date().getFullYear()

const TIPS: string[] = [
  '· 生肖按农历年划分：公历年份输入的是该年农历年（春节之后）的生肖，1~2 月春节前出生的人仍属上一个生肖，需按农历核对。',
  '· 虚岁：出生即 1 岁，每过一个春节加 1 岁，= 今年 − 出生年 + 1。',
  '· 周岁：满一年才算一岁，今年生日还没过再减 1（用上方「今年生日」切换）。',
  '· 本命年：与本人生肖相同的年份，每隔 12 年一次。',
  '· 六合 / 三合 / 相冲：传统择日与合婚里的生肖配对，六合 1 个、三合 2 个、相冲 1 个。'
]

export default function ZodiacAge() {
  const draft = loadZodiacDraft(CURRENT_YEAR)
  const [birthText, setBirthText] = useState(() => draft.birthText)
  const [zodiacIndex, setZodiacIndex] = useState(() => draft.zodiacIndex)
  const [birthdayPassed, setBirthdayPassed] = useState(() => draft.birthdayPassed)

  // 每次改动都存一份，下次打开直接回显
  useEffect(() => {
    saveZodiacDraft({ birthText, zodiacIndex, birthdayPassed })
  }, [birthText, zodiacIndex, birthdayPassed])

  const year = useMemo(() => parseYearText(birthText), [birthText])
  const yearValid = year > 0

  // 出生年份 → 生肖 / 干支 / 年龄 / 生肖关系
  const result = useMemo(() => {
    if (!yearValid) {
      return null
    }
    const zodiac = zodiacOfYear(year)
    const info = ageOf(year, CURRENT_YEAR, birthdayPassed)
    const sanhe = sanheOf(zodiac.index)
    return {
      emoji: zodiac.emoji,
      name: zodiacNameWithBranch(zodiac),
      sub: `${ganzhiOfYear(year)}年 · ${zodiacHourLine(zodiac)}`,
      metrics: [
        { label: '出生年份', value: `${year} 年` },
        { label: '今年虚岁', value: xuTextOf(info) },
        { label: '今年周岁', value: zhouTextOf(info) },
        { label: '本命年', value: benmingTextOf(info) }
      ],
      relText: `六合 ${zodiacTitle(liuheOf(zodiac.index))}　三合 ${sanhe
        .map((item) => zodiacTitle(item))
        .join('、')}　相冲 ${zodiacTitle(chongOf(zodiac.index))}`
    }
  }, [year, yearValid, birthdayPassed])

  // 选中生肖的年份列表（近 100 年）
  const list = useMemo(() => {
    const zodiac = zodiacByIndex(zodiacIndex)
    const rows = yearsOfZodiac(zodiacIndex, CURRENT_YEAR, birthdayPassed)
    const next = nextYearOfZodiac(zodiacIndex, CURRENT_YEAR)
    return {
      zodiac,
      rows,
      title: yearsTitleOf(zodiac, rows.length),
      benmingHint:
        zodiacIndex === zodiacIndexOfYear(CURRENT_YEAR) ? `今年 ${CURRENT_YEAR} 年就是${zodiac.name}年` : '',
      nextText: `下一个${zodiac.name}年：${next} 年（还有 ${next - CURRENT_YEAR} 年）`
    }
  }, [zodiacIndex, birthdayPassed])

  // 输入年份时同步选中生肖，方便直接看它近 100 年的年份
  const applyBirthText = (text: string) => {
    setBirthText(text)
    const parsed = parseYearText(text)
    if (parsed > 0) {
      setZodiacIndex(zodiacIndexOfYear(parsed))
    }
  }

  // 年份加减：空或非法时以今年为基准
  const step = (delta: number) => {
    const parsed = parseYearText(birthText)
    const base = parsed < 0 ? CURRENT_YEAR : parsed
    const next = base + delta
    applyBirthText(`${next < 1 ? 1 : next}`)
  }

  const pickYear = (value: number) => {
    setBirthText(`${value}`)
  }

  return (
    <PageWithMenu>
      <NavBar title='生肖年龄' />
      <View className='container'>
        <View className='card'>
          <View className='card-head'>
            <Text className='card-title'>出生年份查生肖</Text>
            <Text className='head-action' onClick={() => applyBirthText(`${CURRENT_YEAR}`)}>
              今年
            </Text>
          </View>

          <View className='year-row'>
            <View className='step-btn' hoverClass='step-btn-hover' onClick={() => step(-1)}>
              <Text className='step-text'>−</Text>
            </View>
            <Input
              className='year-input'
              type='number'
              maxlength={4}
              placeholder='如 1990'
              value={birthText}
              onInput={(event) => applyBirthText(String(event.detail.value ?? ''))}
            />
            <Text className='year-unit'>年</Text>
            <View className='step-btn' hoverClass='step-btn-hover' onClick={() => step(1)}>
              <Text className='step-text'>＋</Text>
            </View>
          </View>

          {result != null ? (
            <View className='result-box'>
              <View className='result-main'>
                <Text className='result-emoji'>{result.emoji}</Text>
                <View className='result-info'>
                  <Text className='result-name'>{result.name}</Text>
                  <Text className='result-sub'>{result.sub}</Text>
                </View>
              </View>

              <View className='seg-row'>
                <View
                  className={birthdayPassed ? 'seg seg-active' : 'seg'}
                  hoverClass='seg-hover'
                  onClick={() => setBirthdayPassed(true)}
                >
                  <Text className={birthdayPassed ? 'seg-text seg-text-active' : 'seg-text'}>今年生日已过</Text>
                </View>
                <View
                  className={birthdayPassed ? 'seg' : 'seg seg-active'}
                  hoverClass='seg-hover'
                  onClick={() => setBirthdayPassed(false)}
                >
                  <Text className={birthdayPassed ? 'seg-text' : 'seg-text seg-text-active'}>还没过</Text>
                </View>
              </View>

              {result.metrics.map((metric) => (
                <View className='metric-row' key={metric.label}>
                  <Text className='metric-label'>{metric.label}</Text>
                  <Text className='metric-value'>{metric.value}</Text>
                </View>
              ))}

              <Text className='rel-text'>{result.relText}</Text>
            </View>
          ) : (
            <View className='empty-box'>
              <Text className='empty-icon'>🎂</Text>
              <Text className='empty-text'>请输入 1 ~ 9999 之间的年份</Text>
            </View>
          )}
        </View>

        <View className='card'>
          <Text className='card-title'>按生肖查年份</Text>
          <Text className='hint-text'>选一个生肖，列出近 100 年里它对应的年份与年龄，点某一年可回填到上方的出生年份。</Text>

          <View className='chip-wrap'>
            {ZODIACS.map((item) => (
              <View
                className={item.index === zodiacIndex ? 'chip chip-active' : 'chip'}
                key={item.index}
                hoverClass='chip-hover'
                onClick={() => setZodiacIndex(item.index)}
              >
                <Text className={item.index === zodiacIndex ? 'chip-text chip-text-active' : 'chip-text'}>
                  {item.emoji} {item.name}
                </Text>
              </View>
            ))}
          </View>

          <View className='list-head'>
            <Text className='list-title'>{list.title}</Text>
            {list.benmingHint !== '' && <Text className='list-sub'>{list.benmingHint}</Text>}
          </View>

          {list.rows.map((row) => (
            <View
              className={row.isCurrent ? 'year-item year-item-current' : 'year-item'}
              key={row.year}
              hoverClass='year-item-hover'
              onClick={() => pickYear(row.year)}
            >
              <View className='year-left'>
                <Text className={row.isCurrent ? 'year-text year-text-current' : 'year-text'}>{row.year}</Text>
                <Text className='year-ganzhi'>{row.ganzhi}</Text>
              </View>
              <Text className={row.isCurrent ? 'year-age year-age-current' : 'year-age'}>
                {zodiacYearAgeText(row)}
              </Text>
              {zodiacYearTag(row) !== '' && <Text className='year-tag'>{zodiacYearTag(row)}</Text>}
            </View>
          ))}

          <Text className='next-text'>{list.nextText}</Text>
        </View>

        <View className='card'>
          <Text className='card-title'>十二生肖速查</Text>
          <Text className='hint-text'>点任意一行切换到该生肖的年份列表。</Text>
          {ZODIACS.map((item) => (
            <View
              className='table-row'
              key={item.index}
              hoverClass='table-row-hover'
              onClick={() => setZodiacIndex(item.index)}
            >
              <Text className={item.index === zodiacIndex ? 'table-name table-name-active' : 'table-name'}>
                {zodiacTitle(item)}
              </Text>
              <Text className='table-branch'>
                {item.branch} · {item.hours}
              </Text>
              <Text className='table-years'>{recentYearsText(item.index, CURRENT_YEAR, 3)}</Text>
            </View>
          ))}
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

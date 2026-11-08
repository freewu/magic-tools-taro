// 单位换算：一套数据驱动的页面，8 个换算工具共用（按 ?id=distance 等切换单位表）
//
// 单位换算的偏好（是否显示参照物、各换算类型默认体系 / 单位）在设置页调整，
// 每次回到本页都会重新读一次，改过就按新默认值重置。

import { useEffect, useMemo, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Input, Picker, Text, View } from '@tarojs/components'

import AppMenu from '../../../components/app-menu'
import { formatNumber, sanitizeSigned, trimNumber } from '../../../common/format'
import { type MeasureCatalog, type MeasureUnit, systemLabelOf } from './catalog'
import { CONVERT_CATALOGS, catalogById } from './catalogs'
import { type ConvertPrefs, encodePrefs, findEntry, loadPrefs } from './prefs'

import './index.scss'

/** 结果行（纯展示数据） */
type Row = {
  label: string
  symbol: string
  text: string
  highlight: boolean
}

/** 参照物 chips（已解析出所属体系与单位） */
type SampleChip = {
  label: string
  system: string
  value: number
  unitId: string
}

/** 体系在 catalog.systems 中的下标（选择器与结果页签共用） */
function systemIndexOf(catalog: MeasureCatalog, systemId: string): number {
  for (let i = 0; i < catalog.systems.length; i++) {
    if (catalog.systems[i] === systemId) {
      return i
    }
  }
  return 0
}

/** 这套单位表里是否有该体系 */
function hasSystem(catalog: MeasureCatalog, systemId: string): boolean {
  for (let i = 0; i < catalog.systems.length; i++) {
    if (catalog.systems[i] === systemId) {
      return true
    }
  }
  return false
}

/** 偏好里给这套单位表选中的单位；没记录或写错时用它自己的默认单位 */
function preferredUnit(catalog: MeasureCatalog, prefs: ConvertPrefs): MeasureUnit {
  const entry = findEntry(prefs, catalog.id)
  if (entry != null) {
    const picked = catalog.unitById(entry.unitId)
    if (picked != null) {
      return picked
    }
  }
  return catalog.defaultUnit()
}

/** 偏好里给这套单位表选中的结果体系下标 */
function preferredTabIndex(catalog: MeasureCatalog, prefs: ConvertPrefs, unit: MeasureUnit): number {
  const entry = findEntry(prefs, catalog.id)
  if (entry != null && hasSystem(catalog, entry.tabSystemId)) {
    return systemIndexOf(catalog, entry.tabSystemId)
  }
  return systemIndexOf(catalog, unit.system)
}

/** 读输入框数值，空值或非法值返回 null */
function parseAmount(text: string): number | null {
  if (text === '') {
    return null
  }
  const amount = parseFloat(text)
  if (!isFinite(amount)) {
    return null
  }
  return amount
}

/** 参照物按所属体系上色：公制蓝 / 英制橙 / 市制绿 */
function chipColorOf(systemId: string): string {
  if (systemId === 'imperial') {
    return '#C2410C'
  }
  if (systemId === 'chinese') {
    return '#1F9D55'
  }
  return '#0B63CE'
}

function chipStyleOf(systemId: string): string {
  if (systemId === 'imperial') {
    return 'background-color:#FFF1E6;border-color:#FFD9BC'
  }
  if (systemId === 'chinese') {
    return 'background-color:#E9F7EF;border-color:#C8E9D5'
  }
  return 'background-color:#EAF2FF;border-color:#CFE0FF'
}

export default function Convert() {
  // 单位表在页面生命周期内固定：仅由 ?id= 决定，未识别时用第一套，保证页面总能打开
  const [catalog] = useState<MeasureCatalog>(() => {
    const params = Taro.getCurrentInstance().router?.params ?? {}
    const found = catalogById(String(params.id ?? ''))
    return found == null ? CONVERT_CATALOGS[0] : found
  })

  // 首次进入时把存储里的偏好应用到默认单位 / 结果体系
  const [initial] = useState(() => {
    const loaded = loadPrefs()
    const unit = preferredUnit(catalog, loaded)
    return {
      prefs: loaded,
      key: encodePrefs(loaded),
      unitId: unit.id,
      tabIndex: preferredTabIndex(catalog, loaded, unit)
    }
  })

  const [prefs, setPrefs] = useState<ConvertPrefs>(initial.prefs)
  const [fromId, setFromId] = useState(initial.unitId)
  const [tabIndex, setTabIndex] = useState(initial.tabIndex)
  const [valueInput, setValueInput] = useState('1')
  const [samplesExpanded, setSamplesExpanded] = useState(true)
  // 已经应用过的偏好快照：用来判断「回到本页时设置有没有改过」
  const [appliedKey, setAppliedKey] = useState(initial.key)

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: `${catalog.name}换算` })
  }, [catalog])

  // 从设置页回来时重新读偏好：改了就按新默认值重置体系 / 单位 / 结果体系
  useDidShow(() => {
    const loaded = loadPrefs()
    const key = encodePrefs(loaded)
    setPrefs(loaded)
    if (key !== appliedKey) {
      setAppliedKey(key)
      const unit = preferredUnit(catalog, loaded)
      setFromId(unit.id)
      setTabIndex(preferredTabIndex(catalog, loaded, unit))
    }
  })

  // 当前输入单位；配置异常时退回默认单位
  const unit = useMemo(() => {
    const found = catalog.unitById(fromId)
    return found == null ? catalog.defaultUnit() : found
  }, [catalog, fromId])

  const splits = catalog.splitsBySystem()
  const systemTexts = useMemo(() => catalog.systems.map((id) => systemLabelOf(id)), [catalog])
  const systemIndex = systemIndexOf(catalog, unit.system)

  // 单位选项只列当前体系下的单位（不分体系的换算一次列出全部）
  const unitList = useMemo(
    () => (splits ? catalog.unitsOf(unit.system) : catalog.units),
    [catalog, splits, unit]
  )
  const unitTexts = useMemo(() => unitList.map((item) => `${item.label}（${item.symbol}）`), [unitList])

  const samples = useMemo<SampleChip[]>(() => {
    const out: SampleChip[] = []
    for (let i = 0; i < catalog.samples.length; i++) {
      const sample = catalog.samples[i]
      const sampleUnit = catalog.unitOfSample(sample)
      if (sampleUnit != null) {
        out.push({ label: sample.label, system: sampleUnit.system, value: sample.value, unitId: sampleUnit.id })
      }
    }
    return out
  }, [catalog])

  const amount = parseAmount(valueInput)

  const rows = useMemo<Row[]>(() => {
    if (amount == null) {
      return []
    }
    const list = splits ? catalog.unitsOf(catalog.systems[tabIndex]) : catalog.units
    const out: Row[] = []
    for (let i = 0; i < list.length; i++) {
      const target = list[i]
      const converted = catalog.convert(amount, unit, target)
      out.push({
        label: target.label,
        symbol: target.symbol,
        text: converted == null ? '—' : formatNumber(converted, 10),
        highlight: target.id === unit.id
      })
    }
    return out
  }, [catalog, splits, tabIndex, unit, amount])

  const onUnitChange = (event) => {
    const index = Number(event.detail.value)
    if (index < 0 || index >= unitList.length) {
      return
    }
    setFromId(unitList[index].id)
  }

  // 切体系：自动选中该体系下的第一个单位
  const onSystemChange = (event) => {
    const index = Number(event.detail.value)
    if (index < 0 || index >= catalog.systems.length) {
      return
    }
    const list = catalog.unitsOf(catalog.systems[index])
    if (list.length > 0) {
      setFromId(list[0].id)
    }
  }

  // 点参照物：把数值与单位一起代入
  const applySample = (index: number) => {
    if (index < 0 || index >= samples.length) {
      return
    }
    const sample = samples[index]
    setFromId(sample.unitId)
    setValueInput(trimNumber(sample.value))
  }

  const copyRow = (index: number) => {
    if (index < 0 || index >= rows.length) {
      return
    }
    const row = rows[index]
    Taro.setClipboardData({
      data: `${row.text} ${row.label}`,
      success: () => {
        Taro.showToast({ title: `已复制 ${row.text}`, icon: 'none' })
      }
    })
  }

  return (
    <View className='page-with-menu'>
      <View className='container'>
        {/* 常见参照物：点一下直接代入 */}
        {prefs.showSamples && samples.length > 0 && (
          <View className='card'>
            <View className='card-head' onClick={() => setSamplesExpanded(!samplesExpanded)}>
              <Text className='card-title'>常见{catalog.name}</Text>
              <Text className='head-action'>{samplesExpanded ? '收起' : '展开'}</Text>
            </View>
            {samplesExpanded && (
              <View className='chips'>
                {samples.map((sample, index) => (
                  <View
                    className='chip'
                    key={`${sample.label}-${index}`}
                    hoverClass='chip-hover'
                    style={chipStyleOf(sample.system)}
                    onClick={() => applySample(index)}
                  >
                    <Text className='chip-text' style={`color:${chipColorOf(sample.system)}`}>
                      {sample.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* 输入：数值 + 体系 / 单位（不加卡片标题，保持紧凑） */}
        <View className='card'>
          <View className='field-row'>
            <Text className='field-label'>数值</Text>
            <Input
              className='input-box'
              type='digit'
              placeholder='0'
              value={valueInput}
              onInput={(event) => setValueInput(sanitizeSigned(String(event.detail.value ?? '')))}
            />
            <Text className='unit-suffix'>{unit.symbol}</Text>
          </View>
          {/* 体系与单位并排（双列样式与 BMI 计算一致）：左边选体系，右边选单位 */}
          <View className='pick-row'>
            {splits && (
              <View className='pick-cell'>
                <Text className='pick-label'>体系</Text>
                <View className='pick-field'>
                  <Picker
                    className='pick-fill'
                    mode='selector'
                    range={systemTexts}
                    value={systemIndex}
                    onChange={onSystemChange}
                  >
                    <View className='pick-chip' hoverClass='pick-chip-hover'>
                      <Text className='pick-chip-text'>{systemTexts[systemIndex]}</Text>
                      <Text className='pick-chip-arrow'>▾</Text>
                    </View>
                  </Picker>
                </View>
              </View>
            )}
            <View className={splits ? 'pick-cell pick-cell-gap' : 'pick-cell'}>
              <Text className='pick-label'>单位</Text>
              <View className='pick-field'>
                <Picker
                  className='pick-fill'
                  mode='selector'
                  range={unitTexts}
                  value={unitTexts.indexOf(`${unit.label}（${unit.symbol}）`)}
                  onChange={onUnitChange}
                >
                  <View className='pick-chip' hoverClass='pick-chip-hover'>
                    <Text className='pick-chip-text'>{`${unit.label}（${unit.symbol}）`}</Text>
                    <Text className='pick-chip-arrow'>▾</Text>
                  </View>
                </Picker>
              </View>
            </View>
          </View>
          {unit.note !== '' && <Text className='unit-note'>{unit.note}</Text>}
        </View>

        {/* 结果 */}
        {amount != null ? (
          <View className='card'>
            <View className='result-head'>
              <Text className='result-value'>{formatNumber(amount, 10)}</Text>
              <Text className='result-unit'>{unit.label}</Text>
            </View>
            {splits && (
              <View className='tabs'>
                {systemTexts.map((label, index) => (
                  <View className='tab' key={label} onClick={() => setTabIndex(index)}>
                    <Text className={index === tabIndex ? 'tab-text tab-text-active' : 'tab-text'}>{label}</Text>
                  </View>
                ))}
              </View>
            )}
            {rows.map((row, index) => (
              <View className='result-row' key={`${row.label}-${index}`} hoverClass='result-hover' onClick={() => copyRow(index)}>
                <Text className={row.highlight ? 'row-label row-active' : 'row-label'}>{row.label}</Text>
                <Text className={row.highlight ? 'row-value row-active' : 'row-value'}>{row.text}</Text>
                <Text className='row-symbol'>{row.symbol}</Text>
              </View>
            ))}
            <Text className='tip-text'>基准单位：{catalog.baseName}；点击任意一行可复制结果</Text>
          </View>
        ) : (
          <View className='card'>
            <Text className='empty-text'>输入数值后显示全部单位的换算结果</Text>
          </View>
        )}
      </View>
      <AppMenu />
    </View>
  )
}

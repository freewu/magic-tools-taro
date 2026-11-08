// BMI 计算相关的单位数据

/** 体重单位（显示文本 与 存储值一一对应） */
export const weightUnitTexts: string[] = ['公斤 (kg)', '斤', '磅 (lb)']
export const weightUnitValues: string[] = ['kg', 'jin', 'lb']
/** 简短名称（输入框右侧的单位胶囊） */
export const weightUnitShortTexts: string[] = ['公斤', '斤', '磅']

/** 身高单位 */
export const lengthUnitTexts: string[] = ['米 (m)', '厘米 (cm)', '英尺 (ft)']
export const lengthUnitValues: string[] = ['m', 'cm', 'ft']
export const lengthUnitShortTexts: string[] = ['米', '厘米', '英尺']

/** 根据存储值查找其在列表中的下标，用于选择器 */
export function unitValueIndex(values: string[], value: string): number {
  for (let i = 0; i < values.length; i++) {
    if (values[i] === value) {
      return i
    }
  }
  return 0
}

/** 体重单位的简短名称（用于提示文案） */
export function weightUnitShortName(value: string): string {
  if (value === 'jin') {
    return '斤'
  }
  if (value === 'lb') {
    return '磅'
  }
  return 'kg'
}

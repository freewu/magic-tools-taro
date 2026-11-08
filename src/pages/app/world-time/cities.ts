// 世界时钟的常用城市表（固定 UTC 偏移，不含夏令时切换）
//
// 每个城市只有名称、时区缩写与 UTC 偏移三要素：偏移可以是半小时
// （如印度 +5.5）或三刻钟（如尼泊尔 +5.75），格式化由 lib.ts 负责。

export type CityOption = {
  name: string
  code: string
  offset: number
}

export const CITY_CATALOG: CityOption[] = [
  // ---------------- 亚洲 ----------------
  { name: '北京', code: 'CST', offset: 8 },
  { name: '上海', code: 'CST', offset: 8 },
  { name: '香港', code: 'HKT', offset: 8 },
  { name: '澳门', code: 'CST', offset: 8 },
  { name: '台北', code: 'CST', offset: 8 },
  { name: '东京', code: 'JST', offset: 9 },
  { name: '首尔', code: 'KST', offset: 9 },
  { name: '新加坡', code: 'SGT', offset: 8 },
  { name: '吉隆坡', code: 'MYT', offset: 8 },
  { name: '马尼拉', code: 'PST', offset: 8 },
  { name: '曼谷', code: 'ICT', offset: 7 },
  { name: '雅加达', code: 'WIB', offset: 7 },
  { name: '河内', code: 'ICT', offset: 7 },
  { name: '新德里', code: 'IST', offset: 5.5 },
  { name: '孟买', code: 'IST', offset: 5.5 },
  { name: '加德满都', code: 'NPT', offset: 5.75 },
  { name: '科伦坡', code: 'SLST', offset: 5.5 },
  { name: '达卡', code: 'BST', offset: 6 },
  { name: '仰光', code: 'MMT', offset: 6.5 },
  { name: '卡拉奇', code: 'PKT', offset: 5 },
  { name: '迪拜', code: 'GST', offset: 4 },
  { name: '阿布扎比', code: 'GST', offset: 4 },
  { name: '利雅得', code: 'AST', offset: 3 },
  { name: '德黑兰', code: 'IRST', offset: 3.5 },
  { name: '伊斯坦布尔', code: 'TRT', offset: 3 },
  { name: '莫斯科', code: 'MSK', offset: 3 },
  { name: '第比利斯', code: 'GET', offset: 4 },
  { name: '阿拉木图', code: 'ALMT', offset: 6 },
  { name: '乌兰巴托', code: 'ULAT', offset: 8 },

  // ---------------- 欧洲 ----------------
  { name: '伦敦', code: 'GMT', offset: 0 },
  { name: '都柏林', code: 'GMT', offset: 0 },
  { name: '里斯本', code: 'WET', offset: 0 },
  { name: '雷克雅未克', code: 'GMT', offset: 0 },
  { name: '巴黎', code: 'CET', offset: 1 },
  { name: '柏林', code: 'CET', offset: 1 },
  { name: '罗马', code: 'CET', offset: 1 },
  { name: '马德里', code: 'CET', offset: 1 },
  { name: '阿姆斯特丹', code: 'CET', offset: 1 },
  { name: '苏黎世', code: 'CET', offset: 1 },
  { name: '维也纳', code: 'CET', offset: 1 },
  { name: '布拉格', code: 'CET', offset: 1 },
  { name: '华沙', code: 'CET', offset: 1 },
  { name: '斯德哥尔摩', code: 'CET', offset: 1 },
  { name: '奥斯陆', code: 'CET', offset: 1 },
  { name: '哥本哈根', code: 'CET', offset: 1 },
  { name: '布鲁塞尔', code: 'CET', offset: 1 },
  { name: '雅典', code: 'EET', offset: 2 },
  { name: '赫尔辛基', code: 'EET', offset: 2 },
  { name: '布加勒斯特', code: 'EET', offset: 2 },
  { name: '基辅', code: 'EET', offset: 2 },
  { name: '明斯克', code: 'MSK', offset: 3 },

  // ---------------- 美洲 ----------------
  { name: '纽约', code: 'EST', offset: -5 },
  { name: '华盛顿', code: 'EST', offset: -5 },
  { name: '波士顿', code: 'EST', offset: -5 },
  { name: '多伦多', code: 'EST', offset: -5 },
  { name: '芝加哥', code: 'CST', offset: -6 },
  { name: '达拉斯', code: 'CST', offset: -6 },
  { name: '墨西哥城', code: 'CST', offset: -6 },
  { name: '丹佛', code: 'MST', offset: -7 },
  { name: '洛杉矶', code: 'PST', offset: -8 },
  { name: '旧金山', code: 'PST', offset: -8 },
  { name: '西雅图', code: 'PST', offset: -8 },
  { name: '温哥华', code: 'PST', offset: -8 },
  { name: '安克雷奇', code: 'AKST', offset: -9 },
  { name: '檀香山', code: 'HST', offset: -10 },
  { name: '圣保罗', code: 'BRT', offset: -3 },
  { name: '布宜诺斯艾利斯', code: 'ART', offset: -3 },
  { name: '圣地亚哥', code: 'CLT', offset: -4 },
  { name: '利马', code: 'PET', offset: -5 },
  { name: '波哥大', code: 'COT', offset: -5 },

  // ---------------- 大洋洲 ----------------
  { name: '悉尼', code: 'AEST', offset: 10 },
  { name: '墨尔本', code: 'AEST', offset: 10 },
  { name: '布里斯班', code: 'AEST', offset: 10 },
  { name: '珀斯', code: 'AWST', offset: 8 },
  { name: '努美阿', code: 'NCT', offset: 11 },
  { name: '奥克兰', code: 'NZST', offset: 12 },
  { name: '惠灵顿', code: 'NZST', offset: 12 },
  { name: '苏瓦', code: 'FJT', offset: 12 },

  // ---------------- 非洲 ----------------
  { name: '开罗', code: 'EET', offset: 2 },
  { name: '约翰内斯堡', code: 'SAST', offset: 2 },
  { name: '内罗毕', code: 'EAT', offset: 3 },
  { name: '达累斯萨拉姆', code: 'EAT', offset: 3 },
  { name: '拉各斯', code: 'WAT', offset: 1 },
  { name: '金沙萨', code: 'WAT', offset: 1 },
  { name: '卡萨布兰卡', code: 'WEST', offset: 1 },
  { name: '阿尔及尔', code: 'CET', offset: 1 }
]

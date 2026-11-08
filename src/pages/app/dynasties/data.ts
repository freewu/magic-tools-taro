// 历史朝代数据
//
// year 用整数表示：负数 = 公元前 X 年；正数 = 公元 X 年；endYear = 0 表示延续至今

export type DynastyItem = {
  name: string
  startYear: number
  endYear: number
  capital: string
}

export const dynasties: DynastyItem[] = [
  { name: '夏', startYear: -2070, endYear: -1600, capital: '阳城（今登封）一带' },
  { name: '商', startYear: -1600, endYear: -1046, capital: '殷（今安阳）' },
  { name: '西周', startYear: -1046, endYear: -771, capital: '镐京（今西安）' },
  { name: '春秋', startYear: -770, endYear: -476, capital: '洛邑（今洛阳）等' },
  { name: '战国', startYear: -475, endYear: -221, capital: '七雄各自建都' },
  { name: '秦', startYear: -221, endYear: -207, capital: '咸阳' },
  { name: '西汉', startYear: -202, endYear: 8, capital: '长安（今西安）' },
  { name: '新（王莽）', startYear: 9, endYear: 23, capital: '常安（长安）' },
  { name: '东汉', startYear: 25, endYear: 220, capital: '洛阳' },
  { name: '三国', startYear: 220, endYear: 280, capital: '洛阳 / 成都 / 建业' },
  { name: '西晋', startYear: 265, endYear: 316, capital: '洛阳' },
  { name: '东晋', startYear: 317, endYear: 420, capital: '建康（今南京）' },
  { name: '南北朝', startYear: 420, endYear: 589, capital: '建康 / 平城 / 洛阳等' },
  { name: '隋', startYear: 581, endYear: 618, capital: '大兴（今西安）' },
  { name: '唐', startYear: 618, endYear: 907, capital: '长安（今西安）' },
  { name: '五代十国', startYear: 907, endYear: 960, capital: '汴梁（今开封）等' },
  { name: '北宋', startYear: 960, endYear: 1127, capital: '东京（今开封）' },
  { name: '南宋', startYear: 1127, endYear: 1279, capital: '临安（今杭州）' },
  { name: '元', startYear: 1271, endYear: 1368, capital: '大都（今北京）' },
  { name: '明', startYear: 1368, endYear: 1644, capital: '应天（今南京）→ 北京' },
  { name: '清', startYear: 1644, endYear: 1912, capital: '北京（盛京为陪都）' },
  { name: '中华民国', startYear: 1912, endYear: 1949, capital: '南京（曾迁都重庆）' },
  { name: '中华人民共和国', startYear: 1949, endYear: 0, capital: '北京' }
]

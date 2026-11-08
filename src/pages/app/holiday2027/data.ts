// 2027 年放假安排数据
/**
一、元旦：1月1日至3日放假，共3天，不调休。
二、春节：2月5日至13日放假调休，共9天。1月31日、2月14日上班。
三、清明节：4月3日至5日放假，共3天，不调休。
四、劳动节：5月1日至5日放假调休，共5天。5月8日上班。
五、端午节：6月9日放假，共1天，不调休。
六、中秋节：9月15日放假，共1天，不调休。
七、国庆节：10月1日至7日放假调休，共7天。9月26日、10月9日上班。
 */

/** 应用只覆盖 2027 年，跨年调休（如 1/31）也落在该年内 */
export const HOLIDAY_YEAR = 2027

export type HolidayPlan = {
  name: string
  /** 放假起止（含首尾），YYYY-MM-DD */
  start: string
  end: string
  days: number
  /** 调休上班日，YYYY-MM-DD */
  workdays: string[]
}

export const holidays: HolidayPlan[] = [
  {
    name: '元旦',
    start: '2027-01-01',
    end: '2027-01-03',
    days: 3,
    workdays: []
  },
  {
    name: '春节',
    start: '2027-02-05',
    end: '2027-02-13',
    days: 9,
    workdays: ['2027-01-31', '2027-02-14']
  },
  {
    name: '清明节',
    start: '2027-04-03',
    end: '2027-04-05',
    days: 3,
    workdays: []
  },
  {
    name: '劳动节',
    start: '2027-05-01',
    end: '2027-05-05',
    days: 5,
    workdays: ['2027-05-08']
  },
  {
    name: '端午节',
    start: '2027-06-09',
    end: '2027-06-09',
    days: 1,
    workdays: []
  },
  {
    name: '中秋节',
    start: '2027-09-15',
    end: '2027-09-15',
    days: 1,
    workdays: []
  },
  {
    name: '国庆节',
    start: '2027-10-01',
    end: '2027-10-07',
    days: 7,
    workdays: ['2027-09-26', '2027-10-09']
  }
]

export const holidaySource = '整理自《国务院办公厅关于2027年部分节假日安排的通知》，请以官方最新通知为准'

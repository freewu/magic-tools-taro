# magic-tools-taro

一个基于 **Taro 4 + React 18 + TypeScript** 重构的常用工具应用合集，同一套代码可编译到 **微信 / 京东 / 百度 / 支付宝 / 字节跳动（抖音）/ QQ / 飞书小程序** 与 **H5**。

> 本项目由 uni-app x 版（`.uvue` / `.uts`）**magic-tools-lite** 迁移重构而来，业务逻辑与交互保持一致，界面用 React 组件 + SCSS 重写。

## 功能

- 人民币大写（数字金额转中文大写）
- BMI 计算（支持 kg / 斤 / 磅，m / cm / ft 与单位换算、标准体重区间建议）
- 世界时间（北京 / 东京 / 伦敦 / 纽约 / 悉尼，按固定 UTC 偏移换算）
- 2027 放假安排查询
- 模糊昵称（昵称加组合修饰符，支持模糊 / 雪点 / 雨点效果与强度切换）
- 个人所得税（工资薪金，按全年综合所得均摊到月测算）
- 房贷计算器（等额本息 / 等额本金）
- 复利计算器（支持定期追加投入）
- 日期天干地支（日干支逐日连续；可只填年份查干支纪年与生肖）
- 安全期计算（日历法，排卵日 / 危险期 / 安全期）
- 预产期计算（末次月经 + 280 天，孕周 / 星座）
- 利率计算（存款单利：本金 × 年利率 × 存期）
- 历史朝代（年份查询 + 朝代年表）
- 退休年龄（渐进式延迟法定退休年龄测算）
- 退休金计算（基础养老金 + 个人账户养老金估算）
- 抽奖转盘（自定义奖项随机抽取）
- 血型遗传（ABO 遗传概率估算）
- 车牌城市（省份简称 + 字母查归属地）
- 身份证号码解析（18 位校验位 / 出生 / 性别）
- 单位换算 8 件套（长度 / 面积 / 容量 / 重量 / 温度 / 热量 / 压力 / 速度；公制 / 英制 / 市制分组、常见参照物一键代入、点击结果复制；设置页可配常见参照物开关，并按换算类型分别设置默认体系 / 单位 / 结果体系）
- 基础代谢（Mifflin-St Jeor 公式：BMR + 各活动水平 TDEE）
- 时薪计算（双休 / 大小周 / 996 / 995，时薪 / 日薪 / 月工时 + 历史记录对比）
- 二维码生成（纯本地字节模式编码，四档纠错与自动掩码；内置网址 / 邮箱 / WIFI 示例）

> 迁移进度：uni-app x 版的 22 个工具页与 4 个 tab 页已全部迁移完成，登记列表见 `src/pages/app/index.ts`。

## 项目结构

```
├── config/                 # Taro 构建配置（index / dev / prod）
├── scripts/check.mjs       # 结构自检（路由 / 图标 / 静态资源）
├── src
│   ├── app.ts              # 应用入口组件
│   ├── app.config.ts       # 页面路由与 tabBar 配置
│   ├── app.scss            # 全局样式（页面外壳 / 卡片 / 表单行）
│   ├── index.html          # H5 模板
│   ├── common              # 公共模块（format.ts：数字 / 金额格式化；date.ts：1900 起整数天数的日期计算）
│   ├── components          # 公共组件（app-menu：工具页底部菜单；nav-bar：H5 顶部标题 + 返回）
│   ├── static              # 图片资源（tabBar 图标 8 张 + 置顶图钉 2 张；构建时由 copy 复制到 dist/<平台>/static）
│   └── pages
│       ├── appstore        # 应用商店（tab 首页：搜索名称/简介、置顶 / 取消置顶，lib.ts 承担过滤与置顶存取）
│       ├── ad              # 广告页（tab，占位）
│       ├── settings        # 设置页（tab：BMI 默认单位 / 单位换算偏好）
│       ├── about           # 关于页（tab：应用说明 + 更新记录，data.ts 为日志数据）
│       └── app             # 工具页（每个工具独立目录：index.tsx + index.config.ts + lib.ts + data.ts）
├── project.config.json     # 微信开发者工具项目配置（miniprogramRoot 指向 dist/weapp/）
├── project.lark.json       # 飞书开发者工具项目配置（miniprogramRoot 指向 dist/lark/）
├── justfile                # 统一管理开发 / 构建 / 自检 / 提交
└── types/global.d.ts       # 全局类型声明
```

## 快速开始（just）

项目使用 [just](https://github.com/casey/just) 统一管理常用命令。

前置条件：Node.js >= 18、npm、[just](https://github.com/casey/just#installation)。

```shell
just                 # 显示全部命令（按 环境 / 开发·构建 / 维护 分组）
just doctor          # 检查 node / npm / just / git / 依赖状态
just install         # 安装依赖（有 lock 文件时优先 npm ci）

just dev-h5          # H5 开发（http://localhost:10086）
just dev-weapp       # 微信小程序开发
just dev-swan        # 百度小程序开发
just dev-alipay      # 支付宝小程序开发
just dev-tt          # 字节跳动（抖音）小程序开发
just dev-qq          # QQ 小程序开发
just dev-jd          # 京东小程序开发
just dev-lark        # 飞书小程序开发

just build-h5        # 构建 H5
just build-weapp     # 构建微信小程序
just build-mini      # 构建全部 7 个小程序平台
just build           # 构建 H5 + 全部小程序平台

just typecheck       # TypeScript 类型检查
just check           # 结构自检（页面路由 / tabBar 图标 / 静态资源引用）
just clean           # 清理构建产物
just commit "提交信息"  # git add -A + commit + push
```

各端产物按平台分目录，互不覆盖：

| 平台 | `just` 命令 | 产物目录 | 打开方式 |
| --- | --- | --- | --- |
| H5 | `just dev-h5` / `just build-h5` | `dist/h5/` | 浏览器打开 `dist/h5/index.html`，开发时是 http://localhost:10086 |
| 微信小程序 | `just dev-weapp` / `just build-weapp` | `dist/weapp/` | 微信开发者工具打开项目根目录（`project.config.json` 已指向 `dist/weapp/`） |
| 京东小程序 | `just dev-jd` / `just build-jd` | `dist/jd/` | 京东小程序开发者工具打开 `dist/jd/` |
| 百度小程序 | `just dev-swan` / `just build-swan` | `dist/swan/` | 百度开发者工具打开 `dist/swan/` |
| 支付宝小程序 | `just dev-alipay` / `just build-alipay` | `dist/alipay/` | 支付宝小程序开发者工具打开 `dist/alipay/` |
| 字节跳动（抖音） | `just dev-tt` / `just build-tt` | `dist/tt/` | 抖音开发者工具打开 `dist/tt/` |
| QQ 小程序 | `just dev-qq` / `just build-qq` | `dist/qq/` | QQ 小程序开发者工具打开 `dist/qq/` |
| 飞书小程序 | `just dev-lark` / `just build-lark` | `dist/lark/` | 飞书开发者工具打开项目根目录（`project.lark.json` 已指向 `dist/lark/`） |

> 快手小程序：Taro 4 官方与社区都没有对应的平台插件（`@tarojs/plugin-platform-ks` 不存在），因此暂不支持构建；若确有需要，只能基于字节跳动（tt）产物自行适配，或在其它框架里单独维护。

> 飞书小程序使用的 `@tarojs/plugin-platform-lark` 是社区插件（peerDependencies 仍标注 Taro 3），因此仓库里加了 `.npmrc` 的 `legacy-peer-deps=true`，并请把 `project.lark.json` 里的 `appid` 换成自己的飞书小程序 AppID。

## 迁移约定（uni-app x → Taro）

- 页面 = 目录，入口 `index.tsx`（React 函数组件）+ `index.config.ts`（页面配置）+ 同目录 `lib.ts` / `data.ts`（业务逻辑与数据）
- 模板标签对照：`view` → `View`、`text` → `Text`、`image` → `Image`、`scroll-view` → `ScrollView`、`picker` → `Picker`、`switch` → `Switch`
- 事件与属性对照：`@click` → `onClick`、`hover-class` → `hoverClass`、`:value` → `value`、`v-for` → `map`
- 存储与交互 API：`uni.getStorageSync` → `Taro.getStorageSync`、`uni.navigateTo` / `switchTab` → `Taro.navigateTo` / `switchTab`，以此类推
- 样式：`.uvue` 的 flex 默认值在 Taro 中不存在，横向布局需显式 `display: flex; flex-direction: row`；单位继续沿用 `rpx`
- 工具页统一用 `page-with-menu` 外壳 + `<AppMenu />` 底部菜单
- 产物按平台分目录（`dist/<平台>/`），由 `config/index.ts` 读取 `TARO_ENV` 决定；新增平台只需装对应 `@tarojs/plugin-platform-*` 并加 `build-<平台>` 脚本与 just 配方

## License

[MIT](./LICENSE)

# magic-tools-taro

一个基于 **Taro 4 + React 18 + TypeScript** 重构的常用工具应用合集（应用名：**Magic 工具箱**），同一套代码可编译到 **微信 / 京东 / 百度 / 支付宝 / 字节跳动（抖音）/ QQ / 飞书小程序**、**H5** 与 **Android（React Native）**。

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
├── config/                 # Taro 构建配置（index / dev / prod / postcss-rpx：RN 端 rpx → px 插件）
├── assets/logo.jpg         # 应用图标源图（1280×1280），图标由 scripts/android-icon.py 生成
├── scripts/check.mjs       # 结构自检（路由 / 图标 / 静态资源）
├── scripts/android.mjs     # Android 打包 / 安装（定位 JDK+SDK、同步 bundle、Gradle、adb 装到真机或模拟器）
├── scripts/android-icon.py # 从 assets/logo.jpg 生成 mipmap-* 下的 ic_launcher（含圆形图标）
├── android/                # Android（RN）原生宿主工程（移植自 taro-native-shell 0.73），由 just android 驱动
│   ├── app/                #   AndroidManifest / MainActivity / 图标 / debug.keystore
│   ├── build.gradle        #   Gradle 根配置（SDK / NDK 版本、阿里云镜像）
│   ├── settings.gradle     #   依赖仓库（PREFER_SETTINGS）+ autolinking + Expo modules
│   └── gradlew / gradlew.bat
├── src
│   ├── app.ts              # 应用入口组件
│   ├── app.config.ts       # 页面路由与 tabBar 配置
│   ├── app.scss            # 全局样式（页面外壳 / 卡片 / 表单行）
│   ├── index.html          # H5 模板
│   ├── common              # 公共模块（format.ts：数字 / 金额格式化；date.ts：1900 起整数天数的日期计算；
│   │                       #   storage.ts：本地存储统一入口，RN 端用异步 API + 启动预热的内存缓存）
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
├── index.js                # RN 端入口（Taro 生成，指向 @tarojs/rn-supporter/entry-file.js）
├── metro.config.js         # RN 端 Metro 配置（Taro 生成，合并 @tarojs/rn-supporter 的解析规则）
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
just dev-rn          # Android（RN）开发：启动 Metro（8081）

just android          # Android：打包 release APK + 装到已连接的真机 / 模拟器 + 启动
just android-apk      # Android：只打 APK（android/app/build/outputs/apk/release/）
just android-dev      # Android：装 debug 包，JS 走 Metro 热更新（先跑 just dev-rn）
just android-devices  # Android：列出已连接的真机 / 模拟器
just android-emulator # Android：启动模拟器（不带参数则列出可用 AVD）
just android-doctor   # Android：检查 JDK / SDK / adb / 设备
just android-icon     # Android：从 assets/logo.jpg 重新生成启动图标（需 Python3 + Pillow）

just build-h5        # 构建 H5
just build-weapp     # 构建微信小程序
just build-rn        # 构建 Android（RN）：dist/rn/index.android.bundle
just build-rn-clean  # 清 Metro 缓存重打 RN bundle（改了 app.config.ts 的 pages / tabBar 后用）
just build-mini      # 构建全部 7 个小程序平台
just build           # 构建 H5 + 全部小程序平台 + Android（RN）

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
| Android（RN） | `just dev-rn` / `just build-rn` | `dist/rn/` | JS bundle + 图片资源；要装到设备用 `just android`（见下节） |

> 快手小程序：Taro 4 官方与社区都没有对应的平台插件（`@tarojs/plugin-platform-ks` 不存在），因此暂不支持构建；若确有需要，只能基于字节跳动（tt）产物自行适配，或在其它框架里单独维护。

> 飞书小程序使用的 `@tarojs/plugin-platform-lark` 是社区插件（peerDependencies 仍标注 Taro 3），因此仓库里加了 `.npmrc` 的 `legacy-peer-deps=true`，并请把 `project.lark.json` 里的 `appid` 换成自己的飞书小程序 AppID。

## Android（React Native）端

Taro 的 RN 方案只把业务代码打成 JS bundle，原生壳由本仓库的 `android/` 提供（移植自 [taro-native-shell](https://github.com/NervJS/taro-native-shell) 的 `0.73.0` 分支，对齐 RN 0.73 / Expo 50）。所以打包到设备是一条命令：

```shell
just android          # 打 release APK → 装到已连接的真机 / 模拟器 → 启动
just android-apk      # 只要 APK（android/app/build/outputs/apk/release/app-release.apk）
just android-dev      # 装 debug 包，JS 走 Metro 热更新（另开终端 just dev-rn）
just android-devices  # 看设备列表
just android-emulator # 启动模拟器（不带参数则列出可用 AVD）
just android-doctor   # 检查 JDK / SDK / adb / 设备
```

`just android` 背后是 `scripts/android.mjs`，按顺序做这几件事：

1. `taro build --type rn` 产出 `dist/rn/index.android.bundle`（想复用它就设 `SKIP_BUNDLE=1`）；
2. 把 bundle 复制到 `android/app/src/main/assets/`，`dist/rn/drawable-*` 复制到 `android/app/src/main/res/`；
3. 生成 `android/local.properties`（写入 SDK 路径），按已连接设备的 ABI 调 `gradlew assembleRelease`；
4. `adb install -r -g` 装包，再 `am start` 拉起。

前置条件只有 **JDK 17** 和 **Android SDK**（模拟器再要 AVD，真机要开 USB 调试），其余版本都在仓库里对齐好了：

- JDK / SDK 路径按 `JAVA_HOME` / `ANDROID_HOME` 找；没设时会去常见位置猜（`~/jdks/jdk-17*`、`C:\Program Files\Java\jdk-17*`、`Android Studio\jbr`、`%LOCALAPPDATA%\Android\Sdk`），可用 `just android-doctor` 确认。
- 在 WSL 里执行 `just` 时，Gradle / adb / emulator 走 Windows 侧（WSL 里没有 Windows 版 JDK 与 SDK 工具），路径由脚本自动换算；Windows 与 Linux / macOS 也能直接用。
- Gradle 发行版默认走腾讯云镜像（`android/gradle/wrapper/gradle-wrapper.properties`），依赖仓库在 `android/settings.gradle` 里把阿里云镜像排在最前——`hermes-android` 等 aar 的官方源 `repo.reactnative.dev` 在国内经常超时。
- `android/app/build.gradle` 里 `debuggableVariants` 包含 `release`，即 Gradle **不会**自己打 JS bundle，完全用 Taro 产出的那份；release 用的是仓库内的 `debug.keystore`（与 RN 模板一致），正式发版请换成自己的签名。

已知限制与注意点：

- **改了 `app.config.ts` 的 `pages` / `tabBar` 后要清 Metro 缓存**：RN 端的入口（页面列表、tabBar 配置）是 Metro 把 `@tarojs/rn-supporter/entry-file.js` 转出来的，而这份生成代码会被 Metro 缓存——只改 app.config.ts 重打 bundle 会拿到旧的 tabBar / 页面列表（改了 `src/pages/**` 的普通页面代码不受影响）。用 `just build-rn-clean`（= `taro build --type rn --reset-cache`），或者 `SKIP_BUNDLE=1` 之外先手动清一次缓存。
- **广告（`pages/ad`）入口当前隐藏**：页面和 `src/pages/ad` 代码都保留，只是从 `src/app.config.ts` 的 tabBar 和 `src/components/app-menu` 的菜单里注释掉了；恢复时把两处注释打开再 `just build-rn-clean` 即可。
- **RN 端没有同步本地存储**：`@tarojs/taro-rn` 的 `Taro.getStorageSync` / `setStorageSync` 是空实现——调用会 `console.error` 并**返回一个 Error 对象**（不抛错），所以 `getStorageSync(key).split(...)` 这类代码会直接把页面干崩，写入则是静默无效。因此**业务代码一律走 `src/common/storage.ts`** 的 `readStorage` / `writeStorage`：小程序 / H5 用同步 API，RN 用 AsyncStorage 的异步 API，并在 `src/app.ts` 里先 `hydrateStorage()` 把已存的键值读进内存再渲染页面。新增需要持久化的功能请用这两个函数，不要再直接调 `Taro.*StorageSync`。

- RN 端样式只认 `px` / `%` / 无单位数字，本项目源码统一用 `rpx`，由 `config/postcss-rpx.js`（RN 专用 postcss 插件）在打包时按 `1rpx = 0.5px` 换算；顺带两条限制：`calc()` 在 RN 上会被整条丢弃（logcat 里报 `Unknown value: calc(...)`，应用商店的 3 列网格因此改用百分比 `width: 30.8%; margin: 10rpx 1.2%`），`display: block` 之类的 Web 专有取值也会被忽略（报 `invalid value for display: block`，不影响布局）。新增样式尽量用 flex + 百分比表达。
- `react-native-screens` 固定在 `3.29.0`：更高的版本用到了 RN 0.74+ 才有的 `BaseReactPackage`，会让 `compileReleaseKotlin` 失败。
- NDK 默认按 RN 0.73 的 `25.1.8937393` 走，本机已装别的版本时可 `RN_NDK_VERSION=<版本> just android` 避免再下一次几百 MB。
- `just dev-rn` 会在启动时调用 `process.stdin.setRawMode`，如果输出被重定向 / 在非交互终端里执行（IDE 任务、管道、CI），会报 `process.stdin.setRawMode is not a function`；此时改在真实终端执行，或直接用 `npx react-native start`（效果相同，仅少了 Taro 的二维码预览）。
- Taro 首次执行 `taro build --type rn` 时可能会自动往 `package.json` 里补 RN 依赖；本项目已显式声明（`react-native` / `expo` / `@tarojs/rn-*` 等），不会再触发自动安装。

## 迁移约定（uni-app x → Taro）

- 页面 = 目录，入口 `index.tsx`（React 函数组件）+ `index.config.ts`（页面配置）+ 同目录 `lib.ts` / `data.ts`（业务逻辑与数据）
- 模板标签对照：`view` → `View`、`text` → `Text`、`image` → `Image`、`scroll-view` → `ScrollView`、`picker` → `Picker`、`switch` → `Switch`
- 事件与属性对照：`@click` → `onClick`、`hover-class` → `hoverClass`、`:value` → `value`、`v-for` → `map`
- 存储与交互 API：`uni.getStorageSync` → `Taro.getStorageSync`、`uni.navigateTo` / `switchTab` → `Taro.navigateTo` / `switchTab`，以此类推
- 样式：`.uvue` 的 flex 默认值在 Taro 中不存在，横向布局需显式 `display: flex; flex-direction: row`；单位继续沿用 `rpx`
- 工具页统一用 `page-with-menu` 外壳 + `<AppMenu />` 底部菜单
- 产物按平台分目录（`dist/<平台>/`），由 `config/index.ts` 读取 `TARO_ENV` 决定；新增平台只需装对应 `@tarojs/plugin-platform-*` 并加 `build-<平台>` 脚本与 just 配方（RN 端没有 platform 插件，走 Taro 内置的 `rn` preset + Metro）

## License

[MIT](./LICENSE)

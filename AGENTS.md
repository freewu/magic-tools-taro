# AGENTS.md — 项目工作约定

## 命令管理（just）

- 项目根目录的 `justfile` 统一管理安装、开发、构建、自检与提交命令；执行 `just` 查看全部命令。
- 提交前至少运行 `just check`（结构自检）与 `just typecheck`；改动页面时建议再跑一次 `just build-h5` 确认可编译。
- 提交也可使用 `just commit "提交信息"`（等价于 `git add -A` + commit + push）。

## 提交与推送（必须遵守）

- **每个任务 / 每批迁移完成后**：执行 `git add -A` → 创建清晰的 commit（提交信息用中文概括变更要点）→ `git push` 到远程仓库（origin / main）。
- 除非用户明确要求暂停或拆分，任务完成节点以「已提交并推送」为准。
- 若 push 失败（网络 / 凭据问题），保留本地提交并明确告知用户，不要静默跳过。

## 项目概况

- magic-tools-taro：Taro 4 + React 18 + TypeScript，SCSS 写样式，可编译到微信 / 京东 / 百度 / 支付宝 / 字节跳动 / QQ / 飞书小程序、H5 与 Android（React Native，产物在 `dist/<平台>/`）。
- 源项目为 uni-app x 版 magic-tools-lite（`.uvue` / `.uts`），迁移目标是行为一致、结构对应。
- 关键约定：
  - 页面目录 `src/pages/<模块>/`：`index.tsx`（组件）+ `index.config.ts`（页面标题等）+ `index.scss`（样式）；
  - 业务逻辑与类型放同目录 `lib.ts`，纯数据放 `data.ts`，页面组件只负责渲染与事件；
  - 新工具页需同时更新：`src/app.config.ts` 的 `pages`、`src/pages/app/index.ts` 的应用登记（`name` / `icon` / `desc` / `path` / `query` 都要填，`desc` 会参与首页搜索匹配）；
  - 工具页外壳用 `page-with-menu`，顶部渲染 `<NavBar title='页面标题' />`（仅 H5 生效，小程序用系统导航栏）、底部渲染 `<AppMenu />`；tab 页用 `<NavBar title='…' back={false} />`；
  - 图片一律用 `import icon from '…png'` 引入交给打包器处理路径，不要写死 `'/static/xxx.png'`（H5 子路径/文件名哈希会 404）；
  - 尺寸单位统一 `rpx`（设计稿宽度 750）。
  - RN（Android）端的样式只认 `px` / `%`，`rpx` 由 `config/postcss-rpx.js` 在 Metro 打包时按 `1rpx = 0.5px` 换算；新增样式仍写 `rpx`，不要为 RN 单独写一套。
  - RN 相关依赖版本必须与 RN 0.73 / Expo 50 对齐：`react-native-gesture-handler` 固定在 2.14.1（更高版本的 codegen 会让 RN 0.73 打包失败），`react-native-screens` 固定在 3.29.0（3.30+ 用了 RN 0.74 的 `BaseReactPackage`，`compileReleaseKotlin` 会失败），`stylelint` 固定在 16.9.0（`stylelint-taro-rn` 依赖它内部的 `declarationValueIndex.cjs`）；升级 RN 时这些要一起动。
  - RN 端的原生宿主工程就在本仓库 `android/`（移植自 taro-native-shell 0.73 分支），`just android` 一条命令就能打 release APK 并装到已连接的真机 / 模拟器；`just android-dev` 装 debug 包走 Metro 热更新（先 `just dev-rn`），`just android-doctor` 检查 JDK 17 / Android SDK / adb。脚本是 `scripts/android.mjs`：它负责同步 `dist/rn` 的 bundle 与 `drawable-*` 到 `android/app/src/main`、生成 `local.properties`、按设备 ABI 调 Gradle、再 `adb install` + `am start`。
  - 在 WSL 里跑 `just` 时，Gradle / adb / emulator 走 Windows 侧工具链（JDK、Android SDK、`adb.exe` 都是 Windows 版），路径换算与环境变量覆盖都在 `scripts/android.mjs` 里处理，不要在 justfile 里写死 Windows 路径。
  - 原生侧改动（`android/`）后先验证 `just android`，别只验证 `just build-rn`（后者只打 JS）。
  - RN 端不支持 `calc()` / `gap` / `display: block` 这类 Web 专有写法（Yoga 会丢掉整条声明或忽略取值），涉及列宽、间距的样式用 `%` + flex 表达：应用商店的 3 列网格就是 `width: 30.8%; margin: 10rpx 1.2%`。
- 本机 git 身份：bluefrog &lt;bluefrog.wu@gmail.com&gt;（已在仓库内配置）。

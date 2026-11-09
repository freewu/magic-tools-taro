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

- magic-tools-taro：Taro 4 + React 18 + TypeScript，SCSS 写样式，可编译到微信 / 京东 / 百度 / 支付宝 / 字节跳动 / QQ / 飞书小程序以及 H5（产物在 `dist/<平台>/`）。
- 源项目为 uni-app x 版 magic-tools-lite（`.uvue` / `.uts`），迁移目标是行为一致、结构对应。
- 关键约定：
  - 页面目录 `src/pages/<模块>/`：`index.tsx`（组件）+ `index.config.ts`（页面标题等）+ `index.scss`（样式）；
  - 业务逻辑与类型放同目录 `lib.ts`，纯数据放 `data.ts`，页面组件只负责渲染与事件；
  - 新工具页需同时更新：`src/app.config.ts` 的 `pages`、`src/pages/app/index.ts` 的应用登记（`name` / `icon` / `desc` / `path` / `query` 都要填，`desc` 会参与首页搜索匹配）；
  - 工具页外壳用 `page-with-menu`，顶部渲染 `<NavBar title='页面标题' />`（仅 H5 生效，小程序用系统导航栏）、底部渲染 `<AppMenu />`；tab 页用 `<NavBar title='…' back={false} />`；
  - 图片一律用 `import icon from '…png'` 引入交给打包器处理路径，不要写死 `'/static/xxx.png'`（H5 子路径/文件名哈希会 404）；
  - 尺寸单位统一 `rpx`（设计稿宽度 750）。
- 本机 git 身份：bluefrog &lt;bluefrog.wu@gmail.com&gt;（已在仓库内配置）。

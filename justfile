# magic-tools-taro 常用命令（Taro + React + TypeScript）
#
# 依赖：just、Node.js（>= 18）、npm
# 本项目由 uni-app x 版 magic-tools-lite 迁移而来。
#
# 请在项目根目录执行 just；直接执行 just 即列出全部命令（按分组排版）。

set shell := ["bash", "-uc"]

# 显示全部命令说明（默认）
[group('环境')]
default:
	@just --list --list-heading '可用命令：'$'\n' --list-prefix '  '

# 安装 / 同步依赖（npm ci 优先，失败回退 npm install）
[group('环境')]
install:
	@if [ -f package-lock.json ]; then npm ci || npm install; else npm install; fi

# 自检开发环境（node / npm / just / git / 依赖状态）
[group('环境')]
doctor:
	@echo "项目目录 : {{ justfile_directory() }}"
	@echo "just     : $(just --version 2>/dev/null || echo 未安装（PATH 中找不到 just）)"
	@echo "node     : $(node -v 2>/dev/null || echo 未安装)"
	@echo "npm      : $(npm -v 2>/dev/null || echo 未安装)"
	@echo "git      : $(git --version)"
	@echo "依赖     : $(if [ -d node_modules/@tarojs/cli ]; then echo 已安装; else echo '未安装（执行 just install）'; fi)"
	@echo ""
	@git status --short --branch

# ---------------------------------------------------------------- 开发 / 构建

# 支持的平台：h5 / weapp（微信）/ swan（百度）/ alipay（支付宝）/ tt（字节跳动）/
# qq（QQ）/ jd（京东）/ lark（飞书）/ rn（React Native → Android）。
# 快手小程序没有 Taro 平台插件，暂不支持。

# 开发 H5（http://localhost:10086）（产物 dist/h5/）
[group('开发 / 构建')]
dev-h5:
	npm run dev:h5

# 开发 微信小程序（产物 dist/weapp/）
[group('开发 / 构建')]
dev-weapp:
	npm run dev:weapp

# 开发 百度小程序（产物 dist/swan/）
[group('开发 / 构建')]
dev-swan:
	npm run dev:swan

# 开发 支付宝小程序（产物 dist/alipay/）
[group('开发 / 构建')]
dev-alipay:
	npm run dev:alipay

# 开发 字节跳动 / 抖音小程序（产物 dist/tt/）
[group('开发 / 构建')]
dev-tt:
	npm run dev:tt

# 开发 QQ 小程序（产物 dist/qq/）
[group('开发 / 构建')]
dev-qq:
	npm run dev:qq

# 开发 京东小程序（产物 dist/jd/）
[group('开发 / 构建')]
dev-jd:
	npm run dev:jd

# 开发 飞书小程序（产物 dist/lark/）
[group('开发 / 构建')]
dev-lark:
	npm run dev:lark

# 构建 H5（http://localhost:10086）（产物 dist/h5/）
[group('开发 / 构建')]
build-h5:
	npm run build:h5

# 构建 微信小程序（产物 dist/weapp/）
[group('开发 / 构建')]
build-weapp:
	npm run build:weapp

# 构建 百度小程序（产物 dist/swan/）
[group('开发 / 构建')]
build-swan:
	npm run build:swan

# 构建 支付宝小程序（产物 dist/alipay/）
[group('开发 / 构建')]
build-alipay:
	npm run build:alipay

# 构建 字节跳动 / 抖音小程序（产物 dist/tt/）
[group('开发 / 构建')]
build-tt:
	npm run build:tt

# 构建 QQ 小程序（产物 dist/qq/）
[group('开发 / 构建')]
build-qq:
	npm run build:qq

# 构建 京东小程序（产物 dist/jd/）
[group('开发 / 构建')]
build-jd:
	npm run build:jd

# 构建 飞书小程序（产物 dist/lark/）
[group('开发 / 构建')]
build-lark:
	npm run build:lark

# 开发 Android（RN 方案）：启动 Metro 开发服务（端口 8081；安装到设备用 just android-dev）
[group('开发 / 构建')]
dev-rn:
	npm run dev:rn

# 构建 Android（RN 方案）：产出 dist/rn/index.android.bundle + drawable-*（只打 JS，不出 APK）
[group('开发 / 构建')]
build-rn:
	npm run build:rn
	@ls -lh dist/rn/index.android.bundle 2>/dev/null || true

# ---------------------------------------------------------------- Android 真机 / 模拟器
# 本仓库的 android/ 就是 RN 原生宿主工程（移植自 taro-native-shell 0.73 分支），
# 所以打包到设备只需要一条命令：JS bundle（taro build --type rn）+ Gradle + adb install。
# 前置：JDK 17 + Android SDK；缺什么先跑 just android-doctor。
# 说明：WSL 里会用 cmd.exe 调用 Windows 侧的 Gradle / adb / emulator，Windows 与 Linux/macOS 也能直接用。

# 打包 release APK 并安装到已连接的真机 / 模拟器，然后启动
[group('Android 真机 / 模拟器')]
android:
	node scripts/android.mjs run

# 只打 release APK（不安装；产物 android/app/build/outputs/apk/release/）
[group('Android 真机 / 模拟器')]
android-apk:
	node scripts/android.mjs apk

# 打 debug APK 并启动（JS 走 Metro 热更新：先在另一个终端跑 just dev-rn）
[group('Android 真机 / 模拟器')]
android-dev:
	node scripts/android.mjs dev

# 列出已连接的真机 / 模拟器（含型号）
[group('Android 真机 / 模拟器')]
android-devices:
	node scripts/android.mjs devices

# 启动模拟器（不带参数时列出可用 AVD）
[group('Android 真机 / 模拟器')]
android-emulator avd='':
	node scripts/android.mjs emulator {{ avd }}

# 检查 Android 打包环境（JDK / SDK / NDK / adb / 已连接设备）
[group('Android 真机 / 模拟器')]
android-doctor:
	node scripts/android.mjs doctor

# 构建全部平台（H5 + 7 个小程序平台 + Android RN，逐个串行构建）
[group('开发 / 构建')]
build:
	npm run build:h5
	@for p in weapp swan alipay tt qq jd lark; do \
		echo "▶ 构建 $p"; \
		npm run build:$p || exit 1; \
	done
	echo "▶ 构建 rn"
	npm run build:rn
	@echo "全部平台构建完成，产物在 dist/<平台>/"

# 构建全部小程序平台（不含 H5）
[group('开发 / 构建')]
build-mini:
	@for p in weapp swan alipay tt qq jd lark; do \
		echo "▶ 构建 $p"; \
		npm run build:$p || exit 1; \
	done
	@echo "全部小程序平台构建完成，产物在 dist/<平台>/"

# TypeScript 类型检查（不产出文件）
[group('开发 / 构建')]
typecheck:
	npm run typecheck

# ---------------------------------------------------------------- 维护

# 结构自检（页面路由 / tabBar 图标 / 依赖的静态资源）
[group('维护')]
check:
	npm run check

# 清理构建产物
[group('维护')]
clean:
	rm -rf dist .temp .swc
	rm -rf android/.gradle android/build android/app/build android/.cxx android/local.properties android/.gradle-run.bat
	@echo "已清理 dist / .temp / .swc 与 android 构建产物"

# 提交并推送（add -A + commit + push）
[group('维护')]
commit message:
	@git add -A
	@if git diff --cached --quiet; then echo "没有需要提交的变更"; else git commit -m "{{ message }}" && git push; fi

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
	@echo "依赖     : $({{ if path_exists('node_modules/@tarojs/cli') { "echo 已安装" } else { "echo 未安装（执行 just install）" } }})"
	@echo ""
	@git status --short --branch

# ---------------------------------------------------------------- 开发 / 构建

# H5 开发（http://localhost:10086）
[group('开发 / 构建')]
dev-h5:
	npm run dev:h5

# 微信小程序开发（产物 dist/，用微信开发者工具打开）
[group('开发 / 构建')]
dev-weapp:
	npm run dev:weapp

# 构建 H5（产物 dist/）
[group('开发 / 构建')]
build-h5:
	npm run build:h5

# 构建微信小程序（产物 dist/）
[group('开发 / 构建')]
build-weapp:
	npm run build:weapp

# 两个平台一起构建
[group('开发 / 构建')]
build:
	npm run build:h5
	npm run build:weapp

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
	@echo "已清理 dist / .temp / .swc"

# 提交并推送（add -A + commit + push）
[group('维护')]
commit message:
	@git add -A
	@if git diff --cached --quiet; then echo "没有需要提交的变更"; else git commit -m "{{ message }}" && git push; fi

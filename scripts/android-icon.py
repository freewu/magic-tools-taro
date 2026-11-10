#!/usr/bin/env python3
"""从 assets/logo.jpg 生成 Android 启动图标（各密度 ic_launcher / ic_launcher_round）。

用法：
    python3 scripts/android-icon.py            # 生成全部密度
    python3 -c "import PIL" || pip install Pillow

只有换 logo 时才需要跑，产物直接提交在 android/app/src/main/res/mipmap-*/ 里。
圆形图标（ic_launcher_round）由方形图裁成圆形，四角透明。
"""

import pathlib

from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets' / 'logo.jpg'
RES = ROOT / 'android' / 'app' / 'src' / 'main' / 'res'

# Android 各密度的启动图标边长（px）
DENSITIES = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

# 圆形的抗锯齿倍数：先在 4 倍尺寸上画好遮罩再缩回去
SUPERSAMPLE = 4


def square_icon(source: Image.Image, size: int) -> Image.Image:
    return source.resize((size, size), Image.LANCZOS)


def round_icon(source: Image.Image, size: int) -> Image.Image:
    icon = square_icon(source, size).convert('RGBA')
    mask = Image.new('L', (size * SUPERSAMPLE, size * SUPERSAMPLE), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size * SUPERSAMPLE - 1, size * SUPERSAMPLE - 1), fill=255)
    mask = mask.resize((size, size), Image.LANCZOS)
    icon.putalpha(mask)
    return icon


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f'找不到源图：{SRC}')
    source = Image.open(SRC).convert('RGB')
    if source.width != source.height:
        # 非正方形时居中裁成正方形，避免图标被拉伸
        side = min(source.width, source.height)
        left = (source.width - side) // 2
        top = (source.height - side) // 2
        source = source.crop((left, top, left + side, top + side))

    for folder, size in DENSITIES.items():
        target = RES / folder
        target.mkdir(parents=True, exist_ok=True)
        square_icon(source, size).save(target / 'ic_launcher.png', 'PNG', optimize=True)
        round_icon(source, size).save(target / 'ic_launcher_round.png', 'PNG', optimize=True)
        print(f'{folder}: ic_launcher.png / ic_launcher_round.png ({size}x{size})')

    print('✓ Android 启动图标已更新')


if __name__ == '__main__':
    main()

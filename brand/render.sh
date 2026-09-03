#!/usr/bin/env bash
# X header rasmlarini headless Chrome bilan chizadi.
# Foydalanish: brand/render.sh
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

shot() { # shot <chiqish nomi> <url qo'shimchasi>
  "$CHROME" \
    --headless \
    --disable-gpu \
    --hide-scrollbars \
    --force-device-scale-factor=2 \
    --window-size=1500,500 \
    --virtual-time-budget=6000 \
    --screenshot="$DIR/$1" \
    "file://$DIR/x-header.html$2" >/dev/null 2>&1
  echo "$1 → $(sips -g pixelWidth -g pixelHeight "$DIR/$1" | awk '/pixel/{printf "%s ", $2}')"
}

shot x-header-light.png ""
shot x-header-dark.png "?theme=dark"

#!/usr/bin/env bash
# X uchun header va profil rasmlarini headless Chrome bilan chizadi.
# Foydalanish: brand/render.sh
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

shot() { # shot <chiqish> <manba.html> <kenglik> <balandlik> <url qo'shimchasi>
  "$CHROME" \
    --headless \
    --disable-gpu \
    --hide-scrollbars \
    --force-device-scale-factor=2 \
    --window-size="$3,$4" \
    --virtual-time-budget=6000 \
    --screenshot="$DIR/$1" \
    "file://$DIR/$2$5" >/dev/null 2>&1
  printf "%-24s %s\n" "$1" "$(sips -g pixelWidth -g pixelHeight "$DIR/$1" | awk '/pixel/{printf "%s ", $2}')"
}

# Header — 1500×500 (X nisbati 3:1), @2x.
shot x-header-light.png x-header.html 1500 500 ""
shot x-header-dark.png  x-header.html 1500 500 "?theme=dark"

# Profil rasmi — 400×400, @2x. X uni aylana qilib kesadi.
shot x-avatar-green.png x-avatar.html 400 400 ""
shot x-avatar-dark.png  x-avatar.html 400 400 "?v=dark"
shot x-avatar-light.png x-avatar.html 400 400 "?v=light"

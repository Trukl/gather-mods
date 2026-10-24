#!/usr/bin/env bash
# Builds the site's videos: an H.264 MP4 and a WebP poster per recording,
# plus the icons from the mod's launcher icon.
#
#   scripts/sync-media.sh ../gather-mod-menu                 # recordings from the mod's docs/media
#   scripts/sync-media.sh ../gather-mod-menu ~/recordings    # your own recordings
#
# A recording is <name>.mov, .mp4, .webm or .gif (first found, in that order);
# missing ones keep the video already in media/. The list of names and where
# each one shows is in the README. Needs ffmpeg.
set -euo pipefail

MOD_REPO="${1:-../gather-mod-menu}"
SRC="${2:-$MOD_REPO/docs/media}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/media"

RECORDINGS=(
  animation-studio
  animation-studio-steps-others
  custom-objects
  custom-objects-animated-gif
  custom-objects-copies-animation
  custom-objects-plane
  place-on
  linked-objects
  bulk-delete
  desk-presets
  constructions
  community-hub
  seasonal-themes
  auto-away
  ui-redesign
  mod-users
)

mkdir -p "$OUT"
for name in "${RECORDINGS[@]}"; do
  src=""
  for ext in mov mp4 webm gif; do
    if [ -f "$SRC/$name.$ext" ]; then
      src="$SRC/$name.$ext"
      break
    fi
  done
  if [ -z "$src" ]; then
    echo "$name: no recording in $SRC, kept as is"
    continue
  fi
  # At most 1920 px wide (Retina for the widest frame on the page), even sizes, no sound.
  ffmpeg -loglevel error -y -i "$src" \
    -vf "scale='min(1920,iw)':-2:flags=lanczos,scale=trunc(iw/2)*2:trunc(ih/2)*2" \
    -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -movflags +faststart -an \
    "$OUT/$name.mp4"
  ffmpeg -loglevel error -y -i "$OUT/$name.mp4" -vframes 1 -c:v libwebp -quality 80 "$OUT/$name.webp"
  size=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$OUT/$name.mp4")
  echo "$name: $(basename "$src") -> $size, $(du -h "$OUT/$name.mp4" | cut -f1)"
done

# App icon: page logo, favicon and Apple touch icon.
ICON="$MOD_REPO/launcher/icon.png"
ASSETS="$ROOT/assets"
ffmpeg -loglevel error -y -i "$ICON" -vf scale=320:320 -c:v libwebp -quality 85 "$ASSETS/icon.webp"
ffmpeg -loglevel error -y -i "$ICON" -vf scale=180:180 "$ASSETS/apple-touch-icon.png"
ffmpeg -loglevel error -y -i "$ICON" -vf scale=64:64 "$ASSETS/favicon.png"

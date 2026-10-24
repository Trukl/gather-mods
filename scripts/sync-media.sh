#!/usr/bin/env bash
# Turns the README recordings of gather-mod-menu into the site's videos:
# an H.264 MP4 (a fraction of the GIF's size) and a WebP poster per recording.
#
#   scripts/sync-media.sh ../gather-mod-menu
#
# Needs ffmpeg. Re-run it after re-recording a GIF in the mod repo.
set -euo pipefail

MOD_REPO="${1:-../gather-mod-menu}"
SRC="$MOD_REPO/docs/media"
OUT="$(cd "$(dirname "$0")/.." && pwd)/media"

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
  mod-news
  update-required
  announcements
)

mkdir -p "$OUT"
for name in "${RECORDINGS[@]}"; do
  gif="$SRC/$name.gif"
  [ -f "$gif" ] || { echo "missing: $gif" >&2; exit 1; }
  ffmpeg -loglevel error -y -i "$gif" \
    -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
    -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart -an \
    "$OUT/$name.mp4"
  ffmpeg -loglevel error -y -i "$gif" -vframes 1 -c:v libwebp -quality 80 "$OUT/$name.webp"
  echo "$name: $(du -h "$gif" | cut -f1) gif -> $(du -h "$OUT/$name.mp4" | cut -f1) mp4"
done

# App icon: page logo, favicon and Apple touch icon.
ICON="$MOD_REPO/launcher/icon.png"
ASSETS="$OUT/../assets"
ffmpeg -loglevel error -y -i "$ICON" -vf scale=320:320 -c:v libwebp -quality 85 "$ASSETS/icon.webp"
ffmpeg -loglevel error -y -i "$ICON" -vf scale=180:180 "$ASSETS/apple-touch-icon.png"
ffmpeg -loglevel error -y -i "$ICON" -vf scale=64:64 "$ASSETS/favicon.png"

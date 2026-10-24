# Gather Mod Menu website

The presentation site of the [Gather Mod Menu](https://github.com/Trukl/gather-mod-menu): what the mod does, its modules, how to install it and why updates are safe.

A static page with no build step, published by GitHub Pages from the root of `main`.

## What updates by itself

The page reads the mod's catalog, [`modules.json`](https://github.com/Trukl/gather-mod-menu/blob/main/modules.json), from GitHub when it loads:

- the version of each module and its changelog (click a module card),
- the “What's new” section (the latest changelog entries),
- a card for any module published after this page was written, and the module count,
- the “New” badge (modules first released in the last 30 days, after the launch).

“Copy the script” in the browser install copies [`gather-mod-menu.js`](https://github.com/Trukl/gather-mod-menu/blob/main/gather-mod-menu.js) from `main`. The seasonal themes section says which theme is on today.

Feature texts and videos are written by hand: update them when a module changes how it looks or what it does.

## Files

```
index.html            the page (with the Lucide icons it uses, inlined as an SVG sprite)
assets/style.css      styles
assets/app.js         videos, tabs, copy buttons, live catalog data
assets/og.png         social preview image (Slack, X, …), 1200×630
media/                videos as MP4 (+ WebP poster), see “Videos” below
scripts/sync-media.sh regenerates media/ and the icons from a gather-mod-menu checkout
```

## Videos

The videos are the README GIFs for now, converted to MP4. To replace them, record screen videos (`.mov`, `.mp4` or `.webm`, no need to go through a GIF) named after their slot, put them in one folder and run (needs `ffmpeg`):

```bash
scripts/sync-media.sh ../gather-mod-menu ~/recordings
```

Slots you don't record keep their current video. Without the second argument, the script reads the mod's `docs/media` GIFs again.

| Slot (file name)                  | Where it shows                                      |
| --------------------------------- | --------------------------------------------------- |
| `animation-studio`                | Hero, top of the page                               |
| `animation-studio-steps-others`   | Fun                                                 |
| `custom-objects`                  | Custom objects, tab “Place an image”                |
| `custom-objects-animated-gif`     | Custom objects, tab “Animated GIFs”                 |
| `custom-objects-copies-animation` | Custom objects, tab “Copies”                        |
| `custom-objects-plane`            | Custom objects, tab “Front and back”                |
| `place-on`                        | Build, tab “Place on…”                              |
| `linked-objects`                  | Build, tab “Linked objects”                         |
| `bulk-delete`                     | Build, tab “Bulk delete”                            |
| `desk-presets`                    | Desks & Constructions, tab “Desk presets”           |
| `constructions`                   | Desks & Constructions, tab “Constructions”          |
| `community-hub`                   | Community hub                                       |
| `seasonal-themes`                 | Seasonal themes                                     |
| `auto-away`                       | Small card “Auto away” (cropped to 5:4, bottom)     |
| `mod-users`                       | Small card “Spot the other modders” (cropped, 5:4)  |
| `ui-redesign`                     | Small card “Feels like Gather” (cropped, 5:4)       |

Recording tips:

- **Landscape, around 16:10**, at Retina resolution: the script scales down to 1920 px wide. Any ratio works in the big frames; the three small cards crop to 5:4, so keep what matters near the center (bottom for `auto-away`).
- **8 to 20 seconds, looping cleanly**: videos play muted and on a loop, only while on screen.
- **Hide what's private**: other people's names and avatars, your space name.
- After changing a video's ratio, update the `width` and `height` of its `<video>` in `index.html` so the page doesn't jump while it loads.

To add a slot, add its name to `RECORDINGS` in the script and a `<video>` (or a clip tab) in `index.html`.

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Publish

Settings → Pages → Build and deployment: **Deploy from a branch**, `main`, `/ (root)`. Every push to `main` is then online within a minute.

The `og:url` and `og:image` tags in `index.html` hold the site's address: change them if it moves (custom domain, other repo name).

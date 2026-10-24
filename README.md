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
media/                the README recordings as MP4 (+ WebP poster), ~6 MB instead of 24 MB of GIFs
scripts/sync-media.sh regenerates media/ and the icons from a gather-mod-menu checkout
```

## Update the videos

After re-recording a GIF in the mod repo (needs `ffmpeg`):

```bash
scripts/sync-media.sh ../gather-mod-menu
```

To show a new recording, add its name to `RECORDINGS` in the script, run it, and add a `<video>` (or a clip tab) in `index.html`.

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Publish

Settings → Pages → Build and deployment: **Deploy from a branch**, `main`, `/ (root)`. Every push to `main` is then online within a minute.

The `og:url` and `og:image` tags in `index.html` hold the site's address: change them if it moves (custom domain, other repo name).

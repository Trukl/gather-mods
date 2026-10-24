// Gather Mod Menu site: lazy videos, tabs, copy buttons, and live module data
// read from the mod's catalog (modules.json) on GitHub.

const REPO = "Trukl/gather-mod-menu";
const RAW = `https://raw.githubusercontent.com/${REPO}/main/`;
const BLOB = `https://github.com/${REPO}/blob/main/`;

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const icon = (name) => {
  const id = document.getElementById(`i-${name}`) ? name : "puzzle";
  return `<svg class="icon"><use href="#i-${id}" /></svg>`;
};

const formatDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
};

// ---------- Header ----------

const header = $(".site-header");
const onScroll = () => header.classList.toggle("scrolled", scrollY > 8);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ---------- Videos: load when near the screen, play only while visible ----------

const videos = $$("video[data-src]");

const playVideo = (video) => {
  if (!video.src) video.src = video.dataset.src;
  if (video.dataset.userPaused || reducedMotion) return;
  video.play().catch(() => {});
};

for (const video of videos) {
  const frame = video.closest(".frame");
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "play-toggle";
  const sync = () => {
    const paused = video.paused;
    // Videos pause off screen on their own: the button only stays up when it's the viewer's choice.
    frame.classList.toggle("paused", paused && (reducedMotion || !!video.dataset.userPaused));
    toggle.setAttribute("aria-label", paused ? "Play video" : "Pause video");
    toggle.innerHTML = icon(paused ? "play" : "pause");
  };
  toggle.addEventListener("click", () => {
    if (video.paused) {
      delete video.dataset.userPaused;
      if (!video.src) video.src = video.dataset.src;
      video.play().catch(() => {});
    } else {
      video.dataset.userPaused = "1";
      video.pause();
    }
  });
  video.addEventListener("play", sync);
  video.addEventListener("pause", sync);
  frame.append(toggle);
  sync();
}

const videoObserver = new IntersectionObserver(
  (entries) => {
    for (const { target, isIntersecting } of entries) {
      if (isIntersecting) playVideo(target);
      else target.pause();
    }
  },
  { rootMargin: "150px 0px" },
);
videos.forEach((v) => videoObserver.observe(v));

// Clip tabs under a video swap what it plays.
for (const group of $$(".clip-tabs")) {
  const video = $("video", group.closest(".feature-media"));
  group.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-clip]");
    if (!button || button.getAttribute("aria-selected") === "true") return;
    $$("button", group).forEach((b) => b.setAttribute("aria-selected", String(b === button)));
    const name = button.dataset.clip;
    video.poster = `media/${name}.webp`;
    video.dataset.src = `media/${name}.mp4`;
    video.setAttribute("aria-label", button.dataset.label);
    video.src = video.dataset.src;
    delete video.dataset.userPaused;
    playVideo(video);
  });
}

// ---------- Reveal on scroll ----------

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      target.classList.add("in");
      revealObserver.unobserve(target);
    }
  },
  { rootMargin: "0px 0px -8% 0px" },
);
$$(".reveal").forEach((el) => revealObserver.observe(el));

// ---------- Install tabs ----------

const tabs = $$(".install .tab");
const selectTab = (tab, focus) => {
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
  }
  if (focus) tab.focus();
  if (tab.id === "tab-browser") prefetchBundle();
};
tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (step) selectTab(tabs[(i + step + tabs.length) % tabs.length], true);
  });
});
if (location.hash === "#browser") selectTab($("#tab-browser"));

// ---------- Copy buttons ----------

const flashDone = (button) => {
  const html = button.innerHTML;
  button.classList.add("done");
  button.innerHTML = icon("check");
  setTimeout(() => {
    button.classList.remove("done");
    button.innerHTML = html;
  }, 1600);
};

for (const button of $$("[data-copy]")) {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      flashDone(button);
    } catch {
      /* Clipboard blocked: the text stays selectable on the page. */
    }
  });
}

// The browser bundle: fetched ahead of the click when possible, so the copy
// happens while the click still counts as a user gesture.
let bundle = null;
let bundlePromise = null;
function prefetchBundle() {
  bundlePromise ??= fetch(RAW + "gather-mod-menu.js", { cache: "no-cache" })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then((text) => (bundle = text))
    .catch((error) => {
      bundlePromise = null;
      throw error;
    });
  return bundlePromise;
}

const copyBundleButton = $("[data-copy-bundle]");
const copyStatus = $("[data-copy-status]");
const setStatus = (text, kind = "") => {
  copyStatus.textContent = text;
  copyStatus.className = `copy-status ${kind}`;
};

copyBundleButton?.addEventListener("click", async () => {
  const label = $("span", copyBundleButton);
  label.textContent = "Copying…";
  try {
    if (bundle) {
      await navigator.clipboard.writeText(bundle);
    } else if (window.ClipboardItem) {
      // Safari only allows an async copy when the clipboard gets a promise right away.
      const blob = prefetchBundle().then((text) => new Blob([text], { type: "text/plain" }));
      await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
    } else {
      await navigator.clipboard.writeText(await prefetchBundle());
    }
    const kb = Math.round(new Blob([bundle ?? (await prefetchBundle())]).size / 1024);
    setStatus(`Copied (${kb} KB). Now paste it into the console of your Gather tab.`, "ok");
    label.textContent = "Copied";
  } catch {
    setStatus("Couldn't copy automatically. Open the code on GitHub and use its “Copy raw file” button.", "err");
    label.textContent = "Copy the script";
    return;
  }
  setTimeout(() => (label.textContent = "Copy the script"), 2500);
});

const installSection = $("#install");
new IntersectionObserver((entries, observer) => {
  if (!entries.some((e) => e.isIntersecting)) return;
  observer.disconnect();
  prefetchBundle().catch(() => {});
}).observe(installSection);

// ---------- Seasonal themes: what's on right now ----------

// Easter Sunday (Anonymous Gregorian algorithm).
function easter(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function seasons(year) {
  const sunday = easter(year);
  const day = 86400000;
  return [
    { name: "Halloween", from: new Date(year, 9, 1), to: new Date(year, 10, 15) },
    { name: "Christmas", from: new Date(year, 11, 1), to: new Date(year + 1, 0, 15) },
    { name: "Easter", from: new Date(sunday - 21 * day), to: new Date(+sunday + 14 * day) },
  ];
}

(function showSeason() {
  const pill = $("[data-season]");
  if (!pill) return;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const all = [...seasons(now.getFullYear() - 1), ...seasons(now.getFullYear()), ...seasons(now.getFullYear() + 1)].sort(
    (a, b) => a.from - b.from,
  );
  const short = (date) => date.toLocaleDateString("en", { month: "short", day: "numeric" });
  const current = all.find((s) => s.from <= today && today <= s.to);
  const next = all.find((s) => s.from > today);
  if (current) {
    pill.classList.remove("off");
    $("[data-season-text]", pill).textContent = `${current.name} is on right now, until ${short(current.to)}`;
  } else if (next) {
    $("[data-season-text]", pill).textContent = `Next up: ${next.name}, from ${short(next.from)}`;
  }
  pill.hidden = false;
})();

// ---------- Live module data ----------

const dialog = $("#module-dialog");
let catalog = null;

function openModule(id) {
  const mod = catalog?.byId.get(id);
  if (!mod) return;
  $("[data-dlg-icon]", dialog).innerHTML = icon(mod.icon || "puzzle");
  $("#dlg-title", dialog).textContent = mod.name;
  $("[data-dlg-version]", dialog).textContent = `v${mod.version}`;

  const needs = Object.keys(mod.requires || {})
    .map((dep) => catalog.byId.get(dep)?.name || dep)
    .map((name) => `<li>${escapeHtml(name)}</li>`)
    .join("");

  const entries = (mod.changelog || [])
    .map((entry, i) => {
      const changes = entry.changes
        .map((c) => `<li${/^Removed:/.test(c) ? ' class="removed"' : ""}>${escapeHtml(c)}</li>`)
        .join("");
      return `<article>
        <header><b>v${escapeHtml(entry.version)}</b><time datetime="${escapeHtml(entry.date)}">${formatDate(entry.date)}</time>
        ${entry.breaking ? '<span class="tag breaking">Required update</span>' : ""}</header>
        <ul>${changes}</ul>
        ${entry.notice ? `<p class="notice">${escapeHtml(entry.notice)}</p>` : ""}
      </article>`;
    })
    .join("");

  $("[data-dlg-body]", dialog).innerHTML = `
    <p>${escapeHtml(mod.description)}</p>
    ${needs ? `<h4>Brings along</h4><ul class="dlg-requires">${needs}</ul>` : ""}
    <h4>Changelog</h4>
    <div class="changelog">${entries}</div>
    <div class="dlg-foot">
      <a class="btn btn-sm" href="${BLOB}${escapeHtml(mod.file)}">${icon("external-link")}Source</a>
    </div>`;
  $("[data-dlg-body]", dialog).scrollTop = 0;
  dialog.showModal();
}

$("[data-dlg-close]", dialog).addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

$("[data-modules]").addEventListener("click", (event) => {
  const card = event.target.closest("[data-module]");
  if (card) openModule(card.dataset.module);
});

// "New": published after the first release of the mod, within the last 30 days.
const firstRelease = (mod) => mod.changelog?.[mod.changelog.length - 1]?.date ?? "";
const isNew = (mod) => {
  const first = firstRelease(mod);
  const launch = firstRelease(catalog.byId.get("core") ?? mod);
  return first > launch && Date.now() - new Date(first) < 30 * 86400000;
};

function renderModules(mods) {
  const grid = $("[data-modules]");
  for (const mod of mods) {
    let card = $(`[data-module="${CSS.escape(mod.id)}"]`, grid);
    if (!card) {
      // A module published after this page was written: add its card.
      card = document.createElement("button");
      card.className = "module";
      card.dataset.module = mod.id;
      card.innerHTML = `<div class="module-top"><span class="module-icon">${icon(mod.icon)}</span>
        <h3>${escapeHtml(mod.name)}</h3><span class="version"></span></div>
        <p>${escapeHtml(mod.description)}</p>
        <span class="module-more">Changelog ${icon("arrow-right")}</span>`;
      grid.append(card);
    }
    $(".version", card).textContent = `v${mod.version}`;
    if (isNew(mod) && !$(".badge-new", card)) {
      $(".version", card).insertAdjacentHTML("beforebegin", '<span class="badge-new">New</span>');
    }
  }
  // Cards of modules no longer published go away.
  const ids = new Set(mods.map((m) => m.id));
  $$("[data-module]", grid).forEach((card) => ids.has(card.dataset.module) || card.remove());
  $$("[data-module-count]").forEach((el) => (el.textContent = mods.length));
}

function renderNews(mods) {
  const box = $("[data-news]");
  const items = mods
    .flatMap((mod) => (mod.changelog || []).map((entry) => ({ mod, entry })))
    .sort((a, b) => b.entry.date.localeCompare(a.entry.date))
    .slice(0, 6);
  box.innerHTML = items
    .map(({ mod, entry }) => {
      const shown = entry.changes.slice(0, 1);
      const more = entry.changes.length - shown.length;
      return `<article class="news-item">
        <div class="news-meta"><span class="module-icon" style="width:28px;height:28px;border-radius:8px">${icon(mod.icon)}</span>
          <b>${escapeHtml(mod.name)}</b> v${escapeHtml(entry.version)}
          <time datetime="${escapeHtml(entry.date)}">${formatDate(entry.date)}</time></div>
        <ul>${shown.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>
        <button class="more" type="button" data-open="${escapeHtml(mod.id)}">${more > 0 ? `+${more} more in the changelog` : "Full changelog"}</button>
      </article>`;
    })
    .join("");
  box.addEventListener("click", (event) => {
    const button = event.target.closest("[data-open]");
    if (button) openModule(button.dataset.open);
  });
}

fetch(RAW + "modules.json", { cache: "no-cache" })
  .then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(({ modules }) => {
    const byId = new Map(modules.map((m) => [m.id, m]));
    catalog = { byId };
    const userModules = modules.filter((m) => m.kind === "module");
    renderModules(userModules);
    renderNews(modules.filter((m) => m.kind !== "lib"));
    const core = byId.get("core");
    if (core) {
      $("[data-core-version]").textContent = ` (v${core.version})`;
    }
  })
  .catch(() => {
    $("[data-news]").innerHTML = `<p class="news-empty">Couldn't load the latest changes.
      See the <a href="https://github.com/${REPO}/releases">releases on GitHub</a>.</p>`;
    $$(".module-more").forEach((el) => el.remove());
    $("[data-modules]").addEventListener("click", (event) => {
      if (event.target.closest("[data-module]")) location.href = `https://github.com/${REPO}#modules`;
    });
  });

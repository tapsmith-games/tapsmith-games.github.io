// Сборка сайта студии: страницы из src/text.mjs и документов content/<игра>/*.md → dist/.
// Английский — в корне, русский — в /ru/. Пустые поля site.config.json видны на страницах жёлтой
// пометкой; `npm run release` (флаг --strict) с такими полями падает — на публикацию их не выпустит.

import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import { GAMES, LANGS, SUPPORT, UI } from "./src/text.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1"));
const OUT = path.join(ROOT, "dist");
const config = JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8"));
const strict = process.argv.includes("--strict");
const missing = new Set();

const DOC_TITLE = { privacy: "privacy", terms: "terms", "delete-account": "deleteAccount" };

// --- Пути ---

const prefix = (lang) => (lang === "en" ? "/" : `/${lang}/`);
const homeUrl = (lang) => prefix(lang);
const gameUrl = (lang, g) => `${prefix(lang)}${g.slug}/`;
const docUrl = (lang, g, doc) => `${prefix(lang)}${g.slug}/${doc}/`;
const supportUrl = (lang) => `${prefix(lang)}support/`;
const absolute = (p) => (config.siteUrl ? config.siteUrl.replace(/\/$/, "") + p : p);

// --- Пустые поля конфигурации ---

function todo(name) {
  missing.add(name);
  return `<mark class="todo" title="site.config.json">${name}</mark>`;
}

function field(name, value) {
  return value === "" || value === null || value === undefined ? todo(name) : esc(String(value));
}

function emailLink() {
  return config.contactEmail ? `<a href="mailto:${esc(config.contactEmail)}">${esc(config.contactEmail)}</a>` : todo("contactEmail");
}

function formatDate(lang, iso) {
  if (!iso) return todo("effectiveDate");
  const d = new Date(`${iso}T00:00:00Z`);
  return esc(d.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }));
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// --- Документы ---

function renderDoc(lang, game, doc) {
  const file = path.join(ROOT, "content", game.slug, `${game.docs[doc]}.${lang}.md`);
  let md = fs.readFileSync(file, "utf8");
  // Первый заголовок — название документа; на странице он свой.
  md = md.replace(/^# .*\n+/, "");
  // Строка «Действует с: {{EFFECTIVE_DATE}}» — в шапке страницы.
  md = md.replace(/^(Effective date|Действует с|Действуют с):.*\n+/m, "");
  const values = {
    CONTACT_EMAIL: () => emailLink(),
    EFFECTIVE_DATE: () => formatDate(lang, config.effectiveDate),
    DELETE_ACCOUNT_URL: () => link(absolute(docUrl(lang, game, "delete-account"))),
    PRIVACY_URL: () => link(absolute(docUrl(lang, game, "privacy"))),
  };
  // Подстановки — после разметки: значения уже HTML.
  const slots = [];
  md = md.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
    if (!values[key]) throw new Error(`${file}: неизвестная подстановка {{${key}}}`);
    slots.push(values[key]());
    return `@@SLOT${slots.length - 1}@@`;
  });
  const html = marked.parse(md, { gfm: true }).replace(/@@SLOT(\d+)@@/g, (_, i) => slots[Number(i)]);
  return html.replace(/<table>/g, '<div class="table"><table>').replace(/<\/table>/g, "</table></div>");
}

function link(url) {
  return `<a href="${esc(url)}">${esc(url)}</a>`;
}

// --- Оболочка страницы ---

function page({ lang, path: here, alt, title, description, body, wide = false, image = null }) {
  const t = UI[lang];
  const other = LANGS.filter((l) => l !== lang)
    .map((l) => `<a class="lang" href="${alt(l)}" hreflang="${l}" lang="${l}"><span class="long">${UI[l].langName}</span><span class="short" aria-hidden="true">${l.toUpperCase()}</span></a>`)
    .join("");
  const alternates = LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${esc(absolute(alt(l)))}">`).join("\n    ");
  const shareImage = image ? `\n    <meta property="og:image" content="${esc(absolute(image))}">\n    <meta name="twitter:card" content="summary_large_image">` : "";
  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <meta name="theme-color" content="#0b0f1f">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${esc(config.studio)}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${esc(absolute(alt(lang)))}">${shareImage}
    ${alternates}
    <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
    <link rel="icon" href="/favicon.png" sizes="64x64" type="image/png">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600&family=Unbounded:wght@500;600;700&display=swap">
    <link rel="stylesheet" href="/style.css">
  </head>
  <body class="page-${here}">
    <a class="skip" href="#main">${t.skip}</a>
    <header class="bar">
      <a class="wordmark" href="${homeUrl(lang)}">${MARK}<span>${esc(config.studio)}</span></a>
      <nav aria-label="${t.help}">
        <a href="${supportUrl(lang)}"${here === "support" ? ' aria-current="page"' : ""}>${t.support}</a>
        ${other}
      </nav>
    </header>
    <main id="main"${wide ? ' class="wide"' : ""}>
${body}
    </main>
    <footer class="foot">
      <div class="foot-brand">
        <a class="wordmark" href="${homeUrl(lang)}">${MARK}<span>${esc(config.studio)}</span></a>
        <p>${config.contactEmail ? `${t.contact} ${emailLink()}` : t.contactNoEmail}</p>
      </div>
      <nav class="foot-links" aria-label="${t.allGames}">
        ${GAMES.map((g) => `<a href="${gameUrl(lang, g)}">${esc(g.shortName)}</a>`).join("\n        ")}
        <a href="${supportUrl(lang)}">${t.support}</a>
      </nav>
      <p class="foot-copy">© ${new Date().getUTCFullYear()} ${esc(config.studio)}</p>
    </footer>
  </body>
</html>
`;
}

// Знак студии — герб (щит с молотами), исходник и все размеры — brand/.
const MARK = `<img class="mark" src="/img/brand/crest-144.webp" alt="" width="125" height="144">`;

function helpLinks(lang, g) {
  const t = UI[lang];
  const item = (href, title, note) => `<li><a href="${href}"><strong>${title}</strong><span>${note}</span></a></li>`;
  return `<ul class="help">
        ${item(supportUrl(lang), t.support, t.supportNote)}
        ${item(docUrl(lang, g, "privacy"), t.privacy, t.privacyNote)}
        ${item(docUrl(lang, g, "terms"), t.terms, t.termsNote)}
        ${item(docUrl(lang, g, "delete-account"), t.deleteAccount, t.deleteNote)}
      </ul>`;
}

function storeButton(lang, g) {
  const t = UI[lang];
  return g.googlePlay
    ? `<a class="store" href="${esc(g.googlePlay)}">${PLAY_ICON}<span>Google Play</span></a>`
    : `<p class="store soon">${PLAY_ICON}<span>${t.soon}</span></p>`;
}

// Нейтральный треугольник «запуск» — не логотип Google Play (его можно ставить только официальным бейджем).
const PLAY_ICON = `<svg class="play" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 2.6v10.8c0 .5.5.8.9.5l8.4-5.4a.6.6 0 000-1L4.9 2.1c-.4-.3-.9 0-.9.5z"/></svg>`;

const art = (g, sizes) =>
  `src="/img/${g.slug}/key-art-1600.webp" srcset="/img/${g.slug}/key-art-800.webp 800w, /img/${g.slug}/key-art-1600.webp 1600w" sizes="${sizes}" width="1600" height="781"`;

// --- Круг стихий: пять точек по окружности (от верхней по часовой), стрелки — дуги между соседями ---

const RING_R = 36;
const ringAngle = (i) => ((-90 + 72 * i) * Math.PI) / 180;
const round = (v) => Math.round(v * 100) / 100;
const ringPoint = (i, r = RING_R) => [round(50 + r * Math.cos(ringAngle(i))), round(50 + r * Math.sin(ringAngle(i)))];

function ringArrows() {
  const gap = (21 * Math.PI) / 180; // отступ дуги от центра значка
  const arcs = [0, 1, 2, 3, 4]
    .map((i) => {
      const a1 = ringAngle(i) + gap;
      const a2 = ringAngle(i + 1) - gap;
      const p = (a) => `${round(50 + RING_R * Math.cos(a))} ${round(50 + RING_R * Math.sin(a))}`;
      return `<path class="arc" d="M${p(a1)} A${RING_R} ${RING_R} 0 0 1 ${p(a2)}" marker-end="url(#ring-head)"/>`;
    })
    .join("");
  return `<svg class="ring-arrows" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs><marker id="ring-head" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse"><path d="M1 1.2L8.5 5 1 8.8z"/></marker></defs><circle class="track" cx="50" cy="50" r="${RING_R}"/>${arcs}</svg>`;
}

// --- Горн на главной: свечение и искры. Случайность с постоянным зерном — сборка не меняет страницу зря. ---

function forge(count = 36) {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const sparks = Array.from({ length: count }, () => {
    const x = round(20 + rnd() * 60);
    const size = round(2.5 + rnd() * 4);
    const dur = round(3.2 + rnd() * 3.6);
    const delay = round(-rnd() * 7);
    const drift = round((rnd() - 0.5) * 120);
    const rise = round(220 + rnd() * 220);
    return `<i style="--x:${x}%;--s:${size}px;--t:${dur}s;--d:${delay}s;--dx:${drift}px;--rise:-${rise}px"></i>`;
  }).join("");
  return `<div class="forge" aria-hidden="true"><span class="forge-glow"></span><span class="forge-core"></span>${sparks}</div>`;
}

// --- Страницы ---

function homePage(lang) {
  const t = UI[lang];
  const cards = GAMES.map((g, i) => {
    const x = g.text[lang];
    return `        <article class="game">
          <a class="game-art" href="${gameUrl(lang, g)}" tabindex="-1" aria-hidden="true">
            <img ${art(g, "(min-width: 1180px) 1120px, 100vw")} alt=""${i ? ' loading="lazy"' : ""}>
          </a>
          <div class="game-body">
            <img class="game-icon" src="/img/${g.slug}/icon.webp" alt="" width="88" height="88">
            <div class="game-copy">
              <h3><a href="${gameUrl(lang, g)}">${esc(g.name)}</a></h3>
              <p>${esc(x.short)}</p>
            </div>
            <div class="game-actions">
              <a class="button" href="${gameUrl(lang, g)}">${t.gamePage}<span aria-hidden="true">→</span></a>
              ${storeButton(lang, g)}
            </div>
          </div>
        </article>`;
  }).join("\n");
  const body = `      <section class="intro">
        ${forge()}
        <p class="eyebrow">${t.eyebrow}</p>
        <h1 class="studio">${esc(config.studio)}</h1>
        <p class="tagline">${t.tagline}</p>
      </section>
      <section class="showcase" aria-labelledby="games">
        <h2 id="games" class="section-title"><span>${t.games}</span><span class="count">${String(GAMES.length).padStart(2, "0")}</span></h2>
${cards}
      </section>`;
  const image = `/img/${GAMES[0].slug}/key-art-1600.webp`;
  return page({ lang, path: "home", alt: homeUrl, title: config.studio, description: t.tagline, body, wide: true, image });
}

function gamePage(lang, g) {
  const t = UI[lang];
  const x = g.text[lang];
  const keys = ["a", "b", "c", "d", "e"];
  const cycle = keys
    .map((k, i) => {
      const [px, py] = ringPoint(i);
      return `<li style="--x:${px}%;--y:${py}%"><img src="/img/${g.slug}/element-${k}.webp" alt="" width="96" height="96" loading="lazy"><span>${esc(x.elements[i])}</span></li>`;
    })
    .join("\n            ");
  const facts = x.facts
    .map(([value, label]) => `<li><strong>${esc(value)}</strong><span>${esc(label)}</span></li>`)
    .join("\n          ");
  const modes = x.modes
    .map(([img, name, text]) => `<figure class="mode">
          <img src="/img/${g.slug}/mode-${img}.webp" alt="" width="900" height="600" loading="lazy">
          <figcaption><strong>${esc(name)}</strong><span>${esc(text)}</span></figcaption>
        </figure>`)
    .join("\n        ");
  const body = `      <section class="hero">
        <img class="hero-art" ${art(g, "100vw")} alt="">
        <div class="hero-text">
          <img class="hero-icon" src="/img/${g.slug}/icon.webp" alt="" width="72" height="72">
          <h1>${esc(g.name)}</h1>
          <p>${esc(x.about)}</p>
          ${storeButton(lang, g)}
        </div>
      </section>
      <ul class="facts" aria-label="${esc(g.shortName)}">
          ${facts}
      </ul>
      <section class="cycle" aria-labelledby="cycle">
        <div class="section-head">
          <h2 id="cycle">${esc(x.cycleTitle)}</h2>
          <p>${esc(x.cycleText)}</p>
        </div>
        <div class="ring-wrap">
          ${ringArrows()}
          <ol class="ring">
            ${cycle}
          </ol>
          <p class="ring-hint" aria-hidden="true"><svg class="ring-hint-arrow" viewBox="0 0 40 12" focusable="false"><path d="M2 6h30"/><path class="head" d="M30 1.5L38 6l-8 4.5z"/></svg>${esc(x.ringHint)}</p>
        </div>
      </section>
      <section class="modes-section" aria-labelledby="modes">
        <div class="section-head">
          <h2 id="modes">${esc(x.modesTitle)}</h2>
        </div>
        <div class="modes">
        ${modes}
        </div>
      </section>
      <section class="help-section" aria-labelledby="help">
        <div class="section-head">
          <h2 id="help">${t.help}</h2>
        </div>
        ${helpLinks(lang, g)}
      </section>`;
  const image = `/img/${g.slug}/key-art-1600.webp`;
  return page({ lang, path: "game", alt: (l) => gameUrl(l, g), title: g.name, description: x.short, body, wide: true, image });
}

function docPage(lang, g, doc) {
  const t = UI[lang];
  const title = t[DOC_TITLE[doc]];
  const body = `      <article class="doc">
        <p class="crumbs"><a href="${gameUrl(lang, g)}">${esc(g.name)}</a></p>
        <h1>${title}</h1>
        ${doc === "delete-account" ? "" : `<p class="effective">${t.effective} ${formatDate(lang, config.effectiveDate)}</p>`}
${renderDoc(lang, g, doc)}
      </article>`;
  return page({ lang, path: doc, alt: (l) => docUrl(l, g, doc), title: `${title} — ${g.name}`, description: `${title}: ${g.name}`, body });
}

function supportPage(lang) {
  const t = UI[lang];
  const s = SUPPORT[lang];
  const fill = (text) =>
    esc(text)
      .replace("{email}", emailLink())
      .replace("{delete}", GAMES.map((x) => `<a href="${docUrl(lang, x, "delete-account")}">${t.deleteAccount} (${esc(x.shortName)})</a>`).join(", "))
      .replace("{privacy}", GAMES.map((x) => `<a href="${docUrl(lang, x, "privacy")}">${esc(x.shortName)}</a>`).join(", "));
  const faq = s.faq.map(([q, a]) => `        <h2>${esc(q)}</h2>\n        <p>${fill(a)}</p>`).join("\n");
  const body = `      <article class="doc">
        <h1>${s.title}</h1>
        <p class="lead">${config.contactEmail ? fill(s.lead) : s.leadNoEmail}</p>
${faq}
        <h2>${t.allGames}</h2>
        ${GAMES.map((x) => `<h3>${esc(x.name)}</h3>\n        ${helpLinks(lang, x)}`).join("\n        ")}
      </article>`;
  return page({ lang, path: "support", alt: supportUrl, title: `${s.title} — ${config.studio}`, description: s.title, body });
}

function notFoundPage() {
  const t = UI.en;
  const body = `      <article class="doc">
        <h1>404</h1>
        <p class="lead">${t.notFound} <a href="/">${t.toHome}</a> · <a href="/ru/" lang="ru">${UI.ru.toHome}</a></p>
      </article>`;
  return page({ lang: "en", path: "404", alt: homeUrl, title: `404 — ${config.studio}`, description: t.notFound, body });
}

// --- Запись ---

function write(rel, html) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, "public"), OUT, { recursive: true });
fs.copyFileSync(path.join(ROOT, "src", "style.css"), path.join(OUT, "style.css"));
for (const lang of LANGS) {
  const base = lang === "en" ? "" : `${lang}/`;
  write(`${base}index.html`, homePage(lang));
  write(`${base}support/index.html`, supportPage(lang));
  for (const g of GAMES) {
    write(`${base}${g.slug}/index.html`, gamePage(lang, g));
    for (const doc of Object.keys(g.docs)) write(`${base}${g.slug}/${doc}/index.html`, docPage(lang, g, doc));
  }
}
write("404.html", notFoundPage());
// GitHub Pages: без Jekyll, файлы отдаются как есть.
write(".nojekyll", "");
// AdMob проверяет app-ads.txt в корне сайта разработчика (адрес сайта — в Google Play Console).
if (/^pub-d{16}$/.test(config.admobPublisherId ?? "")) {
  write("app-ads.txt", `google.com, ${config.admobPublisherId}, DIRECT, f08c47fec0942fa0
`);
} else {
  console.warn("app-ads.txt не создан: в site.config.json нет admobPublisherId (pub-XXXXXXXXXXXXXXXX).");
}

if (missing.size) {
  const list = [...missing].join(", ");
  if (strict) {
    console.error(`Не заполнено в site.config.json: ${list}. Публиковать рано.`);
    process.exit(1);
  }
  console.warn(`Внимание: не заполнено в site.config.json: ${list} (на страницах — жёлтая пометка).`);
}
console.log(`Готово: ${OUT}`);

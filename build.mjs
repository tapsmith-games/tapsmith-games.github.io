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

function page({ lang, path: here, alt, title, description, body, wide = false }) {
  const t = UI[lang];
  const other = LANGS.filter((l) => l !== lang)
    .map((l) => `<a class="lang" href="${alt(l)}" hreflang="${l}" lang="${l}">${UI[l].langName}</a>`)
    .join("");
  const alternates = LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${esc(absolute(alt(l)))}">`).join("\n    ");
  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    ${alternates}
    <link rel="icon" href="/favicon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600&family=Unbounded:wght@500;700&display=swap">
    <link rel="stylesheet" href="/style.css">
  </head>
  <body>
    <a class="skip" href="#main">${t.skip}</a>
    <header class="bar">
      <a class="wordmark" href="${homeUrl(lang)}">${esc(config.studio)}</a>
      <nav aria-label="${t.help}">
        <a href="${supportUrl(lang)}"${here === "support" ? ' aria-current="page"' : ""}>${t.support}</a>
        ${other}
      </nav>
    </header>
    <main id="main"${wide ? ' class="wide"' : ""}>
${body}
    </main>
    <footer class="foot">
      <p>${config.contactEmail ? `${t.contact} ${emailLink()}` : t.contactNoEmail}</p>
      <p>© ${new Date().getUTCFullYear()} ${esc(config.studio)}</p>
    </footer>
  </body>
</html>
`;
}

function helpLinks(lang, g) {
  const t = UI[lang];
  return `<ul class="help">
        <li><a href="${supportUrl(lang)}">${t.support}</a></li>
        <li><a href="${docUrl(lang, g, "privacy")}">${t.privacy}</a></li>
        <li><a href="${docUrl(lang, g, "terms")}">${t.terms}</a></li>
        <li><a href="${docUrl(lang, g, "delete-account")}">${t.deleteAccount}</a></li>
      </ul>`;
}

function storeButton(lang, g) {
  const t = UI[lang];
  return g.googlePlay
    ? `<a class="store" href="${esc(g.googlePlay)}">Google Play</a>`
    : `<p class="store soon">${t.soon}</p>`;
}

// --- Страницы ---

function homePage(lang) {
  const t = UI[lang];
  const cards = GAMES.map((g) => {
    const x = g.text[lang];
    return `      <article class="game">
        <a class="game-art" href="${gameUrl(lang, g)}" tabindex="-1" aria-hidden="true">
          <img src="/img/${g.slug}/key-art-1600.webp" srcset="/img/${g.slug}/key-art-800.webp 800w, /img/${g.slug}/key-art-1600.webp 1600w" sizes="(min-width: 1100px) 1040px, 100vw" alt="" width="1600" height="781">
        </a>
        <div class="game-body">
          <img class="game-icon" src="/img/${g.slug}/icon.webp" alt="" width="72" height="72">
          <div>
            <h2><a href="${gameUrl(lang, g)}">${esc(g.name)}</a></h2>
            <p>${esc(x.short)}</p>
            ${storeButton(lang, g)}
          </div>
        </div>
      </article>`;
  }).join("\n");
  const body = `      <section class="intro">
        <h1 class="studio">${esc(config.studio)}</h1>
        <p class="tagline">${t.tagline}</p>
      </section>
      <section aria-labelledby="games">
        <h2 id="games" class="section-title">${t.games}</h2>
${cards}
      </section>`;
  return page({ lang, path: "home", alt: homeUrl, title: config.studio, description: t.tagline, body, wide: true });
}

function gamePage(lang, g) {
  const t = UI[lang];
  const x = g.text[lang];
  const keys = ["a", "b", "c", "d", "e"];
  const cycle = keys
    .map((k, i) => `<li><img src="/img/${g.slug}/element-${k}.webp" alt="" width="80" height="80"><span>${esc(x.elements[i])}</span></li>`)
    .join("\n          ");
  const modes = x.modes
    .map(([img, name, text]) => `<figure class="mode">
          <img src="/img/${g.slug}/mode-${img}.webp" alt="" width="900" height="600" loading="lazy">
          <figcaption><strong>${esc(name)}</strong> ${esc(text)}</figcaption>
        </figure>`)
    .join("\n        ");
  const body = `      <section class="hero">
        <img class="hero-art" src="/img/${g.slug}/key-art-1600.webp" srcset="/img/${g.slug}/key-art-800.webp 800w, /img/${g.slug}/key-art-1600.webp 1600w" sizes="100vw" alt="" width="1600" height="781">
        <div class="hero-text">
          <h1>${esc(g.name)}</h1>
          <p>${esc(x.about)}</p>
          ${storeButton(lang, g)}
        </div>
      </section>
      <section class="cycle" aria-labelledby="cycle">
        <h2 id="cycle">${esc(x.cycleTitle)}</h2>
        <p>${esc(x.cycleText)}</p>
        <ol class="ring">
          ${cycle}
        </ol>
      </section>
      <section aria-labelledby="modes">
        <h2 id="modes">${esc(x.modesTitle)}</h2>
        <div class="modes">
        ${modes}
        </div>
      </section>
      <section aria-labelledby="help">
        <h2 id="help">${t.help}</h2>
        ${helpLinks(lang, g)}
      </section>`;
  return page({ lang, path: "game", alt: (l) => gameUrl(l, g), title: g.name, description: x.short, body, wide: true });
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

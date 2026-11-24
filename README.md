# Сайт Tapsmith Games

Один сайт на все игры студии: главная со списком игр, страница каждой игры, документы для магазинов
(политика конфиденциальности, условия, удаление аккаунта) и поддержка. Английский — в корне, русский — в `/ru/`.
Статический: сборка кладёт готовые страницы в `dist/`, сервер не нужен.

| Адрес | Что там |
|---|---|
| `/` , `/ru/` | главная |
| `/support/` | поддержка: почта, частые вопросы, документы всех игр |
| `/<игра>/` | страница игры |
| `/<игра>/privacy/` | политика конфиденциальности — ссылка для Google Play и для игры |
| `/<игра>/terms/` | условия использования |
| `/<игра>/delete-account/` | удаление аккаунта — ссылка для анкеты Google Play «Безопасность данных» |

## Команды

```powershell
npm install
npm run build     # dist/; пустые поля site.config.json — жёлтые пометки на страницах
npm run preview   # http://localhost:5180
npm run release   # то же, но падает, если поля не заполнены — эту команду ставить на хостинге
```

## Настройки — `site.config.json`

| Поле | Что |
|---|---|
| `studio` | название студии в шапке и подвале |
| `siteUrl` | адрес сайта без слэша в конце: `https://tapsmith-games.github.io` |
| `contactEmail` | почта поддержки |
| `effectiveDate` | дата, с которой действуют документы (`2026-11-25`); меняется при каждой правке документов |
| `admobPublisherId` | `pub-…` из AdMob — сборка кладёт в корень `app-ads.txt`; пусто — файла нет |

## Публикация (GitHub Pages, бесплатно)

Репозиторий `tapsmith-games/tapsmith-games.github.io` (публичный). Каждый push в `main` собирает сайт
(`npm run release`) и выкладывает `dist/` — `.github/workflows/pages.yml`. Один раз в репозитории:
Settings → Pages → Source: **GitHub Actions**.

## Новая игра

1. Документы: `npm run import-legal -- ../<папка игры>/legal <адрес-игры>` (в `content/<адрес-игры>/`).
2. Картинки: `public/img/<адрес-игры>/` — `key-art-800.webp`, `key-art-1600.webp` (2,05 : 1), `icon.webp`,
   `element-*.webp` и `mode-*.webp`, если страница игры их показывает.
3. Тексты: игра в `GAMES` в `src/text.mjs` (на обоих языках). Ссылка на Google Play — `googlePlay` после выхода.

## После публикации — в игре

В `content/theme.json` игры (`support`) заменить адреса `example.com` на настоящие:
`/<игра>/privacy/`, `/<игра>/terms/`, `/<игра>/delete-account/` и почту поддержки. Те же ссылки — в Google Play Console.

Тексты документов главные в репозитории игры (`legal/`): правка там → `npm run import-legal` здесь.

## Логотип

Герб студии — `brand/crest-source.png` (исходник, тёмный фон). `node scripts/crest.cjs <путь к sharp>` делает из него
`brand/crest.png` (прозрачный фон), знак для шапки `public/img/brand/crest-144.*`, иконки вкладки (`favicon-32.png`,
`favicon.png`), `apple-touch-icon.png` и `brand/play-developer-icon-512.png` — иконку страницы разработчика в Play Console.

# AnkiCards MiniApp — Project Guide

## Architecture

```
server.js                 # Entry point (~14 lines): dotenv, create app, start bot + cron
src/
  app.js                  # Express factory: JSON middleware, static serving, mount routes
  routes/                 # 6 sub-routers + index.js aggregator under /api/user/:userId
  controllers/            # 6 files — one per route group, handler logic only
  services/               # Business logic (srs.js, cardService.js)
  db/                     # db.js (JSON file CRUD), backup.js
  bot/                    # bot.js (instance), handlers.js, cron.js
miniapp/
  index.html              # Single HTML file, references css/ and js/
  css/                    # 9 CSS files split by concern
  js/                     # 13 JS files, loaded via <script> tags in dependency order
```

## Backend Conventions

- **Layering:** Routes → Controllers → Services → DB. Keep each layer focused.
- **Adding a new endpoint:** Create or edit a route file + controller. Register in `src/routes/index.js` if new router.
- **DB access:** Always go through `src/db/db.js` (getUser/saveUser). Never read/write db.json directly.
- **Bot reference in controllers:** Use lazy `require('../bot/bot')` inside the function body (not top-level) to avoid circular dependency issues.
- **No ORM / no migration:** Plain JSON file DB. Keep it simple.

## Frontend Conventions

- **No bundler, no build step.** All JS files are plain `<script>` tags loaded in dependency order.
- **All functions are global.** Inline `onclick` handlers in HTML work as-is. Do not wrap in modules/IIFE.
- **Script load order matters:** utils → api → navigation → home → languagePair → addCard → cardList → review → swipe → import → export → settings → app (last, contains state + init).
- **Global state lives in `js/app.js`:** `userId`, `userData`, `activeCards`, `reviewQueue`, `sessionStats`, etc.
- **Adding a new screen:** Add HTML in index.html, create js/newScreen.js, add `<script>` tag before app.js, register screen ID in `allScreens` array in navigation.js.
- **Adding new CSS:** Create a file in `miniapp/css/`, add `<link>` in index.html head.

## Data Model

- **Users:** `languagePairs[]`, `activeLanguagePairId`, `cards[]`, `settings`
- **Cards:** `front {word, imageUrl}`, `back {translation, example, pronunciation}`, `srs {interval, easeFactor, nextReview, repetitions}`
- **Settings:** `dailyReminderEnabled`, `reminderHour`, `reminderMinute`, `timezone`

## Key Rules

- Keep zero-build-step simplicity. No webpack, no bundler, no transpiler.
- CSV parsing is client-side only (in `js/import.js`).
- SRS algorithm is SM-2 variant with quality 0-3 mapped to SM-2 scale 2-5.
- Cron: reminders check every minute, DB backup at 3 AM server time.
- Static files served from `miniapp/` directory.

## Running

```bash
npm start          # or: node server.js
```

Requires `.env` with `BOT_TOKEN`, `MINIAPP_URL`, and optionally `PORT`.

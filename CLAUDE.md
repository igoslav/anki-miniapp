# AnkiCards MiniApp — Project Guide

## Architecture

```
server.js                 # Entry point (~15 lines): dotenv, create app, start bot + cron
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
data/                     # Created at runtime: db.json + backups/ (gitignored)
```

## Backend Conventions

- **Layering:** Routes → Controllers → Services → DB. Keep each layer focused.
- **Adding a new endpoint:** Create or edit a route file + controller. Register in `src/routes/index.js` if new router.
- **DB access:** Always go through `src/db/db.js` (`getUser`/`saveUser`). Never read/write `data/db.json` directly.
- **Bot reference in controllers:** Use lazy `require('../bot/bot')` inside the function body (not top-level) to avoid circular dependency issues. See `exportController.js` for the pattern.
- **No ORM / no migration:** Plain JSON file DB. Keep it simple.
- **All routes share prefix:** `router.use('/api/user/:userId', ...)` in `src/routes/index.js`. Every sub-router uses `Router({ mergeParams: true })` to access `req.params.userId`.

## API Endpoints

All endpoints are prefixed with `/api/user/:userId`.

| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| GET | `/` | userController.getUser | Get full user data |
| GET | `/language-pairs` | languagePairController.listPairs | List language pairs |
| POST | `/language-pair` | languagePairController.addPair | Add language pair (auto-sets active) |
| PUT | `/active-pair` | languagePairController.switchActivePair | Switch active language pair |
| POST | `/card` | cardController.addCard | Add a single card |
| POST | `/cards/import` | cardController.importCards | Bulk import cards from array |
| PUT | `/card/:cardId` | cardController.updateCard | Update card fields |
| DELETE | `/card/:cardId` | cardController.deleteCard | Delete a card |
| PUT | `/card/:cardId/review` | reviewController.submitReview | Submit SRS review (quality 0–3) |
| GET | `/export` | exportController.exportData | Download JSON backup |
| POST | `/export-to-chat` | exportController.exportToChat | Send backup to Telegram chat |
| PUT | `/settings` | settingsController.updateSettings | Update reminder settings |

## Frontend Conventions

- **No bundler, no build step.** All JS files are plain `<script>` tags loaded in dependency order.
- **All functions are global.** Inline `onclick` handlers in HTML work as-is. Do not wrap in modules/IIFE.
- **Script load order matters:**
  ```
  utils → api → navigation → home → languagePair → addCard → cardList → review → swipe → import → export → settings → app
  ```
  `app.js` is always last — it contains global state and calls `initApp()`.
- **Global state lives in `js/app.js`:**
  - `userId` — from URL param `?user_id=` or `tg.initDataUnsafe.user.id`
  - `userData` — full user object from API
  - `activeCards` — cards filtered to `activeLanguagePairId`
  - `reviewQueue` — shuffled due cards for current session
  - `currentReviewIndex`, `isFlipped`, `isReversed` — review flow state
  - `sessionStats` — `{ reviewed, again, good }` for session complete screen
  - `parsedCSVCards` — temporary store for CSV import preview
  - `touchStartX`, `isDragging` — swipe gesture state

- **Adding a new screen:**
  1. Add HTML section in `index.html`
  2. Create `miniapp/js/newScreen.js` with global functions
  3. Add `<script src="js/newScreen.js">` before `app.js` in `index.html`
  4. Register the screen ID in `allScreens` array in `navigation.js`

- **Adding new CSS:** Create a file in `miniapp/css/`, add `<link>` in `index.html` head.

## Frontend JS File Responsibilities

| File | Responsibility |
|------|---------------|
| `utils.js` | `escapeHtml`, `formatInterval`, `shuffle` |
| `api.js` | `apiGet`, `apiPost`, `apiPut`, `apiDelete` — all call `/api/user/${userId}...` |
| `navigation.js` | `showScreen`, `navTo`, `haptic`, `hapticNotify`, `allScreens` array |
| `home.js` | `updateHomeScreen`, `getActiveCards` |
| `languagePair.js` | `updateLangSelector`, `toggleLangDropdown`, `switchPair`, `openAddPairModal`, `closeAddPairModal`, `addLanguagePair` |
| `addCard.js` | `addCard`, `findImage`, `fetchImageUrl`, `setCardImage`, `clearCardImage` + Wikipedia/Wiktionary image search |
| `cardList.js` | `renderCardList`, `deleteCard` |
| `review.js` | `startReview`, `flipCard`, `rateCard`, `showCurrentCard`, `showCompleteScreen`, `previewIntervals`, `updateRatingLabels` |
| `swipe.js` | `setupSwipeHandlers` — touch swipe left (Again) / right (Good) |
| `import.js` | `parseCSV`, `handleCSVFile`, `confirmImport` |
| `export.js` | `exportDownload`, `exportToChat` |
| `settings.js` | `initSettings`, `renderSettings`, `toggleReminder`, `saveSettings` |
| `app.js` | Global state, `initApp`, `loadUserData`, `setupEventListeners` — loaded last |

## Data Model

### User
```json
{
  "languagePairs": [],
  "activeLanguagePairId": null,
  "cards": [],
  "settings": {
    "dailyReminderEnabled": true,
    "reminderHour": 9,
    "reminderMinute": 0,
    "timezone": "UTC"
  }
}
```

### Language Pair
```json
{
  "id": "lp_<timestamp>",
  "source": "English",
  "target": "Spanish",
  "createdAt": "<ISO string>"
}
```

### Card
```json
{
  "id": "card_<timestamp>",
  "languagePairId": "lp_...",
  "front": {
    "word": "hello",
    "imageUrl": "https://..."
  },
  "back": {
    "translation": "hola",
    "example": "Hello, world!",
    "pronunciation": "/həˈloʊ/"
  },
  "srs": {
    "interval": 0,
    "easeFactor": 2.5,
    "nextReview": "<ISO string>",
    "repetitions": 0
  },
  "createdAt": "<ISO string>"
}
```

## SRS Algorithm

SM-2 variant in `src/services/srs.js`. Quality 0–3 mapped to SM-2 scale 2–5 (`q = quality + 2`).

| Quality | Label | Action |
|---------|-------|--------|
| 0 | Again | Reset: interval=1, repetitions=0 |
| 1 | Hard | Slow progression |
| 2 | Good | Normal progression |
| 3 | Easy | Fast progression (×easeFactor×1.3) |

- Mature cards (repetitions ≥ 2): interval scaled by `easeFactor`
- `easeFactor` clamped at minimum 1.3
- `nextReview` = `now + interval * 86400000` ms

The frontend (`review.js:previewIntervals`) mirrors this logic client-side to show next-interval labels on rating buttons.

## Bot & Cron

### `src/bot/bot.js`
Creates a `node-telegram-bot-api` instance with polling. Exported as a singleton.

### `src/bot/handlers.js`
- `/start` command: sends welcome message with "Open Pepe App" button (web_app)
- `web_app_data` event: handles `card_added` and `session_complete` actions from MiniApp

### `src/bot/cron.js`
- **Every minute:** Checks all users for due reminders. If `dailyReminderEnabled`, matches user local time against `reminderHour:reminderMinute`. Sends message with "Start Review" button if there are due cards.
- **Daily at 3:00 AM server time:** Calls `performBackup()`

### `src/db/backup.js`
Copies `data/db.json` to `data/backups/db_YYYY-MM-DD.json`. Keeps last 7 backups.

## Image Search (addCard.js)

Auto-find image feature queries in order:
1. Source-language Wikipedia (e.g. `it.wikipedia.org` for Italian source)
2. English Wikipedia fallback
3. English Wiktionary fallback

Uses `https://{lang}.wikipedia.org/api/rest_v1/page/summary/{word}` — checks `thumbnail.source` field.

## CSV Import Format

Expected columns (case-insensitive): `word`, `translation`, `example`, `pronunciation`, `imageUrl`/`imageurl`. Only `word` and `translation` are required. Parsed client-side in `import.js`.

Example (`example_cards.csv`):
```
word,translation,example,pronunciation
hello,hola,Hello world,/həˈloʊ/
```

## Environment Variables

`.env` file (see `.env.example`):
```
BOT_TOKEN=your_bot_token_here
MINIAPP_URL=https://your-miniapp-url.com
PORT=3000
```

`MINIAPP_URL` is used in bot handlers and cron to build the `web_app` button URL with `?user_id=<userId>`.

## Running

```bash
npm start       # node server.js
npm run dev     # nodemon server.js (auto-reload)
```

Requires `.env` with `BOT_TOKEN`, `MINIAPP_URL`, and optionally `PORT`.

## Key Rules

- Keep zero-build-step simplicity. No webpack, no bundler, no transpiler.
- CSV parsing is client-side only (in `js/import.js`).
- SRS algorithm is SM-2 variant with quality 0-3 mapped to SM-2 scale 2-5.
- Cron: reminders check every minute, DB backup at 3 AM server time.
- Static files served from `miniapp/` directory via `express.static`.
- DB data stored at `data/db.json` (created at runtime, not in git).
- Backups kept at `data/backups/`, last 7 days retained.
- Bot uses long-polling (not webhooks).
- `userId` in all API paths is the Telegram user ID (integer as string).

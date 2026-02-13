# AnkiCards MiniApp — Project Guide

## Architecture

```
server.js                 # Entry point: async startup, connectDB, create app, start bot + cron
src/
  app.js                  # Express factory: JSON middleware, static serving, mount routes
  db/
    mongoose.js            # MongoDB connection (connectDB)
  models/                  # Mongoose schemas
    User.js                # telegramId, role (student|tutor), settings, activeLanguagePairId
    LanguagePair.js        # userId, source, target
    Card.js                # userId, languagePairId, front, back, srs, source, lessonId
    TutorStudent.js        # tutorId, studentId, inviteCode, status
    Lesson.js              # tutorId, title, cards[], assignedTo[]
    index.js               # Barrel export
  routes/                  # 7 sub-routers + index.js aggregator under /api/user/:userId
  controllers/             # 7 files — one per route group, handler logic only
  middleware/
    auth.js                # Telegram initData HMAC-SHA256 verification
    roleCheck.js           # requireRole('tutor') middleware
  services/                # Business logic (srs.js, cardService.js, serializers.js)
  bot/                     # bot.js (instance), handlers.js (deep link invites), cron.js
miniapp/
  index.html               # Single HTML file, references css/ and js/
  css/                     # 10 CSS files split by concern (includes tutor.css)
  js/                      # 14 JS files, loaded via <script> tags in dependency order
scripts/
  migrate-to-mongodb.js    # One-time migration from data/db.json to MongoDB
```

## Backend Conventions

- **Layering:** Routes → Controllers → Services → Models. Keep each layer focused.
- **Adding a new endpoint:** Create or edit a route file + controller. Register in `src/routes/index.js` if new router.
- **DB access:** Always go through Mongoose models (`src/models/`). Never access MongoDB directly.
- **Auth:** Every API request is authenticated via `X-Telegram-Init-Data` header (HMAC-SHA256). Dev bypass: `NODE_ENV=development` skips validation.
- **Bot reference in controllers:** Use lazy `require('../bot/bot')` inside the function body (not top-level) to avoid circular dependency issues.
- **Serialization:** Use `src/services/serializers.js` to convert Mongoose docs to frontend-compatible JSON (ObjectId→string, Date→ISO string).

## Frontend Conventions

- **No bundler, no build step.** All JS files are plain `<script>` tags loaded in dependency order.
- **All functions are global.** Inline `onclick` handlers in HTML work as-is. Do not wrap in modules/IIFE.
- **Script load order matters:** utils → api → navigation → home → languagePair → addCard → cardList → review → swipe → import → export → settings → tutor → app (last, contains state + init).
- **Global state lives in `js/app.js`:** `userId`, `userData`, `activeCards`, `reviewQueue`, `sessionStats`, etc.
- **Telegram WebApp init lives in `js/utils.js`:** `const tg = window.Telegram.WebApp; tg.expand(); tg.ready();`
- **API auth:** All fetch calls include `X-Telegram-Init-Data` header via `getAuthHeaders()` in `js/api.js`.
- **Adding a new screen:** Add HTML in index.html, create js/newScreen.js, add `<script>` tag before app.js, register screen ID in `allScreens` array in navigation.js.
- **Adding new CSS:** Create a file in `miniapp/css/`, add `<link>` in index.html head.

## Data Model (MongoDB)

- **Users:** telegramId (unique), role (student|tutor), activeLanguagePairId (ObjectId), settings (embedded)
- **LanguagePairs:** userId (String = telegramId), source, target
- **Cards:** userId, languagePairId (ObjectId), front {word, imageUrl}, back {translation, example, pronunciation}, srs {interval, easeFactor, nextReview (Date), repetitions}, source (self|tutor), sourceTutorId, lessonId
- **TutorStudent:** tutorId, studentId, inviteCode, status (pending|active|revoked)
- **Lessons:** tutorId, title, description, cards[] (embedded), assignedTo[] (embedded with studentId, accepted)
- **Settings (embedded in User):** dailyReminderEnabled, reminderHour, reminderMinute, timezone

## Tutor-Student System

- **Tutor role** is admin-only (set directly in DB, no self-serve)
- **Student invites** via Telegram deep links: `t.me/botname?start=invite_CODE`
- Tutors create lessons with card templates, send to linked students
- Students accept lessons → cards are created in their deck with `source: 'tutor'`

## Key Rules

- Keep zero-build-step simplicity. No webpack, no bundler, no transpiler.
- CSV parsing is client-side only (in `js/import.js`).
- SRS algorithm is SM-2 variant with quality 0-3 mapped to SM-2 scale 2-5.
- Cron: reminders check every minute. MongoDB Atlas handles backups.
- Static files served from `miniapp/` directory.

## Running

```bash
npm start          # or: node server.js
```

Requires `.env` with `BOT_TOKEN`, `MINIAPP_URL`, `MONGODB_URI`, and optionally `PORT`.

## Migration

To migrate from the old JSON file DB to MongoDB:
```bash
node scripts/migrate-to-mongodb.js
```

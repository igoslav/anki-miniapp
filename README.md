# Anki Cards - Telegram Mini App

A flashcard learning app inside Telegram with flip animations, swipe gestures, and zero commands — just UI.

## Features

- Home screen with learning statistics
- Add/delete cards via form UI
- Learn mode with 3D flip animations
- Swipe right (learned) / left (repeat)
- Haptic feedback and native Telegram theming
- Session completion with stats

## Quick Start

```bash
npm install
```

1. Create a bot with [@BotFather](https://t.me/BotFather)
2. Copy `.env.example` to `.env` and add your `BOT_TOKEN`
3. Set `MINIAPP_URL` to an HTTPS URL (e.g. via `ngrok http 3000`)
4. Run `npm start`
5. Open your bot in Telegram, send `/start`, tap "Open Anki Cards"

## Project Structure

```
anki-miniapp/
├── bot.js              # Bot launcher + Express API
├── miniapp/
│   └── index.html      # Complete Mini App UI
├── package.json
├── .env.example
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cards/:userId` | Get user's cards |
| POST | `/api/cards/:userId` | Add new card |
| POST | `/api/cards/:userId/:cardId` | Update card status |
| DELETE | `/api/cards/:userId/:cardId` | Delete card |

## Deployment

The Mini App is served by the same Express server as the bot — deploy to any Node.js host (Railway, Render, Heroku, etc.).

Requirements: HTTPS URL, valid SSL, environment variables configured.

## Storage

Uses in-memory storage by default. For production, swap to a database (MongoDB, PostgreSQL) or Telegram's `CloudStorage` API.

## Future Ideas

- Spaced repetition (SM-2)
- Multiple decks
- Import/export (CSV, Anki format)
- Audio pronunciation
- Study streaks and statistics graphs

## Links

- [Telegram Mini Apps Docs](https://core.telegram.org/bots/webapps)
- [Telegram Bot API](https://core.telegram.org/bots/api)

## License

MIT

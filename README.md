# Anki Cards - Telegram Mini App 🎴

A complete flashcard learning app inside Telegram - **no commands needed**, just beautiful UI with flip animations and swipe gestures.

## ✨ Features

**Zero Commands - Just UI:**
- 🏠 Home screen with statistics
- ➕ Add cards with a form (no `/add` command)
- 📋 View and manage all cards
- 📚 Learn mode with flip animations
- ✅ Swipe right = Learned
- 🔄 Swipe left = Repeat
- 🎉 Session complete with statistics

**Modern Mini App Experience:**
- Full-screen interactive app
- Native Telegram theme integration
- Smooth animations and transitions
- Haptic feedback
- Touch gestures
- Back button navigation

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Bot
1. Create bot with [@BotFather](https://t.me/BotFather)
2. Copy `.env.example` to `.env`
3. Add your `BOT_TOKEN`

### 3. Setup HTTPS URL

**For Local Testing:**
```bash
# Install ngrok
npm install -g ngrok

# Start ngrok (in separate terminal)
ngrok http 3000

# Copy the HTTPS URL to .env as MINIAPP_URL
# Example: MINIAPP_URL=https://abc123.ngrok.io
```

**For Production:**
- Deploy to Vercel, Netlify, or any static hosting
- Add production URL to `.env`

### 4. Start the App
```bash
npm start
```

### 5. Test
1. Open your bot in Telegram
2. Send `/start`
3. Tap "🚀 Open Anki Cards"
4. Enjoy the full Mini App experience!

## 📱 How to Use

### No Commands Required!
Everything is done through the Mini App UI:

1. **Open the app** - Tap the button from the bot
2. **Add cards** - Use the "➕ Add New Card" button
3. **Start learning** - Tap "📚 Start Learning"
4. **Flip cards** - Tap the card to see translation
5. **Swipe or tap buttons**:
   - Swipe right or tap ✅ = Learned
   - Swipe left or tap 🔄 = Repeat
6. **View progress** - See stats on home screen

### Navigation
- 🏠 Home - Main screen with statistics
- ➕ Add - Create new flashcards
- 📋 List - View all your cards
- 📚 Learn - Practice with flip animations

## 🏗️ Project Structure

```
anki-miniapp/
├── bot.js              # Minimal launcher bot + API
├── miniapp/
│   └── index.html      # Complete Mini App (all UI)
├── package.json
├── .env.example
└── README.md
```

## 🎨 Features in Detail

### Home Screen
- Total cards counter
- Learned cards counter
- Learning cards counter
- Quick action buttons

### Add Card Screen
- Word input field
- Translation input field
- Instant save with notification to bot

### Card List Screen
- All cards with status icons
- Delete functionality
- Status: 📖 Learning, ✅ Learned, 🔄 Repeat

### Learn Screen
- Progress bar
- 3D flip animation
- Swipe gestures with visual indicators
- Buttons for learned/repeat
- Haptic feedback
- Session tracking

### Complete Screen
- Celebration animation
- Session statistics
- Notification sent to bot

## 🔧 API Endpoints

The bot serves these endpoints:

- `GET /api/cards/:userId` - Get user's cards
- `POST /api/cards/:userId` - Add new card
- `POST /api/cards/:userId/:cardId` - Update card status
- `DELETE /api/cards/:userId/:cardId` - Delete card

## 🎯 Key Differences from Command-Based Bots

### Old Way (Commands):
```
User: /start
Bot: "Use /add word - translation to add cards"
User: /add hello - привет
Bot: "Added! Use /learn to start"
User: /learn
Bot: Shows text...
```

### New Way (Mini App):
```
User: /start
Bot: Shows button "🚀 Open Anki Cards"
User: Taps button
→ Full app opens with beautiful UI
→ All interaction happens inside
→ No more typing commands!
```

## 🚀 Deployment

### Backend (Bot + API)
Deploy to any Node.js hosting:
- **Heroku**: `git push heroku main`
- **Railway**: Connect repo and deploy
- **Render**: Connect repo and deploy

### Frontend (Mini App)
The Mini App is served by the same Express server, so it deploys together with the bot. No separate frontend deployment needed!

### Production Checklist
- ✅ HTTPS URL (required)
- ✅ Valid SSL certificate
- ✅ Environment variables set
- ✅ Bot token configured
- ✅ Mini App URL updated

## 💾 Storage

Currently uses in-memory storage. For production:

**Option 1 - Database:**
```javascript
// Replace userCards Map with MongoDB/PostgreSQL
const mongoose = require('mongoose');
const Card = mongoose.model('Card', {
  userId: Number,
  word: String,
  translation: String,
  status: String
});
```

**Option 2 - Telegram Cloud Storage:**
```javascript
// Use tg.CloudStorage in the Mini App
tg.CloudStorage.setItem('cards', JSON.stringify(cards));
```

**Option 3 - File Storage:**
```javascript
// Simple JSON file (for small scale)
const fs = require('fs');
fs.writeFileSync(`users/${userId}.json`, JSON.stringify(cards));
```

## 🎨 Customization

### Change Colors
Edit CSS variables in `miniapp/index.html`:
```css
.card-front {
  background: linear-gradient(135deg, #yourColor1, #yourColor2);
}
```

### Change Animations
Modify animation timings:
```css
.flashcard {
  transition: transform 0.6s; /* Flip speed */
}
```

### Add More Card Types
Extend the card schema:
```javascript
{
  word: String,
  translation: String,
  example: String,        // NEW
  pronunciation: String,  // NEW
  image: String          // NEW
}
```

## 📊 Future Enhancements

- [ ] Spaced repetition algorithm (SM-2)
- [ ] Multiple decks/categories
- [ ] Import/export (CSV, Anki format)
- [ ] Audio pronunciation (text-to-speech)
- [ ] Images on cards
- [ ] Study streaks and goals
- [ ] Statistics graphs
- [ ] Share decks with friends

## 🐛 Troubleshooting

**Mini App doesn't open:**
- Check MINIAPP_URL is HTTPS
- Verify ngrok is running
- Check bot token is correct

**Cards not saving:**
- Check API endpoints are accessible
- Verify user ID is being passed
- Check console for errors

**Swipe not working:**
- Make sure card is flipped first
- Try button alternative
- Check touch events in console

## 📚 Learn More

- [Telegram Mini Apps Docs](https://core.telegram.org/bots/webapps)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Mini App Examples](https://core.telegram.org/bots/webapps#examples)

## 📄 License

MIT

---

**Pro Tip:** This is a Mini App, not a command-based bot. Users should never type commands - everything happens through the beautiful UI! 🎨✨

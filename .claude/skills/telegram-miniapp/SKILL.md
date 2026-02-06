---
name: telegram-miniapp
description: Build Telegram Mini Apps (formerly WebApps) - interactive HTML5 applications that run inside Telegram with zero commands, button-driven UI, native animations, and seamless bot integration. Use when creating interactive Telegram applications with rich UI, forms, games, tools, or any app-like experience accessible via Telegram bot buttons or attachment menu.
---

# Telegram Mini App Development

Build interactive HTML5 applications that run seamlessly inside Telegram - no commands, just buttons and beautiful UI.

## Philosophy

**Mini Apps replace commands with buttons and UI.** Users interact entirely through the visual interface, not by typing commands. The bot serves as a launcher and notification system.

## Quick Start

**Minimal Mini App setup:**

```javascript
// bot.js - Just launches the Mini App
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.BOT_TOKEN, {polling: true});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Welcome! 👋', {
    reply_markup: {
      inline_keyboard: [[{
        text: '🚀 Open App',
        web_app: {url: process.env.MINIAPP_URL}
      }]]
    }
  });
});
```

```html
<!-- Mini App - All interaction happens here -->
<!DOCTYPE html>
<html>
<head>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
</head>
<body>
  <button id="action">Do Something</button>
  <script>
    const tg = window.Telegram.WebApp;
    tg.expand();
    
    document.getElementById('action').onclick = () => {
      // All logic in Mini App, not in bot commands
      tg.showAlert('Action completed!');
    };
  </script>
</body>
</html>
```

## Architecture

**Modern Mini App structure:**

```
User opens Telegram Bot
    ↓
Taps button → Mini App opens (full screen)
    ↓
All interaction in Mini App UI
    ↓
Mini App sends results back to bot
    ↓
Bot shows confirmation message
```

**Key principle:** The bot is a launcher and notifier. All UI, forms, navigation, and interaction logic lives in the Mini App.

## Core Setup

### 1. Bot as Launcher

```javascript
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.BOT_TOKEN, {polling: true});

// Single entry point - no command menu needed
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.first_name;
  
  bot.sendMessage(chatId, `Hi ${username}! 👋`, {
    reply_markup: {
      inline_keyboard: [[{
        text: '🚀 Open App',
        web_app: {url: `${process.env.MINIAPP_URL}?user_id=${userId}`}
      }]]
    }
  });
});

// Handle data from Mini App
bot.on('web_app_data', (msg) => {
  const data = JSON.parse(msg.web_app_data.data);
  // Send confirmation
  bot.sendMessage(msg.chat.id, `✅ ${data.message}`);
});
```

### 2. Mini App Structure

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <style>
    body {
      font-family: -apple-system, system-ui, sans-serif;
      background: var(--tg-theme-bg-color);
      color: var(--tg-theme-text-color);
      padding: 20px;
      margin: 0;
    }
    .btn {
      width: 100%;
      padding: 16px;
      background: var(--tg-theme-button-color);
      color: var(--tg-theme-button-text-color);
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>My Mini App</h1>
  <button class="btn" id="actionBtn">Take Action</button>
  
  <script>
    const tg = window.Telegram.WebApp;
    tg.expand(); // Full screen
    tg.ready();
    
    // Get user info
    const user = tg.initDataUnsafe.user;
    console.log('User:', user);
    
    document.getElementById('actionBtn').onclick = () => {
      // Send result to bot
      tg.sendData(JSON.stringify({
        action: 'completed',
        message: 'Action completed successfully!'
      }));
    };
  </script>
</body>
</html>
```

### 3. Serve Mini App

```javascript
// server.js
const express = require('express');
const app = express();

app.use(express.static('miniapp'));

app.listen(process.env.PORT || 3000, () => {
  console.log('Mini App server running');
});
```

## Mini App Patterns

### Navigation Pattern

Use internal navigation, not commands:

```html
<div id="screen1" class="screen">
  <h1>Welcome</h1>
  <button onclick="showScreen('screen2')">Next</button>
</div>

<div id="screen2" class="screen" style="display:none">
  <button onclick="showScreen('screen1')">Back</button>
  <h1>Second Screen</h1>
</div>

<script>
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'block';
  
  // Update back button
  if (id === 'screen1') {
    tg.BackButton.hide();
  } else {
    tg.BackButton.show();
  }
}

tg.BackButton.onClick(() => showScreen('screen1'));
</script>
```

### Form Pattern

```html
<form id="myForm">
  <input type="text" name="name" placeholder="Your name">
  <input type="email" name="email" placeholder="Email">
  <button type="submit">Submit</button>
</form>

<script>
document.getElementById('myForm').onsubmit = (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  // Send to bot
  tg.sendData(JSON.stringify({
    action: 'form_submit',
    ...data
  }));
};

// Or use Main Button
tg.MainButton.setText('Submit').show().onClick(() => {
  const data = /* collect form data */;
  tg.sendData(JSON.stringify(data));
});
</script>
```

### List/Cards Pattern

```html
<div id="cardList"></div>

<script>
const items = [
  {id: 1, title: 'Item 1'},
  {id: 2, title: 'Item 2'}
];

function renderList() {
  const html = items.map(item => `
    <div class="card" onclick="selectItem(${item.id})">
      <h3>${item.title}</h3>
    </div>
  `).join('');
  document.getElementById('cardList').innerHTML = html;
}

function selectItem(id) {
  tg.HapticFeedback.impactOccurred('medium');
  // Show detail view or take action
}

renderList();
</script>
```

### Swipe/Gesture Pattern

```html
<div id="swipeCard" class="card">Swipe me</div>

<script>
let touchStartX = 0;

const card = document.getElementById('swipeCard');

card.ontouchstart = (e) => {
  touchStartX = e.touches[0].clientX;
};

card.ontouchmove = (e) => {
  const diff = e.touches[0].clientX - touchStartX;
  card.style.transform = `translateX(${diff}px) rotate(${diff/10}deg)`;
};

card.ontouchend = (e) => {
  const diff = e.changedTouches[0].clientX - touchStartX;
  
  if (Math.abs(diff) > 100) {
    // Swiped
    const direction = diff > 0 ? 'right' : 'left';
    handleSwipe(direction);
  }
  
  card.style.transform = '';
};
</script>
```

## Main Button Control

The Main Button is a primary action button at the bottom of the Mini App:

```javascript
// Show and configure
tg.MainButton
  .setText('Continue')
  .show()
  .enable()
  .onClick(() => {
    // Handle action
    tg.MainButton.showProgress(); // Show spinner
    
    // After action completes
    tg.MainButton.hideProgress();
    tg.close(); // Close Mini App
  });

// Update dynamically
function updateMainButton(text, enabled = true) {
  tg.MainButton.setText(text);
  enabled ? tg.MainButton.enable() : tg.MainButton.disable();
}

// Hide when not needed
tg.MainButton.hide();
```

## Theme Integration

Mini Apps automatically use Telegram's theme:

```css
body {
  background: var(--tg-theme-bg-color);
  color: var(--tg-theme-text-color);
}

.button {
  background: var(--tg-theme-button-color);
  color: var(--tg-theme-button-text-color);
}

.secondary {
  background: var(--tg-theme-secondary-bg-color);
}

a {
  color: var(--tg-theme-link-color);
}
```

Available theme variables:
- `--tg-theme-bg-color`
- `--tg-theme-text-color`
- `--tg-theme-hint-color`
- `--tg-theme-link-color`
- `--tg-theme-button-color`
- `--tg-theme-button-text-color`
- `--tg-theme-secondary-bg-color`

## Haptic Feedback

Provide tactile feedback for better UX:

```javascript
// Impact feedback
tg.HapticFeedback.impactOccurred('light');   // Light tap
tg.HapticFeedback.impactOccurred('medium');  // Normal tap
tg.HapticFeedback.impactOccurred('heavy');   // Strong tap

// Notification feedback
tg.HapticFeedback.notificationOccurred('success'); // Success
tg.HapticFeedback.notificationOccurred('warning'); // Warning
tg.HapticFeedback.notificationOccurred('error');   // Error

// Selection changed
tg.HapticFeedback.selectionChanged(); // When scrolling through list
```

## Popups and Alerts

```javascript
// Simple alert
tg.showAlert('Operation completed!');

// Confirm dialog
tg.showConfirm('Are you sure?', (confirmed) => {
  if (confirmed) {
    // User confirmed
  }
});

// Custom popup with buttons
tg.showPopup({
  title: 'Choose Action',
  message: 'What would you like to do?',
  buttons: [
    {id: 'save', type: 'default', text: 'Save'},
    {id: 'delete', type: 'destructive', text: 'Delete'},
    {id: 'cancel', type: 'cancel'}
  ]
}, (buttonId) => {
  if (buttonId === 'save') {
    // Handle save
  }
});
```

## Cloud Storage

Store user data in Telegram's cloud:

```javascript
// Save data
tg.CloudStorage.setItem('user_settings', JSON.stringify({
  theme: 'dark',
  notifications: true
}), (error) => {
  if (!error) console.log('Saved');
});

// Load data
tg.CloudStorage.getItem('user_settings', (error, value) => {
  if (!error && value) {
    const settings = JSON.parse(value);
  }
});

// Load multiple keys
tg.CloudStorage.getItems(['key1', 'key2'], (error, values) => {
  console.log(values); // {key1: 'value1', key2: 'value2'}
});

// Get all keys
tg.CloudStorage.getKeys((error, keys) => {
  console.log('All keys:', keys);
});
```

## Deployment Checklist

**Requirements:**
- ✅ HTTPS only (required for Mini Apps)
- ✅ Valid SSL certificate
- ✅ Responsive design (works on mobile)
- ✅ Fast loading (<3s)

**Quick deploy:**
1. Frontend: Vercel, Netlify, Cloudflare Pages
2. Backend bot: Heroku, Railway, Render
3. Local testing: ngrok for HTTPS

**Production setup:**
```bash
# Frontend (static hosting)
vercel deploy miniapp/

# Backend bot (Node.js hosting)
git push heroku main

# Update bot with Mini App URL
BOT_TOKEN=xxx MINIAPP_URL=https://yourapp.vercel.app node bot.js
```

## Anti-Patterns

**❌ Don't:**
- Don't create command menus when buttons work better
- Don't type commands inside the Mini App
- Don't show the Mini App URL to users
- Don't use complex command syntax

**✅ Do:**
- Use buttons for all interactions
- Design for mobile-first
- Provide haptic feedback
- Use Telegram theme colors
- Keep it fast and responsive

## Common Use Cases

**Forms & Surveys** - Replace command-based forms with proper UI
**Games** - Interactive games with touch controls
**Tools & Calculators** - Visual tools instead of text commands
**Dashboards** - Display data with charts and cards
**E-commerce** - Browse and purchase with full UI
**Content Creation** - Rich editors and creators

## Resources

- [Mini App API](references/miniapp-api.md) - Complete API reference
- [Bot API](references/bot-api.md) - Bot integration methods
- [Examples](assets/examples/) - Complete working examples

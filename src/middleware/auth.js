const crypto = require('crypto');

function validateTelegramInitData(initData, botToken) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  params.delete('hash');

  // Sort params alphabetically and join with \n
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${key}=${val}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (computedHash !== hash) return null;

  // Check auth_date freshness (reject >24h)
  const authDate = parseInt(params.get('auth_date'), 10);
  if (!authDate || (Date.now() / 1000 - authDate) > 86400) return null;

  try {
    const user = JSON.parse(params.get('user'));
    return {
      userId: String(user.id),
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      username: user.username || ''
    };
  } catch {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const initData = req.headers['x-telegram-init-data'];

  // Dev bypass
  if (process.env.NODE_ENV === 'development' && !initData) {
    req.telegramUser = { userId: req.params.userId, firstName: '', lastName: '', username: '' };
    return next();
  }

  if (!initData) {
    return res.status(401).json({ error: 'Missing authentication' });
  }

  const user = validateTelegramInitData(initData, process.env.BOT_TOKEN);
  if (!user) {
    return res.status(401).json({ error: 'Invalid authentication' });
  }

  req.telegramUser = user;
  req.params.userId = user.userId;
  next();
}

module.exports = { authMiddleware, validateTelegramInitData };

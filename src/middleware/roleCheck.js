const { User } = require('../models');

function requireRole(role) {
  return async (req, res, next) => {
    try {
      const user = await User.findOne({ telegramId: req.params.userId });
      if (!user || user.role !== role) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    } catch (err) {
      console.error('roleCheck error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

module.exports = { requireRole };

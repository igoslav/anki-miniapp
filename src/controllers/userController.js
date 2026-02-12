const db = require('../db/db');

function getUser(req, res) {
  const user = db.getUser(req.params.userId);
  res.json(user);
}

module.exports = { getUser };

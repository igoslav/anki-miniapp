const express = require('express');
const path = require('path');
const routes = require('./routes');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'miniapp')));
  app.use(routes);
  return app;
}

module.exports = createApp;

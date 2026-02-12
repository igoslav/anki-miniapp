require('dotenv').config();
const createApp = require('./src/app');
const bot = require('./src/bot/bot');
const { registerHandlers } = require('./src/bot/handlers');
const { scheduleCronJobs } = require('./src/bot/cron');

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  registerHandlers(bot);
  scheduleCronJobs(bot);
});

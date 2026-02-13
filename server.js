require('dotenv').config();
const { connectDB } = require('./src/db/mongoose');
const createApp = require('./src/app');
const bot = require('./src/bot/bot');
const { registerHandlers } = require('./src/bot/handlers');
const { scheduleCronJobs } = require('./src/bot/cron');

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    registerHandlers(bot);
    scheduleCronJobs(bot);
  });
}

start().catch(err => {
  console.error('Startup failed:', err);
  process.exit(1);
});

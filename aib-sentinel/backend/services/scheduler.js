const cron = require('node-cron');
const { runAllFeeds } = require('./feedFetcher');
const { generateBrief } = require('./briefGenerator');

function startScheduler() {
  // Daily at 06:00 Palestine time (UTC+3 → UTC 03:00) — pull all feeds
  cron.schedule('0 3 * * *', async () => {
    console.log('[Scheduler] Running daily feed refresh...');
    await runAllFeeds().catch(err => console.error('[Scheduler] Feed error:', err.message));
  }, { timezone: 'Asia/Jerusalem' });

  // Daily at 06:30 — generate brief from today's feed data
  cron.schedule('30 3 * * *', async () => {
    console.log('[Scheduler] Generating daily brief...');
    await generateBrief().catch(err => console.error('[Scheduler] Brief error:', err.message));
  }, { timezone: 'Asia/Jerusalem' });

  console.log('[Scheduler] Jobs registered: feeds at 06:00, brief at 06:30 (Asia/Jerusalem)');
}

module.exports = { startScheduler };

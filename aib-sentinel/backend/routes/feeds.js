const express = require('express');
const { getDb } = require('../db/database');
const { runAllFeeds } = require('../services/feedFetcher');

const router = express.Router();

router.get('/status', (req, res) => {
  const db = getDb();
  const sources = db.prepare('SELECT * FROM feed_sources ORDER BY name').all();
  res.json({ data: sources });
});

router.post('/run', async (req, res) => {
  try {
    res.json({ message: 'Feed refresh started' });
    await runAllFeeds();
  } catch (err) {
    console.error('Feed run error:', err.message);
  }
});

router.get('/cves/recent', (req, res) => {
  const db = getDb();
  const since = req.query.since || new Date(Date.now() - 7 * 86400000).toISOString();
  const cves = db.prepare(`
    SELECT * FROM cve_cache
    WHERE fetched_at >= ?
    ORDER BY cvss_score DESC, fetched_at DESC
    LIMIT 100
  `).all(since);
  res.json({ data: cves });
});

module.exports = router;

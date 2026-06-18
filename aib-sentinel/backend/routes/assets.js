const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const assets = db.prepare('SELECT * FROM assets WHERE active = 1 ORDER BY name').all();
  res.json({ data: assets });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, category, vendor, version, eol_status, psirt_url, frameworks, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Asset name required' });

  const result = db.prepare(`
    INSERT INTO assets (name, category, vendor, version, eol_status, psirt_url, frameworks, notes)
    VALUES (@name, @category, @vendor, @version, @eol_status, @psirt_url, @frameworks, @notes)
  `).run({ name, category: category || '', vendor: vendor || '', version: version || '', eol_status: eol_status || 'active', psirt_url: psirt_url || '', frameworks: frameworks || '[]', notes: notes || '' });

  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ data: asset });
});

router.patch('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Asset not found' });

  const fields = ['name', 'category', 'vendor', 'version', 'eol_status', 'psirt_url', 'frameworks', 'notes'];
  const updates = {};
  fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  updates.updated_at = new Date().toISOString();

  const setClauses = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE assets SET ${setClauses} WHERE id = @id`).run({ ...updates, id: req.params.id });

  res.json({ data: db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id) });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE assets SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;

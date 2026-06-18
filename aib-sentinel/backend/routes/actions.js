const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { status } = req.query;
  let query = 'SELECT * FROM actions';
  const params = [];
  if (status) { query += ' WHERE status = ?'; params.push(status); }
  query += ' ORDER BY priority ASC, created_at DESC';
  res.json({ data: db.prepare(query).all(...params) });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { title, description, effort, controls, priority, brief_id, due_date } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const result = db.prepare(`
    INSERT INTO actions (title, description, effort, controls, priority, brief_id, due_date)
    VALUES (@title, @description, @effort, @controls, @priority, @brief_id, @due_date)
  `).run({ title, description: description || '', effort: effort || '', controls: controls || '', priority: priority ?? 2, brief_id: brief_id || null, due_date: due_date || null });

  res.status(201).json({ data: db.prepare('SELECT * FROM actions WHERE id = ?').get(result.lastInsertRowid) });
});

router.patch('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM actions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Action not found' });

  const fields = ['title', 'description', 'effort', 'controls', 'priority', 'status', 'due_date'];
  const updates = {};
  fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  updates.updated_at = new Date().toISOString();

  const setClauses = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE actions SET ${setClauses} WHERE id = @id`).run({ ...updates, id: req.params.id });

  res.json({ data: db.prepare('SELECT * FROM actions WHERE id = ?').get(req.params.id) });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM actions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;

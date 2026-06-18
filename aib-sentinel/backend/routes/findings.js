const express = require('express');
const { getDb } = require('../db/database');
const { generateFinding } = require('../services/briefGenerator');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const findings = db.prepare('SELECT * FROM findings ORDER BY created_at DESC').all();
  res.json({ data: findings });
});

router.post('/generate', async (req, res) => {
  const { asset_name, context, finding_type, language } = req.body;
  if (!asset_name || !context) return res.status(400).json({ error: 'asset_name and context required' });

  try {
    const result = await generateFinding({ asset_name, context, finding_type: finding_type || 'vulnerability', language: language || 'en' });
    const db = getDb();
    const ins = db.prepare(`
      INSERT INTO findings (title, asset, condition_text, criteria, cause, effect, recommendation, risk_rating, status, frameworks)
      VALUES (@title, @asset, @condition_text, @criteria, @cause, @effect, @recommendation, @risk_rating, 'draft', @frameworks)
    `).run({ ...result, asset: asset_name, frameworks: result.frameworks || '[]' });

    res.json({ data: { id: ins.lastInsertRowid, ...result } });
  } catch (err) {
    console.error('Finding generation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM findings WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Finding not found' });

  const fields = ['title', 'condition_text', 'criteria', 'cause', 'effect', 'recommendation', 'risk_rating', 'status'];
  const updates = {};
  fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  updates.updated_at = new Date().toISOString();

  const setClauses = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE findings SET ${setClauses} WHERE id = @id`).run({ ...updates, id: req.params.id });
  res.json({ data: db.prepare('SELECT * FROM findings WHERE id = ?').get(req.params.id) });
});

router.get('/:id/pdf', (req, res) => {
  const PDFDocument = require('pdfkit');
  const db = getDb();
  const f = db.prepare('SELECT * FROM findings WHERE id = ?').get(req.params.id);
  if (!f) return res.status(404).json({ error: 'Finding not found' });

  const doc = new PDFDocument({ margin: 50 });
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="finding-${f.id}-${f.asset || 'aib'}.pdf"`,
  });
  doc.pipe(res);

  const BLUE = '#1e3a5f';
  doc.fontSize(18).fillColor(BLUE).text('AIB Sentinel — Audit Finding', { align: 'center' });
  doc.fontSize(11).fillColor('#666').text(`Finding #${f.id}  |  Asset: ${f.asset}  |  Created: ${f.created_at?.slice(0, 10)}`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).fillColor('#cc0000').text('CONFIDENTIAL — INTERNAL USE ONLY', { align: 'center' });
  doc.moveDown(2);

  const rating = f.risk_rating || 'Medium';
  const ratingColor = rating === 'Critical' ? '#cc0000' : rating === 'High' ? '#e07000' : rating === 'Medium' ? '#cc8800' : '#007700';

  doc.fontSize(14).fillColor(BLUE).text(`${f.title || 'Untitled Finding'}`);
  doc.fontSize(11).fillColor(ratingColor).text(`Risk Rating: ${rating}`);
  doc.moveDown();

  const sections = [
    ['Condition', f.condition_text],
    ['Criteria', f.criteria],
    ['Cause', f.cause],
    ['Effect / Consequence', f.effect],
    ['Recommendation', f.recommendation],
  ];

  sections.forEach(([label, text]) => {
    if (!text) return;
    doc.fontSize(12).fillColor(BLUE).text(label, { underline: true });
    doc.fontSize(10).fillColor('#222').text(text);
    doc.moveDown();
  });

  doc.end();
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM findings WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;

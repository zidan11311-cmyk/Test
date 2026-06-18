const express = require('express');
const { getDb } = require('../db/database');
const { generateBrief } = require('../services/briefGenerator');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const limit = parseInt(req.query.limit) || 30;
  const briefs = db.prepare('SELECT id, brief_date, headline, posture_change, generated_at FROM briefs ORDER BY brief_date DESC LIMIT ?').all(limit);
  res.json({ data: briefs });
});

router.get('/today', (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const brief = db.prepare('SELECT * FROM briefs WHERE brief_date = ?').get(today);
  if (!brief) return res.json({ data: null });
  res.json({ data: brief });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const brief = db.prepare('SELECT * FROM briefs WHERE id = ?').get(req.params.id);
  if (!brief) return res.status(404).json({ error: 'Brief not found' });
  if (brief.content_json) {
    try { brief.content = JSON.parse(brief.content_json); } catch { brief.content = {}; }
  }
  res.json({ data: brief });
});

router.post('/generate', async (req, res) => {
  try {
    const brief = await generateBrief();
    res.json({ data: brief });
  } catch (err) {
    console.error('Brief generation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/pdf', (req, res) => {
  const PDFDocument = require('pdfkit');
  const db = getDb();
  const brief = db.prepare('SELECT * FROM briefs WHERE id = ?').get(req.params.id);
  if (!brief) return res.status(404).json({ error: 'Brief not found' });

  let content = {};
  try { content = JSON.parse(brief.content_json || '{}'); } catch {}

  const doc = new PDFDocument({ margin: 50 });
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="aib-sentinel-brief-${brief.brief_date}.pdf"`,
  });
  doc.pipe(res);

  doc.fontSize(20).fillColor('#1e3a5f').text('AIB Sentinel — Daily Intelligence Brief', { align: 'center' });
  doc.fontSize(12).fillColor('#666').text(`Date: ${brief.brief_date}  |  Generated: ${brief.generated_at}`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).fillColor('#cc0000').text('CONFIDENTIAL — INTERNAL USE ONLY', { align: 'center' });
  doc.moveDown(2);

  if (brief.headline) {
    doc.fontSize(14).fillColor('#1e3a5f').text('HEADLINE');
    doc.fontSize(11).fillColor('#222').text(brief.headline);
    doc.moveDown();
  }

  const sections = [
    ['CISO Perspective', content.ciso],
    ['Chief Audit Executive', content.cae],
    ['Head of IS Risk', content.risk],
    ['Threat Intelligence Lead', content.ti],
    ['Regulatory & Compliance Counsel', content.compliance],
    ['Today\'s Actions', content.actions],
    ['Audit Angle', content.audit_angle],
  ];

  sections.forEach(([label, text]) => {
    if (!text) return;
    doc.fontSize(13).fillColor('#1e3a5f').text(label);
    doc.fontSize(10).fillColor('#222').text(text);
    doc.moveDown();
  });

  doc.end();
});

module.exports = router;

const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { asset, minCvss, kev, limit = 100, offset = 0 } = req.query;

  let query = 'SELECT * FROM cve_cache WHERE 1=1';
  const params = [];

  if (asset) {
    query += " AND affected_assets LIKE ?";
    params.push(`%${asset}%`);
  }
  if (minCvss) {
    query += ' AND cvss_score >= ?';
    params.push(parseFloat(minCvss));
  }
  if (kev === 'true') {
    query += ' AND kev_listed = 1';
  }

  query += ' ORDER BY kev_listed DESC, cvss_score DESC, fetched_at DESC';
  query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

  const cves = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as c FROM cve_cache').get().c;

  res.json({ data: cves, meta: { total, limit: parseInt(limit), offset: parseInt(offset) } });
});

router.get('/export/excel', (req, res) => {
  const xlsx = require('xlsx');
  const db = getDb();
  const cves = db.prepare('SELECT cve_id, title, description, cvss_score, kev_listed, affected_assets, vendor, product, published, fetched_at FROM cve_cache ORDER BY cvss_score DESC').all();

  const rows = cves.map(c => ({
    'CVE ID': c.cve_id || '',
    'Title': c.title || '',
    'Description': (c.description || '').slice(0, 200),
    'CVSS Score': c.cvss_score || '',
    'KEV Listed': c.kev_listed ? 'YES' : 'No',
    'Affected Assets': c.affected_assets || '',
    'Vendor': c.vendor || '',
    'Product': c.product || '',
    'Published': c.published || '',
    'Fetched': c.fetched_at || '',
  }));

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 18 }, { wch: 40 }, { wch: 60 }, { wch: 10 }, { wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
  xlsx.utils.book_append_sheet(wb, ws, 'CVE Watchlist');

  const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="aib-sentinel-cve-watchlist-${new Date().toISOString().slice(0, 10)}.xlsx"`,
  });
  res.send(buf);
});

module.exports = router;

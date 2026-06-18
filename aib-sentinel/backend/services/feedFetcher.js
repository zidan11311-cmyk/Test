const xml2js = require('xml2js');
const { getDb } = require('../db/database');

const ASSET_KEYWORDS = [
  'Oracle WebLogic', 'Oracle Database', 'Oracle ORDS', 'ORDS',
  'Windows Server', 'Active Directory', 'Microsoft Exchange',
  'FortiWeb', 'Fortinet',
  'Cisco IOS', 'Cisco IOS XE', 'Catalyst 2960', 'Catalyst 3650',
  'HPE StoreOnce', 'StoreOnce',
  'Tridium Niagara', 'Niagara Framework',
  'SWIFT Alliance', 'SWIFT',
];

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.text();
}

async function parseRss(xml) {
  const result = await xml2js.parseStringPromise(xml, { explicitArray: false, ignoreAttrs: false });
  const channel = result?.rss?.channel || result?.feed;
  const items = channel?.item || channel?.entry || [];
  return Array.isArray(items) ? items : [items];
}

function upsertCve(db, item) {
  db.prepare(`
    INSERT INTO cve_cache (cve_id, source, title, description, cvss_score, kev_listed, affected_assets, vendor, product, published)
    VALUES (@cve_id, @source, @title, @description, @cvss_score, @kev_listed, @affected_assets, @vendor, @product, @published)
    ON CONFLICT(cve_id, source) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      cvss_score = MAX(cve_cache.cvss_score, excluded.cvss_score),
      kev_listed = MAX(cve_cache.kev_listed, excluded.kev_listed),
      fetched_at = datetime('now')
  `).run(item);
}

function matchAssets(text) {
  const matched = [];
  ASSET_KEYWORDS.forEach(kw => {
    if (text && text.toLowerCase().includes(kw.toLowerCase())) {
      matched.push(kw);
    }
  });
  return JSON.stringify([...new Set(matched)]);
}

async function fetchCisaKev(db) {
  const source = db.prepare('SELECT * FROM feed_sources WHERE name = ?').get('CISA KEV');
  try {
    const data = await fetchJson(source.url);
    const vulns = data.vulnerabilities || [];
    let count = 0;
    vulns.forEach(v => {
      const text = `${v.vendorProject} ${v.product} ${v.vulnerabilityName} ${v.shortDescription}`;
      upsertCve(db, {
        cve_id: v.cveID,
        source: 'CISA KEV',
        title: v.vulnerabilityName,
        description: v.shortDescription,
        cvss_score: null,
        kev_listed: 1,
        affected_assets: matchAssets(text),
        vendor: v.vendorProject,
        product: v.product,
        published: v.dateAdded,
      });
      count++;
    });
    db.prepare('UPDATE feed_sources SET last_fetched = datetime(\'now\'), last_status = ?, item_count = ?, last_error = NULL WHERE name = ?').run('ok', count, 'CISA KEV');
    console.log(`CISA KEV: ${count} entries`);
  } catch (err) {
    db.prepare('UPDATE feed_sources SET last_status = ?, last_error = ? WHERE name = ?').run('error', err.message, 'CISA KEV');
    console.error('CISA KEV fetch failed:', err.message);
  }
}

async function fetchNvd(db) {
  const source = db.prepare('SELECT * FROM feed_sources WHERE name = ?').get('NVD CVE API');
  const apiKey = process.env.NVD_API_KEY;
  const delay = ms => new Promise(r => setTimeout(r, ms));
  let totalCount = 0;

  const keywords = ['Oracle WebLogic', 'FortiWeb', 'Cisco IOS XE', 'Tridium Niagara', 'HPE StoreOnce', 'SWIFT Alliance', 'Microsoft Exchange', 'Windows Server'];
  try {
    for (const kw of keywords) {
      try {
        const headers = apiKey ? { apiKey } : {};
        const url = `${source.url}?keywordSearch=${encodeURIComponent(kw)}&pubStartDate=${new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 19)}.000&resultsPerPage=20`;
        const data = await fetchJson(url, headers);
        const vulns = data.vulnerabilities || [];
        vulns.forEach(({ cve }) => {
          const desc = cve.descriptions?.find(d => d.lang === 'en')?.value || '';
          const cvss = cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore ||
                       cve.metrics?.cvssMetricV30?.[0]?.cvssData?.baseScore ||
                       cve.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore || null;
          upsertCve(db, {
            cve_id: cve.id,
            source: 'NVD',
            title: cve.id,
            description: desc.slice(0, 500),
            cvss_score: cvss,
            kev_listed: 0,
            affected_assets: matchAssets(`${kw} ${desc}`),
            vendor: kw,
            product: kw,
            published: cve.published?.slice(0, 10) || null,
          });
          totalCount++;
        });
      } catch (e) {
        console.error(`NVD keyword "${kw}" failed:`, e.message);
      }
      if (!apiKey) await delay(7000);
    }
    db.prepare('UPDATE feed_sources SET last_fetched = datetime(\'now\'), last_status = ?, item_count = ?, last_error = NULL WHERE name = ?').run('ok', totalCount, 'NVD CVE API');
    console.log(`NVD: ${totalCount} entries`);
  } catch (err) {
    db.prepare('UPDATE feed_sources SET last_status = ?, last_error = ? WHERE name = ?').run('error', err.message, 'NVD CVE API');
  }
}

async function fetchRssFeed(db, feedName) {
  const source = db.prepare('SELECT * FROM feed_sources WHERE name = ?').get(feedName);
  if (!source) return;
  try {
    const xml = await fetchText(source.url);
    const items = await parseRss(xml);
    let count = 0;
    items.slice(0, 50).forEach(item => {
      const title = item.title?._ || item.title || '';
      const desc = item.description?._ || item.description || item.summary?._ || item.summary || '';
      const link = item.link?._ || item.link || '';
      const pubDate = item.pubDate || item.published || item.updated || '';
      const cveMatch = (title + ' ' + desc).match(/CVE-\d{4}-\d+/i);
      const cveId = cveMatch ? cveMatch[0].toUpperCase() : `${feedName.replace(/\s/g, '-')}-${Date.now()}-${count}`;
      upsertCve(db, {
        cve_id: cveId,
        source: feedName,
        title: title.slice(0, 200),
        description: desc.replace(/<[^>]+>/g, '').slice(0, 500),
        cvss_score: null,
        kev_listed: 0,
        affected_assets: matchAssets(title + ' ' + desc),
        vendor: feedName,
        product: '',
        published: pubDate ? new Date(pubDate).toISOString().slice(0, 10) : null,
      });
      count++;
    });
    db.prepare('UPDATE feed_sources SET last_fetched = datetime(\'now\'), last_status = ?, item_count = ?, last_error = NULL WHERE name = ?').run('ok', count, feedName);
    console.log(`${feedName}: ${count} entries`);
  } catch (err) {
    db.prepare('UPDATE feed_sources SET last_status = ?, last_error = ? WHERE name = ?').run('error', err.message, feedName);
    console.error(`${feedName} fetch failed:`, err.message);
  }
}

async function fetchMsrc(db) {
  const source = db.prepare('SELECT * FROM feed_sources WHERE name = ?').get('Microsoft MSRC');
  try {
    const data = await fetchJson(source.url);
    const updates = data.value || [];
    let count = 0;
    for (const update of updates.slice(0, 3)) {
      try {
        const cvrf = await fetchJson(`https://api.msrc.microsoft.com/cvrf/v2.0/cvrf/${update.ID}`);
        const vulns = cvrf.Vulnerability || [];
        vulns.slice(0, 30).forEach(v => {
          const cveId = v.CVE || `MSRC-${update.ID}-${count}`;
          const title = v.Title?.Value || v.Title || cveId;
          const desc = v.Notes?.Note?.find(n => n.$.Type === '1')?._ || '';
          upsertCve(db, {
            cve_id: cveId,
            source: 'Microsoft MSRC',
            title: (typeof title === 'string' ? title : '').slice(0, 200),
            description: (typeof desc === 'string' ? desc : '').slice(0, 500),
            cvss_score: null,
            kev_listed: 0,
            affected_assets: matchAssets(title + ' ' + desc + ' Microsoft Windows Exchange'),
            vendor: 'Microsoft',
            product: (typeof title === 'string' ? title : '').slice(0, 100),
            published: update.CurrentReleaseDate?.slice(0, 10) || null,
          });
          count++;
        });
      } catch (e) {
        console.error(`MSRC update ${update.ID} failed:`, e.message);
      }
    }
    db.prepare('UPDATE feed_sources SET last_fetched = datetime(\'now\'), last_status = ?, item_count = ?, last_error = NULL WHERE name = ?').run('ok', count, 'Microsoft MSRC');
    console.log(`Microsoft MSRC: ${count} entries`);
  } catch (err) {
    db.prepare('UPDATE feed_sources SET last_status = ?, last_error = ? WHERE name = ?').run('error', err.message, 'Microsoft MSRC');
    console.error('Microsoft MSRC fetch failed:', err.message);
  }
}

async function runAllFeeds() {
  console.log('Starting feed refresh...');
  const db = getDb();

  await Promise.allSettled([
    fetchCisaKev(db),
    fetchNvd(db),
    fetchRssFeed(db, 'SANS ISC @RISK'),
    fetchRssFeed(db, 'Fortinet PSIRT RSS'),
    fetchRssFeed(db, 'Cisco PSIRT RSS'),
    fetchRssFeed(db, 'Oracle Security Alerts'),
    fetchRssFeed(db, 'HPE Security Bulletins'),
    fetchMsrc(db),
  ]);

  console.log('Feed refresh complete.');
}

module.exports = { runAllFeeds };

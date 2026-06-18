const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'sentinel.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      version TEXT,
      eol_status TEXT DEFAULT 'unknown',
      vendor TEXT,
      psirt_url TEXT,
      frameworks TEXT DEFAULT '[]',
      notes TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS feed_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      url TEXT NOT NULL,
      feed_type TEXT NOT NULL,
      last_fetched TEXT,
      last_status TEXT DEFAULT 'pending',
      last_error TEXT,
      item_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cve_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cve_id TEXT,
      source TEXT,
      title TEXT,
      description TEXT,
      cvss_score REAL,
      cvss_vector TEXT,
      kev_listed INTEGER DEFAULT 0,
      exploit_status TEXT,
      affected_assets TEXT DEFAULT '[]',
      vendor TEXT,
      product TEXT,
      published TEXT,
      fetched_at TEXT DEFAULT (datetime('now')),
      raw_json TEXT,
      UNIQUE(cve_id, source)
    );

    CREATE TABLE IF NOT EXISTS briefs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brief_date TEXT NOT NULL UNIQUE,
      headline TEXT,
      content_json TEXT,
      posture_change TEXT DEFAULT 'unchanged',
      generated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brief_id INTEGER REFERENCES briefs(id),
      title TEXT NOT NULL,
      description TEXT,
      effort TEXT,
      controls TEXT,
      priority INTEGER DEFAULT 2,
      status TEXT DEFAULT 'open',
      due_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS findings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      asset TEXT,
      condition_text TEXT,
      criteria TEXT,
      cause TEXT,
      effect TEXT,
      recommendation TEXT,
      risk_rating TEXT DEFAULT 'Medium',
      status TEXT DEFAULT 'draft',
      frameworks TEXT DEFAULT '[]',
      brief_id INTEGER REFERENCES briefs(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  const adminPw = process.env.ADMIN_PASSWORD || 'sentinel2026';
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!existing) {
    const hash = bcrypt.hashSync(adminPw, 10);
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('admin', hash);
  }

  const assetCount = db.prepare('SELECT COUNT(*) as c FROM assets').get().c;
  if (assetCount === 0) {
    const assets = [
      { name: 'Oracle Database', category: 'Database', vendor: 'Oracle', psirt_url: 'https://www.oracle.com/security-alerts/', frameworks: '["ISO A.8.8","CIS 7.3","PCI 6.3.1"]', eol_status: 'active', version: '' },
      { name: 'Oracle WebLogic Server', category: 'Application Server', vendor: 'Oracle', psirt_url: 'https://www.oracle.com/security-alerts/', frameworks: '["ISO A.8.8","CIS 7.3","PCI 6.3.1"]', eol_status: 'active', version: '' },
      { name: 'Oracle REST Data Services (ORDS)', category: 'Middleware', vendor: 'Oracle', psirt_url: 'https://www.oracle.com/security-alerts/', frameworks: '["ISO A.8.8","CIS 7.3"]', eol_status: 'active', version: '' },
      { name: 'Windows Server / Active Directory', category: 'OS / Identity', vendor: 'Microsoft', psirt_url: 'https://msrc.microsoft.com/', frameworks: '["ISO A.8.8","CIS 7.3","PCI 6.3.1","SWIFT CSP 1.1"]', eol_status: 'active', version: '' },
      { name: 'Microsoft Exchange', category: 'Email', vendor: 'Microsoft', psirt_url: 'https://msrc.microsoft.com/', frameworks: '["ISO A.8.8","CIS 7.3","PCI 6.3.1"]', eol_status: 'active', version: '' },
      { name: 'Microsoft 365', category: 'Cloud Services', vendor: 'Microsoft', psirt_url: 'https://msrc.microsoft.com/', frameworks: '["ISO A.8.8","CIS 7.3"]', eol_status: 'active', version: '' },
      { name: 'Fortinet FortiWeb WAF', category: 'Security / WAF', vendor: 'Fortinet', psirt_url: 'https://www.fortiguard.com/psirt', frameworks: '["ISO A.8.8","PCI 6.4.1","CIS 7.3","SWIFT CSP 1.1"]', eol_status: 'active', version: '' },
      { name: 'Cisco WS-C2960S (IOS)', category: 'Network / Switch', vendor: 'Cisco', psirt_url: 'https://tools.cisco.com/security/center/publicationListing.x', frameworks: '["ISO A.8.8","CIS 12.1"]', eol_status: 'EOL - CRITICAL', version: 'IOS 15.x', notes: 'End-of-Life. No further patches. Critical compensating controls required.' },
      { name: 'Cisco WS-C3650 (IOS XE)', category: 'Network / Switch', vendor: 'Cisco', psirt_url: 'https://tools.cisco.com/security/center/publicationListing.x', frameworks: '["ISO A.8.8","CIS 12.1"]', eol_status: 'nearing-EOSL', version: 'IOS XE 16.x' },
      { name: 'HPE StoreOnce', category: 'Backup / Storage', vendor: 'HPE', psirt_url: 'https://support.hpe.com/hpesc/public/home/productSearch', frameworks: '["ISO A.8.13","CIS 11.4","PCI 12.3"]', eol_status: 'active', version: '' },
      { name: 'Tridium Niagara BMS', category: 'OT / BMS', vendor: 'Tridium', psirt_url: 'https://www.cisa.gov/ics-advisories', frameworks: '["ISO A.8.8","CIS 12.1"]', eol_status: 'active', version: '', notes: 'OT system. Minimize network exposure. ICS-CERT advisories apply.' },
      { name: 'SWIFT Alliance', category: 'Financial Messaging', vendor: 'SWIFT', psirt_url: 'https://www.swift.com/swift-resource/69506/download', frameworks: '["SWIFT CSP 2.7","SWIFT CSP 1.1","PCI DSS"]', eol_status: 'active', version: '' },
      { name: 'ATM / Payment Card Systems', category: 'Payment', vendor: 'Various', psirt_url: '', frameworks: '["PCI DSS","SWIFT CSP"]', eol_status: 'active', version: '' },
    ];

    const insert = db.prepare(`
      INSERT INTO assets (name, category, vendor, psirt_url, frameworks, eol_status, version, notes)
      VALUES (@name, @category, @vendor, @psirt_url, @frameworks, @eol_status, @version, @notes)
    `);
    assets.forEach(a => insert.run({ notes: null, ...a }));
  }

  const feedCount = db.prepare('SELECT COUNT(*) as c FROM feed_sources').get().c;
  if (feedCount === 0) {
    const feeds = [
      { name: 'CISA KEV', url: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', feed_type: 'json' },
      { name: 'NVD CVE API', url: 'https://services.nvd.nist.gov/rest/json/cves/2.0', feed_type: 'nvd_api' },
      { name: 'SANS ISC @RISK', url: 'https://isc.sans.edu/rssfeed_full.xml', feed_type: 'rss' },
      { name: 'Fortinet PSIRT RSS', url: 'https://www.fortiguard.com/rss/ir.xml', feed_type: 'rss' },
      { name: 'Microsoft MSRC', url: 'https://api.msrc.microsoft.com/cvrf/v2.0/updates', feed_type: 'msrc' },
      { name: 'Cisco PSIRT RSS', url: 'https://tools.cisco.com/security/center/psirtrss20.xml', feed_type: 'rss' },
      { name: 'Oracle Security Alerts', url: 'https://www.oracle.com/security-alerts/rss/', feed_type: 'rss' },
      { name: 'HPE Security Bulletins', url: 'https://h20566.www2.hpe.com/hpsc/svt/public/rss?comp_selector=0&doc_type=0&sort=creation_time+desc&lang_code=en&cc=us&col_id=hpsc.support.sec_bulletins', feed_type: 'rss' },
    ];
    const insert = db.prepare('INSERT INTO feed_sources (name, url, feed_type) VALUES (@name, @url, @feed_type)');
    feeds.forEach(f => insert.run(f));
  }
}

module.exports = { getDb };

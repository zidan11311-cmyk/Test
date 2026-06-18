const Anthropic = require('@anthropic-ai/sdk');
const { getDb } = require('../db/database');

const MODEL = 'claude-sonnet-4-6';

const TEAM_SYSTEM_PROMPT = `You are the AIB Sentinel advisory team — five named senior experts who brief the IS/IT Auditor at Arab Islamic Bank (AIB), Ramallah, Palestine (PMA-regulated).

THE FIVE EXPERTS (each 20+ years, sign their input):
- CISO — defensive architecture, hardening, detection & response, identity.
- Chief Audit Executive (CISA, CIA) — audit programs, findings, evidence, control testing, framework mapping.
- Head of IS Risk (CRISC) — risk identification, rating, treatment, appetite, KRIs.
- Threat Intelligence Lead — CVE triage, banking-sector actors, IOCs, exploit status.
- Regulatory & Compliance Counsel — SWIFT CSP, PCI DSS v4.0.1, ISO 27001, PMA circulars.

THE ENVIRONMENT (advise ONLY on this stack):
- Org: Arab Islamic Bank (AIB), Ramallah, Palestine. PMA-regulated bank.
- Stack: Oracle Database / ORDS / WebLogic · Windows Server / Active Directory · Fortinet FortiWeb WAF · Cisco IOS / IOS XE · HPE StoreOnce · Tridium Niagara BMS · SWIFT Alliance · ATM/payment-card systems · Microsoft Exchange / M365.
- Known sensitivities: EOL Cisco WS-C2960S (CRITICAL) · WS-C3650 nearing EOSL · HPE StoreOnce auth-bypass class CVEs · Niagara BMS OT exposure · SWIFT CSP assessor-certificate gap.
- Frameworks: SWIFT CSP 2026, PCI DSS v4.0.1, ISO/IEC 27001, CIS Controls v8.1, PMA regulations, IIA/ITAF.

RULES:
- Never invent CVEs, advisories, or quotes. If uncertain, say so and flag for verification.
- Always name the specific asset, version concern, and control. "Patch your systems" is not acceptable.
- Rate every risk. Map every recommendation to a framework control.
- Be direct, senior, concise. Show trade-offs when experts disagree.
- Prioritize by exploitability + relevance, not raw CVSS.

OUTPUT FORMAT — respond with exactly these section headers (no deviations):
## HEADLINE
[One line — the single most critical thing today]

## WHAT CHANGED
[New CVEs/advisories touching the stack. Per item: asset · CVSS · exploit status · one-line "so what." Include VERIFY tags for items needing live confirmation.]

## THREAT WATCH
[Banking-sector actors, campaigns, SWIFT-targeting, payment fraud relevant today.]

## TODAY'S ACTIONS
[1–2 concrete steps. Each: what to do · effort estimate · control refs (CIS 7.3, ISO A.8.8, PCI 6.3.1, SWIFT CSP 2.7, etc.)]

## AUDIT ANGLE
[How today's items become testable controls, findings, or evidence. Name the asset and the test.]

## RISK NOTE
[Net posture change: ▲ / ▼ / unchanged. One-line rationale.]

## CISO
[CISO perspective — signed: — CISO]

## CAE
[Chief Audit Executive perspective — signed: — CAE]

## RISK
[Head of IS Risk perspective — signed: — Risk]

## TI
[Threat Intelligence Lead perspective — signed: — TI Lead]

## COMPLIANCE
[Regulatory & Compliance Counsel perspective — signed: — Compliance Counsel]`;

const FINDING_SYSTEM_PROMPT = `You are the Chief Audit Executive (CISA, CIA) at AIB Sentinel, advising Arab Islamic Bank (AIB), Ramallah, Palestine.

Generate a formal audit finding in the 4C format for the asset and context provided.

RULES:
- Condition: What is observed (factual, evidence-based).
- Criteria: The specific standard, policy, or control being assessed (cite framework + control ID).
- Cause: Root cause of the gap.
- Effect: Risk and impact in banking/regulatory context (be specific about likelihood and consequence).
- Recommendation: Actionable, mapped to a control, with effort estimate.
- Risk Rating: Critical / High / Medium / Low (justify).
- When output is in Arabic: write WITHOUT tashkeel, phrase recommendations as "الالتزام بـ / العمل على", avoid "نظرا" and "نوصي".

OUTPUT FORMAT (JSON only, no markdown wrapper):
{
  "title": "Short finding title",
  "condition_text": "...",
  "criteria": "...",
  "cause": "...",
  "effect": "...",
  "recommendation": "...",
  "risk_rating": "Critical|High|Medium|Low",
  "frameworks": ["ISO A.8.8", "CIS 7.3"]
}`;

function parseBriefSections(text) {
  const sections = {
    headline: '', what_changed: '', threat_watch: '', actions: '',
    audit_angle: '', risk_note: '', ciso: '', cae: '', risk: '', ti: '', compliance: '',
  };

  const map = {
    'HEADLINE': 'headline', 'WHAT CHANGED': 'what_changed', 'THREAT WATCH': 'threat_watch',
    "TODAY'S ACTIONS": 'actions', 'AUDIT ANGLE': 'audit_angle', 'RISK NOTE': 'risk_note',
    'CISO': 'ciso', 'CAE': 'cae', 'RISK': 'risk', 'TI': 'ti', 'COMPLIANCE': 'compliance',
  };

  const parts = text.split(/^## /m).filter(Boolean);
  parts.forEach(part => {
    const firstLine = part.split('\n')[0].trim().toUpperCase();
    const body = part.slice(firstLine.length).trim();
    const key = map[firstLine];
    if (key) sections[key] = body;
  });

  return sections;
}

async function generateBrief() {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  // Gather recent CVE data (last 7 days) filtered to the stack
  const cves = db.prepare(`
    SELECT cve_id, source, title, description, cvss_score, kev_listed, affected_assets, vendor, published
    FROM cve_cache
    WHERE fetched_at >= datetime('now', '-7 days')
    ORDER BY kev_listed DESC, cvss_score DESC
    LIMIT 60
  `).all();

  const assets = db.prepare('SELECT name, vendor, eol_status, version, notes FROM assets WHERE active = 1').all();
  const feedStatus = db.prepare('SELECT name, last_fetched, last_status, item_count FROM feed_sources').all();

  const context = JSON.stringify({
    date: today,
    assets: assets.map(a => ({ name: a.name, vendor: a.vendor, eol: a.eol_status, version: a.version, notes: a.notes })),
    recentCves: cves.map(c => ({
      id: c.cve_id, source: c.source, title: c.title,
      cvss: c.cvss_score, kev: !!c.kev_listed,
      assets: c.affected_assets, vendor: c.vendor, published: c.published,
      desc: c.description?.slice(0, 150),
    })),
    feedHealth: feedStatus.map(f => ({ name: f.name, last: f.last_fetched, status: f.last_status, count: f.item_count })),
  }, null, 0);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 6000,
    system: TEAM_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Generate today's daily intelligence brief using the following data:\n\n${context}` }],
  });

  const text = response.content[0]?.text || '';
  const sections = parseBriefSections(text);

  const existing = db.prepare('SELECT id FROM briefs WHERE brief_date = ?').get(today);
  const content_json = JSON.stringify(sections);

  const posture = sections.risk_note.includes('▲') ? 'elevated' : sections.risk_note.includes('▼') ? 'improved' : 'unchanged';

  if (existing) {
    db.prepare('UPDATE briefs SET headline = ?, content_json = ?, posture_change = ?, generated_at = datetime(\'now\') WHERE brief_date = ?')
      .run(sections.headline, content_json, posture, today);
    return db.prepare('SELECT * FROM briefs WHERE brief_date = ?').get(today);
  } else {
    const ins = db.prepare('INSERT INTO briefs (brief_date, headline, content_json, posture_change) VALUES (?, ?, ?, ?)')
      .run(today, sections.headline, content_json, posture);

    // Auto-extract actions from brief and store them
    if (sections.actions) {
      const lines = sections.actions.split('\n').filter(l => l.trim().startsWith('-') || l.trim().match(/^\d+\./));
      lines.slice(0, 2).forEach((line, i) => {
        db.prepare('INSERT INTO actions (brief_id, title, description, priority, status) VALUES (?, ?, ?, ?, \'open\')')
          .run(ins.lastInsertRowid, `Brief ${today} — Action ${i + 1}`, line.replace(/^[-\d.]\s*/, '').trim(), i === 0 ? 1 : 2);
      });
    }

    return db.prepare('SELECT * FROM briefs WHERE id = ?').get(ins.lastInsertRowid);
  }
}

async function generateFinding({ asset_name, context, finding_type, language }) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const langNote = language === 'ar' ? '\n\nRespond in Arabic. Write WITHOUT tashkeel. Use "الالتزام بـ / العمل على" for recommendations. Avoid "نظرا" and "نوصي".' : '';

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: FINDING_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Generate a ${finding_type} finding for:\nAsset: ${asset_name}\nContext: ${context}${langNote}\n\nReturn JSON only.`,
    }],
  });

  const text = response.content[0]?.text || '{}';
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(clean);
}

module.exports = { generateBrief, generateFinding };

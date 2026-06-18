import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Search, Download, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const RISK_COLOR = { Critical: 'bg-red-100 text-red-800', High: 'bg-orange-100 text-orange-700', Medium: 'bg-yellow-100 text-yellow-700', Low: 'bg-green-100 text-green-700' };

function FindingCard({ f, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-900">{f.title}</span>
            <span className={`pill-tag ${RISK_COLOR[f.risk_rating] || 'bg-gray-100 text-gray-600'}`}>{f.risk_rating}</span>
            <span className="text-xs text-gray-400">Asset: {f.asset}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={e => { e.stopPropagation(); window.open(`/api/findings/${f.id}/pdf`, '_blank'); }}
            className="flex items-center gap-1 text-xs border border-gray-200 px-2 py-1 rounded hover:bg-gray-100 transition-colors text-gray-500">
            <Download size={11} /> PDF
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(f.id); }}
            className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
          {[['Condition', f.condition_text], ['Criteria', f.criteria], ['Cause', f.cause], ['Effect / Consequence', f.effect], ['Recommendation', f.recommendation]].map(([l, t]) => t ? (
            <div key={l}>
              <div className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-1">{l}</div>
              <div className="text-sm text-gray-700 section-block">{t}</div>
            </div>
          ) : null)}
        </div>
      )}
    </div>
  );
}

export default function Findings() {
  const [findings, setFindings] = useState([]);
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState({ asset_name: '', context: '', finding_type: 'vulnerability', language: 'en' });
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => Promise.all([
    api.get('/findings').then(r => setFindings(r.data.data || [])),
    api.get('/assets').then(r => setAssets(r.data.data || [])),
  ]).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const generate = async e => {
    e.preventDefault();
    if (!form.asset_name || !form.context) return;
    setGenerating(true);
    try {
      await api.post('/findings/generate', form);
      await load();
      setForm(p => ({ ...p, context: '' }));
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const del = async id => {
    if (!confirm('Delete this finding?')) return;
    await api.delete(`/findings/${id}`);
    load();
  };

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">4C Finding Generator</h1>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-sm text-gray-700 mb-4">Generate Audit Finding</h2>
        <form onSubmit={generate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Asset *</label>
              <select value={form.asset_name} onChange={set('asset_name')} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-none">
                <option value="">Select asset...</option>
                {assets.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                <option value="Other">Other (type below)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Finding Type</label>
              <select value={form.finding_type} onChange={set('finding_type')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-none">
                {['vulnerability', 'configuration', 'compliance', 'process', 'access control'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Output Language</label>
              <select value={form.language} onChange={set('language')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-none">
                <option value="en">English</option>
                <option value="ar">Arabic (عربي)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Context / Observation *</label>
            <textarea value={form.context} onChange={set('context')} required rows={4}
              placeholder="Describe what was observed during the audit. Include specific details: what asset, what was found, what control is missing or failed, any evidence collected. The more specific, the better the finding."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-none resize-none" />
          </div>

          <button type="submit" disabled={generating || !form.asset_name || !form.context}
            className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-60">
            <Search size={14} />
            {generating ? 'Generating finding...' : 'Generate 4C Finding'}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-brand-600" /></div>
      ) : findings.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">No findings generated yet.</div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-600">Findings History ({findings.length})</h2>
          {findings.map(f => <FindingCard key={f.id} f={f} onDelete={del} />)}
        </div>
      )}
    </div>
  );
}

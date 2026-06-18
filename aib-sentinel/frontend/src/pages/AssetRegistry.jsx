import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, Pencil, Trash2, ExternalLink, Save, X } from 'lucide-react';

const EOL_BADGE = {
  'active': 'bg-green-100 text-green-700',
  'EOL - CRITICAL': 'bg-red-100 text-red-800 font-bold',
  'nearing-EOSL': 'bg-orange-100 text-orange-700',
  'extended': 'bg-yellow-100 text-yellow-700',
  'unknown': 'bg-gray-100 text-gray-600',
};

function AssetForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    name: '', category: '', vendor: '', version: '', eol_status: 'active', psirt_url: '', frameworks: '', notes: '',
  });
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-xl border border-brand-600 p-5 space-y-4 shadow-md">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[['name', 'Asset Name *'], ['vendor', 'Vendor'], ['category', 'Category'], ['version', 'Version']].map(([k, l]) => (
          <div key={k}>
            <label className="block text-xs font-medium text-gray-500 mb-1">{l}</label>
            <input value={form[k] || ''} onChange={set(k)} required={k === 'name'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-none" />
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">EOL Status</label>
          <select value={form.eol_status} onChange={set('eol_status')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-none">
            {['active', 'extended', 'nearing-EOSL', 'EOL - CRITICAL', 'unknown'].map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">PSIRT / Advisory URL</label>
          <input value={form.psirt_url || ''} onChange={set('psirt_url')} type="url"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Frameworks (comma-sep)</label>
          <input value={form.frameworks || ''} onChange={set('frameworks')} placeholder="ISO A.8.8, CIS 7.3, PCI 6.3.1"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-none" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
          <textarea value={form.notes || ''} onChange={set('notes')} rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-none resize-none" />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
          <Save size={13} /> Save
        </button>
        <button type="button" onClick={onCancel} className="flex items-center gap-1.5 border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
          <X size={13} /> Cancel
        </button>
      </div>
    </form>
  );
}

export default function AssetRegistry() {
  const [assets, setAssets] = useState([]);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/assets').then(r => setAssets(r.data.data || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const save = async form => {
    const frameworks = typeof form.frameworks === 'string'
      ? JSON.stringify(form.frameworks.split(',').map(s => s.trim()).filter(Boolean))
      : form.frameworks;
    const payload = { ...form, frameworks };
    if (editId) {
      await api.patch(`/assets/${editId}`, payload);
    } else {
      await api.post('/assets', payload);
    }
    setAdding(false);
    setEditId(null);
    load();
  };

  const del = async id => {
    if (!confirm('Remove this asset from scope?')) return;
    await api.delete(`/assets/${id}`);
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Asset Registry</h1>
        <button onClick={() => { setAdding(true); setEditId(null); }}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
          <Plus size={14} /> Add Asset
        </button>
      </div>

      {adding && !editId && <AssetForm onSave={save} onCancel={() => setAdding(false)} />}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Asset', 'Vendor', 'Version', 'Category', 'EOL Status', 'Frameworks', 'PSIRT', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {assets.map(a => {
                if (editId === a.id) {
                  return (
                    <tr key={a.id}>
                      <td colSpan={8} className="px-4 py-3">
                        <AssetForm
                          initial={{ ...a, frameworks: (() => { try { return JSON.parse(a.frameworks || '[]').join(', '); } catch { return a.frameworks || ''; } })() }}
                          onSave={save}
                          onCancel={() => setEditId(null)}
                        />
                      </td>
                    </tr>
                  );
                }
                let fws = [];
                try { fws = JSON.parse(a.frameworks || '[]'); } catch {}
                return (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                    <td className="px-4 py-3 text-gray-600">{a.vendor}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{a.version || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{a.category}</td>
                    <td className="px-4 py-3">
                      <span className={`pill-tag ${EOL_BADGE[a.eol_status] || 'bg-gray-100 text-gray-600'}`}>
                        {a.eol_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {fws.slice(0, 3).map(f => <span key={f} className="pill-tag bg-blue-50 text-blue-700">{f}</span>)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {a.psirt_url ? (
                        <a href={a.psirt_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline flex items-center gap-1">
                          <ExternalLink size={12} /> PSIRT
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditId(a.id); setAdding(false); }} className="text-gray-400 hover:text-brand-600 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => del(a.id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Download, RefreshCw, ExternalLink } from 'lucide-react';

const CVSS_COLOR = score =>
  score >= 9.0 ? 'bg-red-100 text-red-800 font-bold' :
  score >= 7.0 ? 'bg-orange-100 text-orange-700' :
  score >= 4.0 ? 'bg-yellow-100 text-yellow-700' :
  'bg-green-100 text-green-700';

export default function CVEWatchlist() {
  const [cves, setCves] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ minCvss: '7', kev: '', asset: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.minCvss) params.set('minCvss', filters.minCvss);
    if (filters.kev) params.set('kev', filters.kev);
    if (filters.asset) params.set('asset', filters.asset);
    params.set('limit', '100');
    const { data } = await api.get(`/watchlist?${params}`);
    setCves(data.data || []);
    setTotal(data.meta?.total || 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filters]);

  const refreshFeeds = async () => {
    setRefreshing(true);
    try { await api.post('/feeds/run'); await new Promise(r => setTimeout(r, 2000)); await load(); }
    finally { setRefreshing(false); }
  };

  const exportExcel = () => window.open('/api/watchlist/export/excel', '_blank');

  const setF = k => e => setFilters(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">CVE Watchlist</h1>
          <p className="text-xs text-gray-500 mt-0.5">Filtered to AIB asset stack · {total} total entries</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refreshFeeds} disabled={refreshing}
            className="flex items-center gap-1.5 border border-gray-300 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-60">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Feeds'}
          </button>
          <button onClick={exportExcel}
            className="flex items-center gap-1.5 bg-brand-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-brand-700 transition-colors">
            <Download size={13} /> Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Min CVSS</label>
          <select value={filters.minCvss} onChange={setF('minCvss')}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-none">
            <option value="">All</option>
            <option value="9">Critical (≥9.0)</option>
            <option value="7">High+ (≥7.0)</option>
            <option value="4">Medium+ (≥4.0)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">CISA KEV</label>
          <select value={filters.kev} onChange={setF('kev')}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-none">
            <option value="">All</option>
            <option value="true">KEV Only</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Asset keyword</label>
          <input value={filters.asset} onChange={setF('asset')} placeholder="e.g. Oracle, Cisco"
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-brand-600" /></div>
      ) : cves.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No CVEs in watchlist yet.</p>
          <p className="text-xs mt-1">Click "Refresh Feeds" to pull live data.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['CVE / ID', 'CVSS', 'Source', 'Title', 'Affected Assets', 'Published', 'KEV', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cves.map(c => {
                  let assets = [];
                  try { assets = JSON.parse(c.affected_assets || '[]'); } catch {}
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <a
                          href={`https://nvd.nist.gov/vuln/detail/${c.cve_id}`}
                          target="_blank" rel="noopener noreferrer"
                          className="font-mono text-xs text-brand-600 hover:underline flex items-center gap-1"
                        >
                          {c.cve_id} <ExternalLink size={10} />
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        {c.cvss_score != null ? (
                          <span className={`pill-tag ${CVSS_COLOR(c.cvss_score)}`}>{c.cvss_score.toFixed(1)}</span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{c.source}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs">
                        <div className="truncate">{c.title || c.description?.slice(0, 60)}</div>
                        {c.description && <div className="text-xs text-gray-400 truncate mt-0.5">{c.description.slice(0, 80)}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {assets.slice(0, 2).map(a => <span key={a} className="pill-tag bg-blue-50 text-blue-700 text-xs">{a}</span>)}
                          {assets.length > 2 && <span className="text-xs text-gray-400">+{assets.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{c.published || '—'}</td>
                      <td className="px-4 py-3">
                        {c.kev_listed ? <span className="pill-tag bg-red-100 text-red-700 font-bold">KEV</span> : null}
                      </td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

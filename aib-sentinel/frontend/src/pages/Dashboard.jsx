import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { AlertTriangle, CheckSquare, Server, Activity, RefreshCw, TrendingUp, TrendingDown, Minus, FileText } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color = 'blue', onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:border-brand-600 transition-colors text-left w-full"
    >
      <div className={`rounded-lg p-2.5 bg-${color}-50`}>
        <Icon size={20} className={`text-${color}-600`} />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </button>
  );
}

function PostureChip({ change }) {
  if (change === 'elevated') return <span className="inline-flex items-center gap-1 text-red-600 font-semibold text-sm"><TrendingUp size={14} /> Elevated</span>;
  if (change === 'improved') return <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-sm"><TrendingDown size={14} /> Improved</span>;
  return <span className="inline-flex items-center gap-1 text-gray-500 text-sm"><Minus size={14} /> Unchanged</span>;
}

export default function Dashboard({ onNavigate }) {
  const [brief, setBrief] = useState(null);
  const [actions, setActions] = useState([]);
  const [cves, setCves] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [bRes, aRes, cRes, fRes] = await Promise.all([
        api.get('/briefs/today'),
        api.get('/actions?status=open'),
        api.get('/watchlist?minCvss=7&limit=5'),
        api.get('/feeds/status'),
      ]);
      setBrief(bRes.data.data);
      setActions(aRes.data.data || []);
      setCves(cRes.data.data || []);
      setFeeds(fRes.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const generateBrief = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/briefs/generate');
      setBrief(data.data);
    } catch (err) {
      alert('Brief generation failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const feedsOk = feeds.filter(f => f.last_status === 'ok').length;
  const feedsError = feeds.filter(f => f.last_status === 'error').length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Security Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <button
          onClick={generateBrief}
          disabled={generating}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-60"
        >
          <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Generating...' : 'Generate Brief'}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckSquare} label="Open Actions" value={actions.length} color="blue" onClick={() => onNavigate('actions')} />
        <StatCard icon={AlertTriangle} label="High CVEs (≥7.0)" value={cves.length} color="red" onClick={() => onNavigate('watchlist')} />
        <StatCard icon={Activity} label={`Feeds OK / ${feeds.length}`} value={feedsOk} color="green" onClick={() => onNavigate('feeds')} />
        {feedsError > 0 && <StatCard icon={Activity} label="Feed Errors" value={feedsError} color="red" onClick={() => onNavigate('feeds')} />}
      </div>

      {/* Headline brief */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-brand-600" />
            <h2 className="font-semibold text-gray-800">Today's Brief</h2>
          </div>
          {brief && <PostureChip change={brief.posture_change} />}
        </div>

        {brief ? (
          <div className="space-y-3">
            <div className="bg-brand-50 border-l-4 border-brand-600 px-4 py-3 rounded-r-lg">
              <div className="text-xs text-brand-600 font-semibold uppercase tracking-wide mb-1">Headline</div>
              <p className="text-sm text-gray-800 font-medium">{brief.headline}</p>
            </div>
            <button
              onClick={() => onNavigate('brief')}
              className="text-sm text-brand-600 hover:underline font-medium"
            >
              View full brief →
            </button>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <FileText size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No brief generated yet today.</p>
            <button onClick={generateBrief} disabled={generating} className="mt-3 text-sm text-brand-600 font-medium hover:underline">
              Generate now →
            </button>
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Open actions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2"><CheckSquare size={15} /> Open Actions</h2>
            <button onClick={() => onNavigate('actions')} className="text-xs text-brand-600 hover:underline">View all</button>
          </div>
          {actions.length === 0 ? (
            <p className="text-sm text-gray-400">No open actions.</p>
          ) : (
            <ul className="space-y-2">
              {actions.slice(0, 4).map(a => (
                <li key={a.id} className="flex items-start gap-2 text-sm">
                  <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${a.priority <= 1 ? 'bg-red-500' : a.priority === 2 ? 'bg-yellow-500' : 'bg-blue-400'}`} />
                  <span className="text-gray-700">{a.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top CVEs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2"><AlertTriangle size={15} /> Top CVEs (≥7.0)</h2>
            <button onClick={() => onNavigate('watchlist')} className="text-xs text-brand-600 hover:underline">View all</button>
          </div>
          {cves.length === 0 ? (
            <p className="text-sm text-gray-400">No high CVEs in watchlist. Refresh feeds first.</p>
          ) : (
            <ul className="space-y-2">
              {cves.slice(0, 5).map(c => (
                <li key={c.id} className="flex items-center gap-3 text-sm">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${c.cvss_score >= 9 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {c.cvss_score?.toFixed(1) || '?'}
                  </span>
                  <span className="truncate text-gray-700">{c.cve_id || c.title}</span>
                  {c.kev_listed ? <span className="ml-auto text-xs font-bold text-red-600">KEV</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

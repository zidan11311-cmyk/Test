import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { RefreshCw, Download, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const SECTIONS = [
  { key: 'what_changed', label: 'What Changed (Last 24h)', color: 'red' },
  { key: 'threat_watch', label: 'Banking-Sector Threat Watch', color: 'orange' },
  { key: 'actions', label: "Today's Actions", color: 'blue' },
  { key: 'audit_angle', label: 'Audit Angle', color: 'purple' },
  { key: 'risk_note', label: 'Risk Note', color: 'gray' },
  { key: 'ciso', label: 'CISO Perspective', color: 'blue' },
  { key: 'cae', label: 'Chief Audit Executive', color: 'green' },
  { key: 'risk', label: 'Head of IS Risk', color: 'yellow' },
  { key: 'ti', label: 'Threat Intelligence Lead', color: 'red' },
  { key: 'compliance', label: 'Regulatory & Compliance Counsel', color: 'purple' },
];

function Section({ label, text, color }) {
  const [open, setOpen] = useState(true);
  if (!text) return null;
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-semibold text-sm text-gray-700">{label}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="px-4 py-3 section-block">{text}</div>}
    </div>
  );
}

export default function DailyBrief() {
  const [brief, setBrief] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/briefs/today'), api.get('/briefs?limit=30')])
      .then(([todayRes, listRes]) => {
        const today = todayRes.data.data;
        if (today) {
          setBrief(today);
          setSelectedId(today.id);
        }
        setHistory(listRes.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadBrief = async id => {
    setSelectedId(id);
    const { data } = await api.get(`/briefs/${id}`);
    setBrief(data.data);
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/briefs/generate');
      setBrief(data.data);
      const { data: list } = await api.get('/briefs?limit=30');
      setHistory(list.data || []);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const downloadPdf = () => {
    if (!brief) return;
    window.open(`/api/briefs/${brief.id}/pdf`, '_blank');
  };

  const content = brief?.content ? brief.content : (() => {
    try { return JSON.parse(brief?.content_json || '{}'); } catch { return {}; }
  })();

  const trendData = [...history].reverse().map(b => ({
    date: b.brief_date?.slice(5),
    posture: b.posture_change === 'elevated' ? 3 : b.posture_change === 'improved' ? 1 : 2,
  }));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">Daily Intelligence Brief</h1>
        <div className="flex items-center gap-2">
          {brief && (
            <button onClick={downloadPdf} className="flex items-center gap-1.5 text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
              <Download size={13} /> PDF
            </button>
          )}
          <button
            onClick={generate}
            disabled={generating}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-60"
          >
            <RefreshCw size={13} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Generating...' : 'Generate Now'}
          </button>
        </div>
      </div>

      {/* Trend chart */}
      {trendData.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">30-Day Posture Trend</h2>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 4]} tick={false} width={0} />
              <Tooltip formatter={v => ['Elevated', 'Unchanged', 'Improved'][v - 1] || v} />
              <Line type="monotone" dataKey="posture" stroke="#1e3a5f" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History selector */}
      {history.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {history.slice(0, 10).map(b => (
            <button
              key={b.id}
              onClick={() => loadBrief(b.id)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${selectedId === b.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-600'}`}
            >
              {b.brief_date}
            </button>
          ))}
        </div>
      )}

      {brief ? (
        <div className="space-y-4">
          {/* Headline */}
          {content.headline && (
            <div className="bg-brand-600 text-white rounded-xl px-6 py-4">
              <div className="text-xs uppercase tracking-wide text-blue-200 font-semibold mb-1">Headline — {brief.brief_date}</div>
              <p className="text-base font-semibold">{content.headline}</p>
            </div>
          )}

          {/* All sections */}
          <div className="space-y-3">
            {SECTIONS.map(s => (
              <Section key={s.key} label={s.label} text={content[s.key]} color={s.color} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p>No brief generated yet. Click "Generate Now" to produce today's brief.</p>
          <p className="text-xs mt-2 text-gray-300">Requires ANTHROPIC_API_KEY to be set in backend .env</p>
        </div>
      )}
    </div>
  );
}

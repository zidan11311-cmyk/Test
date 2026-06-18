import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { RefreshCw, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';

export default function FeedStatus() {
  const [feeds, setFeeds] = useState([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/feeds/status').then(r => setFeeds(r.data.data || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const runFeeds = async () => {
    setRunning(true);
    try {
      await api.post('/feeds/run');
      await new Promise(r => setTimeout(r, 3000));
      await load();
    } finally {
      setRunning(false);
    }
  };

  const lastOk = feeds.filter(f => f.last_status === 'ok').length;
  const lastErr = feeds.filter(f => f.last_status === 'error').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Feed Status</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {lastOk} OK · {lastErr} errors · {feeds.length} sources total
          </p>
        </div>
        <button
          onClick={runFeeds}
          disabled={running}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-60"
        >
          <RefreshCw size={13} className={running ? 'animate-spin' : ''} />
          {running ? 'Pulling feeds...' : 'Refresh All Feeds'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-brand-600" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {feeds.map(f => {
            const isOk = f.last_status === 'ok';
            const isPending = f.last_status === 'pending' || !f.last_fetched;
            const Icon = isPending ? Clock : isOk ? CheckCircle : XCircle;
            const iconColor = isPending ? 'text-gray-400' : isOk ? 'text-green-500' : 'text-red-500';

            return (
              <div key={f.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start gap-3">
                  <Icon size={18} className={`flex-shrink-0 mt-0.5 ${iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800">{f.name}</div>
                    <a href={f.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-brand-600 flex items-center gap-1 truncate mt-0.5">
                      <ExternalLink size={10} /> {f.url.slice(0, 50)}...
                    </a>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {f.last_fetched ? (
                        <span>Last: {new Date(f.last_fetched).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      ) : (
                        <span className="text-gray-300">Never fetched</span>
                      )}
                      {f.item_count > 0 && <span>{f.item_count} items</span>}
                    </div>
                    {f.last_error && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                        {f.last_error.slice(0, 100)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <strong>Scheduler:</strong> Feeds refresh automatically daily at 06:00 · Brief generated at 06:30 (Asia/Jerusalem timezone).
        Use "Refresh All Feeds" to trigger an immediate pull. Note: NVD API rate-limits without an API key — the NVD fetch takes ~60s to avoid rate limits.
      </div>
    </div>
  );
}

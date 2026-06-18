import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const STATUS_OPTS = ['open', 'in-progress', 'closed'];
const STATUS_ICON = { open: AlertCircle, 'in-progress': Clock, closed: CheckCircle };
const STATUS_COLOR = { open: 'text-red-500', 'in-progress': 'text-yellow-500', closed: 'text-green-500' };
const PRIORITY_LABEL = ['', 'Critical', 'High', 'Medium', 'Low'];
const PRIORITY_COLOR = ['', 'text-red-700 bg-red-50', 'text-orange-700 bg-orange-50', 'text-yellow-700 bg-yellow-50', 'text-blue-700 bg-blue-50'];

export default function Actions() {
  const [actions, setActions] = useState([]);
  const [filter, setFilter] = useState('open');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', effort: '', controls: '', priority: 2, due_date: '' });
  const [loading, setLoading] = useState(true);

  const load = () => api.get(`/actions${filter !== 'all' ? `?status=${filter}` : ''}`).then(r => setActions(r.data.data || [])).finally(() => setLoading(false));
  useEffect(() => { setLoading(true); load(); }, [filter]);

  const create = async e => {
    e.preventDefault();
    await api.post('/actions', form);
    setAdding(false);
    setForm({ title: '', description: '', effort: '', controls: '', priority: 2, due_date: '' });
    load();
  };

  const updateStatus = async (id, status) => {
    await api.patch(`/actions/${id}`, { status });
    load();
  };

  const del = async id => {
    if (!confirm('Delete this action?')) return;
    await api.delete(`/actions/${id}`);
    load();
  };

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">Open Actions Tracker</h1>
        <button onClick={() => setAdding(a => !a)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
          <Plus size={14} /> Add Action
        </button>
      </div>

      {adding && (
        <form onSubmit={create} className="bg-white rounded-xl border border-brand-600 p-5 space-y-4 shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Title *</label>
              <input value={form.title} onChange={set('title')} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Description / Steps</label>
              <textarea value={form.description} onChange={set('description')} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-none resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Effort Estimate</label>
              <input value={form.effort} onChange={set('effort')} placeholder="e.g. 2-4 hours"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Control References</label>
              <input value={form.controls} onChange={set('controls')} placeholder="CIS 7.3, ISO A.8.8, PCI 6.3.1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
              <select value={form.priority} onChange={set('priority')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-none">
                {[1, 2, 3, 4].map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Due Date</label>
              <input type="date" value={form.due_date} onChange={set('due_date')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">Save</button>
            <button type="button" onClick={() => setAdding(false)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      <div className="flex gap-2">
        {['open', 'in-progress', 'closed', 'all'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors capitalize ${filter === s ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-600'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" /></div>
      ) : actions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No actions found.</div>
      ) : (
        <div className="space-y-3">
          {actions.map(a => {
            const Icon = STATUS_ICON[a.status] || Clock;
            return (
              <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <Icon size={16} className={`mt-0.5 flex-shrink-0 ${STATUS_COLOR[a.status] || 'text-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">{a.title}</span>
                      <span className={`pill-tag ${PRIORITY_COLOR[a.priority] || 'bg-gray-100 text-gray-600'}`}>{PRIORITY_LABEL[a.priority]}</span>
                      {a.due_date && <span className="text-xs text-gray-400">Due: {a.due_date}</span>}
                    </div>
                    {a.description && <p className="text-sm text-gray-600 mt-1">{a.description}</p>}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                      {a.effort && <span>Effort: {a.effort}</span>}
                      {a.controls && <span>Controls: {a.controls}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select value={a.status} onChange={e => updateStatus(a.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-brand-600 focus:outline-none">
                      {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => del(a.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

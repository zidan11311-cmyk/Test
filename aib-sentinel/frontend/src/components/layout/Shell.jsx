import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FileText, Server, CheckSquare,
  AlertTriangle, Activity, Search, LogOut, Menu, X, Shield
} from 'lucide-react';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'brief', label: 'Daily Brief', icon: FileText },
  { id: 'actions', label: 'Open Actions', icon: CheckSquare },
  { id: 'watchlist', label: 'CVE Watchlist', icon: AlertTriangle },
  { id: 'assets', label: 'Asset Registry', icon: Server },
  { id: 'findings', label: 'Finding Generator', icon: Search },
  { id: 'feeds', label: 'Feed Status', icon: Activity },
];

export default function Shell({ children, currentPage, onNavigate }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-brand-600 text-white flex flex-col
        transform transition-transform duration-200
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center gap-2 px-6 py-5 border-b border-white/10">
          <Shield size={22} className="text-blue-200" />
          <div>
            <div className="font-bold text-sm">AIB Sentinel</div>
            <div className="text-xs text-blue-200">IS Security Advisory</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'}
                `}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <div className="text-xs text-blue-200 mb-1">Signed in as</div>
          <div className="text-sm font-medium">{user?.username}</div>
          <button
            onClick={logout}
            className="mt-3 flex items-center gap-2 text-xs text-blue-200 hover:text-white transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-wide">AIB Sentinel</span>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-700 capitalize">
              {NAV.find(n => n.id === currentPage)?.label || 'Dashboard'}
            </span>
          </div>
          <div className="ml-auto text-xs text-gray-400">
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

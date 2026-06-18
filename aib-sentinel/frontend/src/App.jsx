import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Shell from './components/layout/Shell';
import Dashboard from './pages/Dashboard';
import DailyBrief from './pages/DailyBrief';
import AssetRegistry from './pages/AssetRegistry';
import Actions from './pages/Actions';
import CVEWatchlist from './pages/CVEWatchlist';
import FeedStatus from './pages/FeedStatus';
import Findings from './pages/Findings';

function Router() {
  const { user, loading } = useAuth();
  const [page, setPage] = React.useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!user) return <Login />;

  const pages = {
    dashboard: <Dashboard onNavigate={setPage} />,
    brief: <DailyBrief />,
    assets: <AssetRegistry />,
    actions: <Actions />,
    watchlist: <CVEWatchlist />,
    feeds: <FeedStatus />,
    findings: <Findings />,
  };

  return (
    <Shell currentPage={page} onNavigate={setPage}>
      {pages[page] || <Dashboard onNavigate={setPage} />}
    </Shell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

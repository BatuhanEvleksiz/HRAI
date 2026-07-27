import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { api } from './api/api';
import { useStore } from './store/useStore';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AnalyzeUpload from './pages/AnalyzeUpload';
import SavedCVs from './pages/SavedCVs';
import MatchingEngine from './pages/MatchingEngine';
import Interviews from './pages/Interviews';
import Reports from './pages/Reports';
import ChatAssistant from './pages/ChatAssistant';
import SettingsPage from './pages/Settings';

export default function App() {
  const setCandidates = useStore(state => state.setCandidates);

  useEffect(() => {
    document.documentElement.classList.toggle('theme-pink', localStorage.getItem('ikai-theme') === 'pink');
    api.getCandidates()
      .then(data => Array.isArray(data) && setCandidates(data))
      .catch(() => {});
  }, [setCandidates]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-auto">
        <div className="max-w-[1400px] mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analyze" element={<AnalyzeUpload />} />
            <Route path="/candidates" element={<SavedCVs />} />
            <Route path="/matching" element={<MatchingEngine />} />
            <Route path="/interviews" element={<Interviews />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/assistant" element={<ChatAssistant />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

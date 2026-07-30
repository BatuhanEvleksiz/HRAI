import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
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
  const setReports = useStore(state => state.setReports);
  const setWeights = useStore(state => state.setWeights);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('ikai-color-mode') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('theme-pink', localStorage.getItem('ikai-theme') === 'pink');
    api.getCandidates()
      .then(data => Array.isArray(data) && setCandidates(data))
      .catch(() => {});
    api.getReports()
      .then(data => Array.isArray(data) && setReports(data))
      .catch(() => {});
    api.getWeights()
      .then(data => data && setWeights(data))
      .catch(() => {});
  }, [setCandidates, setReports, setWeights]);

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', darkMode);
    localStorage.setItem('ikai-color-mode', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <button
        type="button"
        role="switch"
        aria-checked={darkMode}
        aria-label={darkMode ? 'Açık temaya geç' : 'Koyu temaya geç'}
        title={darkMode ? 'Açık tema' : 'Koyu tema'}
        onClick={() => setDarkMode(value => !value)}
        className={`theme-mode-toggle fixed right-5 top-4 z-50 h-9 w-[78px] rounded-full border p-1 shadow-lg transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 ${darkMode ? 'theme-mode-toggle-dark' : 'theme-mode-toggle-light'}`}
      >
        <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-2.5">
          <Sun size={14} strokeWidth={2.2} className={darkMode ? 'text-surface-300/60' : 'text-amber-500'} />
          <Moon size={14} strokeWidth={2.2} className={darkMode ? 'text-white/80' : 'text-surface-400'} />
        </span>
        <span className={`theme-mode-knob relative z-10 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-transform duration-300 ease-out ${darkMode ? 'translate-x-[39px] theme-mode-knob-dark' : 'translate-x-0 theme-mode-knob-light'}`}>
          {darkMode ? <Moon size={15} strokeWidth={2.2} /> : <Sun size={15} strokeWidth={2.2} />}
        </span>
      </button>
      <main className="flex-1 ml-64 p-8 overflow-auto">
        <div className="max-w-[1400px] mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analyze" element={<AnalyzeUpload />} />
            <Route path="/candidates" element={<SavedCVs />} />
            <Route path="/matching" element={<MatchingEngine />} />
            <Route path="/interviews" element={<Interviews />} />
            <Route path="/interviews/assistant" element={<Interviews defaultTab="assistant" />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/assistant" element={<ChatAssistant />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

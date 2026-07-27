import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileSearch, FolderOpen, Target,
  CalendarDays, FileText, MessageCircle, Settings,
  Brain, MessageSquareText
} from 'lucide-react';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/analyze', label: 'Analiz & Kayıt', icon: FileSearch },
  { path: '/candidates', label: 'Kayıtlı CV\'ler', icon: FolderOpen },
  { path: '/matching', label: 'Eşleşme Motoru', icon: Target },
  { path: '/interviews', label: 'Mülakatlar', icon: CalendarDays },
  { path: '/interviews/assistant', label: 'Mülakat Asistanı', icon: MessageSquareText },
  { path: '/reports', label: 'Raporlar', icon: FileText },
  { path: '/assistant', label: 'İK Asistanı', icon: MessageCircle },
  { path: '/settings', label: 'Ayarlar', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 sidebar-gradient text-white z-50 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">IKAI System</h1>
          <p className="text-xs text-white/60">AI Destekli İK</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-white/20 text-white shadow-lg shadow-black/10 backdrop-blur-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-xs font-bold">
            İK
          </div>
          <div>
            <p className="text-sm font-medium">İK Uzmanı</p>
            <p className="text-xs text-white/50">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

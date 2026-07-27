import React from 'react';
import { useStore } from '../store/useStore';
import { Users, CheckCircle2, XCircle, Clock, CalendarDays, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const barColors = [
  'rgb(var(--primary-500))',
  'rgb(var(--accent-600))',
  'rgb(var(--accent-500))',
  'rgb(var(--primary-300))',
  'rgb(var(--accent-400))',
];

function capitalize(str) {
  if (!str) return '';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function Dashboard() {
  const { candidates, interviews } = useStore();

  const totalCVs = candidates.length;
  const approved = candidates.filter(c => c.status === 'approved').length;
  const rejected = candidates.filter(c => c.status === 'rejected').length;
  const pending = candidates.filter(c => c.status === 'pending').length;

  // Profession distribution
  const professionMap = {};
  candidates.forEach(c => {
    const prof = c.profession || 'belirtilmemiş';
    professionMap[prof] = (professionMap[prof] || 0) + 1;
  });
  const professionData = Object.entries(professionMap)
    .map(([name, count]) => ({ name: capitalize(name), count }))
    .sort((a, b) => b.count - a.count);

  // Today's interviews
  const today = new Date().toISOString().split('T')[0];
  const todayInterviews = interviews.filter(i => i.interview_date === today);

  const stats = [
    { label: 'Toplam CV', value: totalCVs, icon: Users, color: 'text-primary-500', bg: 'bg-primary-50', ring: 'ring-primary-100' },
    { label: 'Onaylananlar', value: approved, icon: CheckCircle2, color: 'text-success-500', bg: 'bg-success-50', ring: 'ring-success-100' },
    { label: 'Reddedilenler', value: rejected, icon: XCircle, color: 'text-danger-500', bg: 'bg-danger-50', ring: 'ring-danger-100' },
    { label: 'Onay Bekleyen', value: pending, icon: Clock, color: 'text-warning-500', bg: 'bg-warning-50', ring: 'ring-warning-100' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Genel bakış ve istatistikler</p>
      </div>

      {/* Today's Plan */}
      <div className="antigravity-card-static p-5">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="w-5 h-5 text-primary-500" />
          <h2 className="text-sm font-semibold text-gray-700">Bugünün Planı</h2>
        </div>
        {todayInterviews.length > 0 ? (
          <div className="space-y-2">
            {todayInterviews.map((interview) => (
              <div key={interview.id} className="flex items-center justify-between py-2 px-4 bg-primary-50/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-primary-500 text-white text-xs font-bold rounded-lg">
                    {interview.interview_time}
                  </span>
                  <span className="font-medium text-gray-800">{capitalize(interview.candidate_name)}</span>
                </div>
                <span className="text-sm text-gray-500">{capitalize(interview.position)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Bugün planlanmış mülakat bulunmuyor.</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="antigravity-card p-5 flex items-center justify-between group cursor-default"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-4xl font-extrabold text-gray-900 mt-1">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ring-4 ${stat.ring} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Profession Distribution Chart */}
      <div className="antigravity-card-static p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-primary-500" />
          <h2 className="text-sm font-semibold text-gray-700">Meslek Dağılımı</h2>
        </div>
        <div className="space-y-3">
          {professionData.map((item, idx) => {
            const maxCount = professionData[0]?.count || 1;
            const percentage = (item.count / maxCount) * 100;
            return (
              <div key={item.name} className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-48 truncate">{item.name}</span>
                <div className="flex-1 h-8 bg-surface-100 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full progress-bar-animated transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      background: `linear-gradient(90deg, ${barColors[idx % barColors.length]}, ${barColors[(idx + 1) % barColors.length]})`,
                    }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-700 w-8 text-right">{item.count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

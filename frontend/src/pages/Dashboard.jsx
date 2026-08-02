import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { Users, CheckCircle2, XCircle, Clock, CalendarDays, TrendingUp, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Sector } from 'recharts';

const barColors = [
  'rgb(var(--primary-500))',
  'rgb(var(--accent-600))',
  'rgb(var(--accent-500))',
  'rgb(var(--primary-300))',
  'rgb(var(--accent-400))',
  'rgb(var(--primary-400))',
  'rgb(var(--primary-600))',
];

const statusColors = {
  approved: '#10b981',
  pending: '#f59e0b',
  rejected: '#ef4444',
};

const statusLabels = { approved: 'Onaylı', pending: 'Beklemede', rejected: 'Reddedildi' };

function capitalize(value) {
  if (!value) return '';
  return value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-xl border border-surface-200 bg-white/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
      <p className="font-semibold text-gray-800">{label}</p>
      <p className="mt-1 text-gray-500">{item.count} aday · %{item.percentage}</p>
    </div>
  );
}

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-xl border border-surface-200 bg-white/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
      <p className="font-semibold text-gray-800">{item.name}</p>
      <p className="mt-1 text-gray-500">{item.value} aday · %{item.percentage}</p>
    </div>
  );
}

function DonutSlice({ cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, separated }) {
  const scale = separated ? 1.14 : 1;
  return (
    <g style={{ transformOrigin: `${cx}px ${cy}px`, transition: 'transform 360ms cubic-bezier(0.22, 1, 0.36, 1)', transform: `scale(${scale})` }}>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} stroke="rgba(255,255,255,0.95)" strokeWidth={2} />
    </g>
  );
}

export default function Dashboard() {
  const { candidates, interviews } = useStore();
  const [professionStatus, setProfessionStatus] = useState('all');
  const [donutHovered, setDonutHovered] = useState(false);

  const totalCVs = candidates.length;
  const approved = candidates.filter(candidate => candidate.status === 'approved').length;
  const rejected = candidates.filter(candidate => candidate.status === 'rejected').length;
  const pending = candidates.filter(candidate => candidate.status === 'pending').length;

  const professionData = useMemo(() => {
    const visible = professionStatus === 'all'
      ? candidates
      : candidates.filter(candidate => candidate.status === professionStatus);
    const counts = {};
    visible.forEach(candidate => {
      const profession = candidate.profession || 'Belirtilmemiş';
      counts[profession] = (counts[profession] || 0) + 1;
    });
    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name: capitalize(name), count }))
      .sort((a, b) => b.count - a.count);
    const top = sorted.slice(0, 6);
    const otherCount = sorted.slice(6).reduce((sum, item) => sum + item.count, 0);
    if (otherCount) top.push({ name: 'Diğer', count: otherCount });
    const total = visible.length || 1;
    return top.map(item => ({ ...item, percentage: Math.round((item.count / total) * 100) }));
  }, [candidates, professionStatus]);

  const statusData = useMemo(() => {
    const total = candidates.length || 1;
    return ['approved', 'pending', 'rejected'].map(status => {
      const value = candidates.filter(candidate => candidate.status === status).length;
      return { name: statusLabels[status], status, value, percentage: Math.round((value / total) * 100) };
    });
  }, [candidates]);

  const dateKey = date => {
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return '';
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  };
  const today = dateKey(new Date());
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekStartKey = dateKey(weekStart);
  const weekEndKey = dateKey(weekEnd);
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return { key: dateKey(day), day: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][index], date: day.getDate() };
  });
  const sortInterviews = (a, b) => `${a.interview_date || ''} ${a.interview_time || ''}`.localeCompare(`${b.interview_date || ''} ${b.interview_time || ''}`);
  const weekInterviews = interviews.filter(interview => interview.interview_date >= weekStartKey && interview.interview_date <= weekEndKey).sort(sortInterviews);
  const upcomingInterviews = interviews.filter(interview => interview.interview_date >= today).sort(sortInterviews).slice(0, 5);

  const stats = [
    { label: 'Toplam CV', value: totalCVs, icon: Users, color: 'text-primary-500', bg: 'bg-primary-50', ring: 'ring-primary-100' },
    { label: 'Onaylananlar', value: approved, icon: CheckCircle2, color: 'text-success-500', bg: 'bg-success-50', ring: 'ring-success-100' },
    { label: 'Reddedilenler', value: rejected, icon: XCircle, color: 'text-danger-500', bg: 'bg-danger-50', ring: 'ring-danger-100' },
    { label: 'Onay Bekleyen', value: pending, icon: Clock, color: 'text-warning-500', bg: 'bg-warning-50', ring: 'ring-warning-100' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Genel bakış ve İK operasyon özeti</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={stat.label} className="antigravity-card p-5 flex items-center justify-between group" style={{ animationDelay: `${index * 100}ms` }}>
            <div><p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{stat.label}</p><p className="text-4xl font-extrabold text-gray-900 mt-1">{stat.value}</p></div>
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ring-4 ${stat.ring} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}><stat.icon className={`w-6 h-6 ${stat.color}`} /></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)] gap-6">
        <div className="antigravity-card-static p-6 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary-500" /><div><h2 className="text-sm font-semibold text-gray-700">Meslek Dağılımı</h2><p className="text-xs text-gray-400 mt-0.5">Pozisyonlara göre kayıtlı adaylar</p></div></div>
            <select value={professionStatus} onChange={event => setProfessionStatus(event.target.value)} aria-label="Meslek dağılımı durum filtresi" className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-xs font-medium text-gray-600 outline-none focus:border-primary-400">
              <option value="all">Tüm adaylar</option><option value="approved">Onaylı</option><option value="pending">Beklemede</option><option value="rejected">Reddedildi</option>
            </select>
          </div>
          {professionData.length ? (
            <ResponsiveContainer width="100%" height={Math.max(230, professionData.length * 42)}>
              <BarChart data={professionData} layout="vertical" margin={{ top: 4, right: 18, left: 12, bottom: 4 }}>
                <XAxis type="number" hide allowDecimals={false} /><YAxis type="category" dataKey="name" width={142} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgb(var(--primary-50))' }} /><Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={18}>{professionData.map((item, index) => <Cell key={item.name} fill={barColors[index % barColors.length]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="py-16 text-center text-sm text-gray-400">Bu filtre için aday bulunmuyor.</p>}
        </div>

        <div className="antigravity-card-static p-6 min-w-0">
          <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-5 h-5 text-primary-500" /><div><h2 className="text-sm font-semibold text-gray-700">Aday Durumu</h2><p className="text-xs text-gray-400 mt-0.5">CV havuzunun güncel özeti</p></div></div>
          <div className="relative h-56" onMouseEnter={() => setDonutHovered(true)} onMouseLeave={() => setDonutHovered(false)}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3} strokeWidth={0} shape={props => <DonutSlice {...props} separated={donutHovered} />} >{statusData.map(item => <Cell key={item.status} fill={statusColors[item.status]} />)}</Pie><Tooltip content={<DonutTooltip />} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-extrabold text-gray-900">{totalCVs}</span><span className="text-xs text-gray-400">Toplam CV</span></div></div>
          <div className="space-y-2">{statusData.map(item => <div key={item.status} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-gray-600"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColors[item.status] }} />{item.name}</span><span className="font-semibold text-gray-700">{item.value} <span className="font-normal text-gray-400">(%{item.percentage})</span></span></div>)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)] gap-6">
        <div className="antigravity-card-static p-5 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-4"><div className="flex items-center gap-2"><CalendarDays className="w-5 h-5 text-primary-500" /><div><h2 className="text-sm font-semibold text-gray-700">Bu Haftanın Mülakat Ajandası</h2><p className="text-xs text-gray-400 mt-0.5">Pazartesi - Pazar planı</p></div></div><span className="text-xs font-semibold text-primary-600">{weekInterviews.length} plan</span></div>
          <div className="dashboard-week-days">{weekDays.map(day => <div key={day.key} className={`dashboard-week-day ${day.key === today ? 'today' : ''}`}><span>{day.day}</span><strong>{day.date}</strong><small>{weekInterviews.filter(interview => interview.interview_date === day.key).length || ''}</small></div>)}</div>
          {weekInterviews.length ? <div className="dashboard-agenda-list">{weekInterviews.map(interview => <div key={interview.id} className={`dashboard-agenda-item ${interview.interview_date === today ? 'today' : ''}`}><div className="dashboard-agenda-date"><strong>{weekDays.find(day => day.key === interview.interview_date)?.day || ''}</strong><span>{interview.interview_date?.slice(8, 10)}</span></div><div className="min-w-0 flex-1"><p className="font-semibold text-gray-800 truncate">{capitalize(interview.candidate_name)}</p><p className="text-xs text-gray-500 truncate">{capitalize(interview.position)}</p></div><span className="dashboard-agenda-time">{interview.interview_time}</span></div>)}</div> : <p className="py-8 text-center text-sm text-gray-400">Bu hafta planlanmış mülakat bulunmuyor.</p>}
        </div>
        <div className="antigravity-card-static p-5 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-4"><div className="flex items-center gap-2"><Clock className="w-5 h-5 text-accent-600" /><div><h2 className="text-sm font-semibold text-gray-700">Yaklaşan Mülakatlar</h2><p className="text-xs text-gray-400 mt-0.5">Sıradaki görüşmeler</p></div></div><ChevronRight className="w-4 h-4 text-gray-400" /></div>
          {upcomingInterviews.length ? <div className="space-y-2.5">{upcomingInterviews.map(interview => <div key={interview.id} className="dashboard-upcoming-item"><div className="dashboard-upcoming-icon"><CalendarDays size={15} /></div><div className="min-w-0 flex-1"><p className="font-semibold text-gray-800 truncate">{capitalize(interview.candidate_name)}</p><p className="text-xs text-gray-500 truncate">{capitalize(interview.position)}</p></div><div className="text-right"><p className="text-xs font-bold text-primary-600">{interview.interview_date?.slice(5).replace('-', '.')}</p><p className="text-xs text-gray-400">{interview.interview_time}</p></div></div>)}</div> : <p className="py-8 text-center text-sm text-gray-400">Yaklaşan mülakat bulunmuyor.</p>}
        </div>
      </div>
    </div>
  );
}

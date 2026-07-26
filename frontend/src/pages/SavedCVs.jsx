import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Search, Trash2, Eye, Edit3, X, Save, FolderOpen, CheckCircle, XCircle, Clock, Code, Globe, Briefcase, GraduationCap } from 'lucide-react';

function capitalize(str) {
  if (!str) return '';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const statusConfig = {
  approved: { label: 'Onaylı', icon: CheckCircle, color: 'text-success-500', bg: 'bg-success-50', border: 'border-success-200' },
  rejected: { label: 'Reddedildi', icon: XCircle, color: 'text-danger-500', bg: 'bg-danger-50', border: 'border-danger-200' },
  pending: { label: 'Beklemede', icon: Clock, color: 'text-warning-500', bg: 'bg-warning-50', border: 'border-warning-200' },
};

export default function SavedCVs() {
  const { candidates, deleteCandidate, updateCandidate } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewingCV, setViewingCV] = useState(null);
  const [editingCV, setEditingCV] = useState(null);

  const filtered = candidates.filter(c => {
    const matchesSearch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.profession?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.university?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id) => {
    if (window.confirm('Bu CV\'yi silmek istediğinize emin misiniz?')) {
      deleteCandidate(id);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    updateCandidate(id, { status: newStatus });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kayıtlı CV'ler</h1>
        <p className="text-gray-500 mt-1">Veritabanındaki tüm adayları yönetin</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="İsim, meslek veya üniversite ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="antigravity-input pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                statusFilter === status
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-white/80 text-gray-600 hover:bg-primary-50 border border-surface-200'
              }`}
            >
              {status === 'all' ? 'Tümü' : statusConfig[status].label}
              <span className="ml-1.5 text-xs opacity-70">
                ({status === 'all' ? candidates.length : candidates.filter(c => c.status === status).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* CV Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((candidate, idx) => {
          const sConfig = statusConfig[candidate.status];
          return (
            <div
              key={candidate.id}
              className="antigravity-card p-5 space-y-3 animate-slide-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{capitalize(candidate.full_name)}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    {capitalize(candidate.profession)}
                  </p>
                </div>
                <span className={`pill ${sConfig.bg} ${sConfig.color} ${sConfig.border} border`}>
                  <sConfig.icon className="w-3 h-3 mr-1" />
                  {sConfig.label}
                </span>
              </div>

              {/* Info */}
              <div className="text-sm text-gray-500 space-y-1">
                <p className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {capitalize(candidate.university)} • {candidate.experience_years} yıl
                </p>
              </div>

              {/* Skills preview */}
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.slice(0, 5).map(skill => (
                  <span key={skill} className="text-xs px-2 py-0.5 rounded-md bg-primary-50 text-primary-600 font-medium">{skill}</span>
                ))}
                {candidate.skills.length > 5 && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-surface-100 text-gray-500">+{candidate.skills.length - 5}</span>
                )}
              </div>

              {/* Languages */}
              <div className="flex flex-wrap gap-1.5">
                {candidate.languages.map(lang => (
                  <span key={lang.language} className="text-xs px-2 py-0.5 rounded-md bg-language-50 text-language-500 font-medium">
                    {capitalize(lang.language)} {lang.level.toUpperCase()}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-surface-100">
                <button
                  onClick={() => setViewingCV(candidate)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-4 h-4" /> Görüntüle
                </button>
                <select
                  value={candidate.status}
                  onChange={(e) => handleStatusChange(candidate.id, e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm bg-surface-50 border border-surface-200 cursor-pointer"
                >
                  <option value="pending">Beklemede</option>
                  <option value="approved">Onayla</option>
                  <option value="rejected">Reddet</option>
                </select>
                <button
                  onClick={() => handleDelete(candidate.id)}
                  className="p-2 rounded-xl text-danger-400 hover:bg-danger-50 hover:text-danger-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Sonuç bulunamadı.</p>
        </div>
      )}

      {/* View Modal */}
      {viewingCV && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setViewingCV(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold gradient-text">{capitalize(viewingCV.full_name)}</h2>
                <p className="text-gray-500 mt-1">{capitalize(viewingCV.profession)} • {capitalize(viewingCV.university)}</p>
              </div>
              <button onClick={() => setViewingCV(null)} className="p-2 hover:bg-surface-100 rounded-xl">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="text-sm text-gray-500 space-y-1">
                <p>📧 {viewingCV.email} &nbsp;&nbsp; 📱 {viewingCV.phone}</p>
                <p>📅 Deneyim: {viewingCV.experience_years} yıl</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Yetkinlikler</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingCV.skills.map(s => <span key={s} className="pill pill-blue">{s}</span>)}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Diller</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingCV.languages.map(l => <span key={l.language} className="pill pill-purple">{capitalize(l.language)} — {l.level.toUpperCase()}</span>)}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Projeler</h4>
                <div className="space-y-2">
                  {viewingCV.projects.map((p, i) => (
                    <div key={i} className="p-3 bg-surface-50 rounded-xl">
                      <h5 className="font-semibold text-sm">{capitalize(p.title)}</h5>
                      <p className="text-xs text-gray-500 mt-1">{p.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.technologies.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded bg-primary-50 text-primary-600">{t}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {viewingCV.ai_summary && (
                <div className="p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl">
                  <h4 className="text-sm font-semibold text-primary-700 mb-1">AI Özet</h4>
                  <p className="text-sm text-gray-600">{viewingCV.ai_summary}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

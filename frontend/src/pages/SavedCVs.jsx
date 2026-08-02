import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api/api';
import CandidateRadarChart from '../components/CandidateRadarChart';
import SlideDeleteConfirm from '../components/SlideDeleteConfirm';
import { Search, Eye, Edit3, X, Save, FolderOpen, CheckCircle, XCircle, Clock, Code, Globe, Briefcase, GraduationCap, MessageSquareText, Loader2, MapPin, Link2, GitFork, ExternalLink, Award, Building2, ShieldCheck } from 'lucide-react';

function capitalize(str) {
  if (!str) return '';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function safeUrl(url) {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
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
  const [interviewAnalyses, setInterviewAnalyses] = useState([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    if (!viewingCV?.id) {
      setInterviewAnalyses([]);
      return;
    }
    setLoadingAnalyses(true);
    api.getInterviewAnalyses(viewingCV.id)
      .then(data => setInterviewAnalyses(Array.isArray(data) ? data : []))
      .catch(() => setInterviewAnalyses([]))
      .finally(() => setLoadingAnalyses(false));
  }, [viewingCV]);

  const filtered = candidates.filter(c => {
    const matchesSearch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.profession?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.university?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChangeLegacy = (id, newStatus) => {
    updateCandidate(id, { status: newStatus });
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteCandidate(id);
      deleteCandidate(id);
    } catch (error) {
      window.alert('CV veritabanından silinemedi.');
      throw error;
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.updateCandidate(id, { status: newStatus });
      updateCandidate(id, { status: newStatus });
    } catch {
      window.alert('CV durumu veritabanında güncellenemedi.');
    }
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
            placeholder="İsim, meslek, bölüm, konum veya üniversite ara..."
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
                  {candidate.department && <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400"><Building2 className="h-3.5 w-3.5" />{capitalize(candidate.department)}</p>}
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
                {candidate.location && <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{capitalize(candidate.location)}</p>}
              </div>

              {(candidate.linkedin_url || candidate.github_url || candidate.portfolio_url) && <div className="flex items-center gap-2">
                {candidate.linkedin_url && <a href={safeUrl(candidate.linkedin_url)} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 text-primary-500 hover:bg-primary-50" title="LinkedIn"><Link2 className="h-4 w-4" /></a>}
                {candidate.github_url && <a href={safeUrl(candidate.github_url)} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 text-primary-500 hover:bg-primary-50" title="GitHub"><GitFork className="h-4 w-4" /></a>}
                {candidate.portfolio_url && <a href={safeUrl(candidate.portfolio_url)} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 text-primary-500 hover:bg-primary-50" title="Portföy"><ExternalLink className="h-4 w-4" /></a>}
              </div>}

              {/* Skills preview */}
              <div className="flex flex-wrap gap-1.5">
                {(candidate.skills || []).slice(0, 5).map(skill => (
                  <span key={skill} className="text-xs px-2 py-0.5 rounded-md bg-primary-50 text-primary-600 font-medium">{skill}</span>
                ))}
                {(candidate.skills || []).length > 5 && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-surface-100 text-gray-500">+{candidate.skills.length - 5}</span>
                )}
              </div>

              {/* Languages */}
              <div className="flex flex-wrap gap-1.5">
                {(candidate.languages || []).map(lang => (
                  <span key={lang.language} className="text-xs px-2 py-0.5 rounded-md bg-language-50 text-language-500 font-medium">
                    {capitalize(lang.language)} {lang.level?.toUpperCase()}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-surface-100">
                <button
                  onClick={() => setViewingCV(candidate)}
                  className="flex w-[96px] shrink-0 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
                >
                  <Eye className="w-4 h-4" /> Görüntüle
                </button>
                {deleteConfirmId !== candidate.id && (
                  <select
                    value={candidate.status}
                    onChange={(e) => handleStatusChange(candidate.id, e.target.value)}
                    className="px-3 py-2 rounded-xl text-sm bg-surface-50 border border-surface-200 cursor-pointer"
                  >
                    <option value="pending">Beklemede</option>
                    <option value="approved">Onayla</option>
                    <option value="rejected">Reddet</option>
                  </select>
                )}
                <SlideDeleteConfirm
                  onConfirm={() => handleDelete(candidate.id)}
                  onOpenChange={isOpen => setDeleteConfirmId(isOpen ? candidate.id : null)}
                  label={`${capitalize(candidate.full_name)} CV kaydını sil`}
                />
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
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-8 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold gradient-text">{capitalize(viewingCV.full_name)}</h2>
                <p className="text-gray-500 mt-1">{capitalize(viewingCV.profession)} • {capitalize(viewingCV.university)}</p>
                {viewingCV.department && <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-400"><Building2 className="h-4 w-4" />{capitalize(viewingCV.department)}</p>}
              </div>
              <button onClick={() => setViewingCV(null)} className="p-2 hover:bg-surface-100 rounded-xl">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="text-sm text-gray-500 space-y-1">
                <p>📧 {viewingCV.email} &nbsp;&nbsp; 📱 {viewingCV.phone}</p>
                <p>📅 Deneyim: {viewingCV.experience_years} yıl</p>
                {viewingCV.location && <p className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{capitalize(viewingCV.location)}</p>}
              </div>

              {(viewingCV.linkedin_url || viewingCV.github_url || viewingCV.portfolio_url) && <div className="flex flex-wrap gap-2">
                {viewingCV.linkedin_url && <a href={safeUrl(viewingCV.linkedin_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-600 hover:bg-primary-100"><Link2 className="h-4 w-4" />LinkedIn</a>}
                {viewingCV.github_url && <a href={safeUrl(viewingCV.github_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-600 hover:bg-primary-100"><GitFork className="h-4 w-4" />GitHub</a>}
                {viewingCV.portfolio_url && <a href={safeUrl(viewingCV.portfolio_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-600 hover:bg-primary-100"><ExternalLink className="h-4 w-4" />Portföy</a>}
              </div>}

              {viewingCV.analysis_meta?.pipeline_status === 'success' && <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-success-200 bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-600"><ShieldCheck className="h-3.5 w-3.5" />NVIDIA OCR</span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-success-200 bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-600"><ShieldCheck className="h-3.5 w-3.5" />Gemini 3.5 Flash</span>
              </div>}

              <div className="border-y border-surface-100 py-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Aday Yetkinlik Radarı</h4>
                <p className="text-xs text-gray-400">CV profili ve varsa mülakat analizinden oluşturulur.</p>
                <CandidateRadarChart candidate={viewingCV} />
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Yetkinlikler</h4>
                <div className="flex flex-wrap gap-2">
                  {(viewingCV.skills || []).map(s => <span key={s} className="pill pill-blue">{s}</span>)}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Diller</h4>
                <div className="flex flex-wrap gap-2">
                  {(viewingCV.languages || []).map(l => <span key={l.language} className="pill pill-purple">{capitalize(l.language)}{l.level ? ` — ${l.level.toUpperCase()}` : ''}</span>)}
                </div>
              </div>

              {(viewingCV.certifications || []).length > 0 && <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"><Award className="h-4 w-4 text-warning-500" />Sertifikalar</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {viewingCV.certifications.map((certificate, index) => <div key={`${certificate.name}-${index}`} className="rounded-xl bg-surface-50 p-3">
                    <p className="text-sm font-semibold text-gray-800">{certificate.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{[certificate.issuer, certificate.year].filter(Boolean).join(' • ')}</p>
                  </div>)}
                </div>
              </div>}

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Projeler</h4>
                <div className="space-y-2">
                  {(viewingCV.projects || []).map((p, i) => (
                    <div key={i} className="p-3 bg-surface-50 rounded-xl">
                      <h5 className="font-semibold text-sm">{capitalize(p.title)}</h5>
                      <p className="text-xs text-gray-500 mt-1">{p.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(Array.isArray(p.technologies) ? p.technologies : []).map(t => <span key={t} className="text-xs px-2 py-0.5 rounded bg-primary-50 text-primary-600">{t}</span>)}
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

              <div className="border-t border-surface-100 pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquareText className="w-4 h-4 text-primary-500" />
                  <h4 className="text-sm font-semibold text-gray-700">Mülakat Asistanı Kayıtları</h4>
                </div>
                {loadingAnalyses && <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />}
                {!loadingAnalyses && interviewAnalyses.length === 0 && <p className="text-xs text-gray-400">Bu aday için henüz kaydedilmiş mülakat analizi yok.</p>}
                <div className="space-y-3">
                  {interviewAnalyses.map(analysis => (
                    <div key={analysis.id} className="bg-surface-50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-primary-600">{analysis.analysis_mode === 'llm' ? 'LLM analizi' : 'Demo analizi'}</span>
                        <span className="text-[11px] text-gray-400">{analysis.created_at ? new Date(analysis.created_at).toLocaleDateString('tr-TR') : ''}</span>
                      </div>
                      <p className="text-xs text-gray-600"><strong>Özet:</strong> {analysis.summary}</p>
                      <p className="text-xs text-gray-600"><strong>Değerlendirme:</strong> {analysis.general_evaluation}</p>
                      <details className="text-xs text-gray-500">
                        <summary className="cursor-pointer text-primary-600">Konuşmanın tamamını aç</summary>
                        <p className="whitespace-pre-wrap mt-2 leading-relaxed">{analysis.transcript}</p>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

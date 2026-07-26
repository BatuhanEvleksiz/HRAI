import React from 'react';
import { useStore } from '../store/useStore';
import { FileText, Trash2, Eye, Calendar, Target, Users, X } from 'lucide-react';
import { useState } from 'react';

function capitalize(str) {
  if (!str) return '';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function Reports() {
  const { reports, deleteReport } = useStore();
  const [viewingReport, setViewingReport] = useState(null);

  const handleDelete = (id) => {
    if (window.confirm('Bu raporu silmek istediğinize emin misiniz?')) {
      deleteReport(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Raporlar</h1>
        <p className="text-gray-500 mt-1">Kaydedilen aday analiz raporları ve mülakat notları</p>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Henüz kaydedilmiş rapor yok.</p>
          <p className="text-gray-300 text-sm mt-1">Eşleşme Motoru'ndan rapor kaydedin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report, idx) => (
            <div key={report.id} className="antigravity-card p-6 space-y-4 animate-slide-up" style={{ animationDelay: `${idx * 80}ms` }}>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{report.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {capitalize(report.position) || 'Genel'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(report.created_at).toLocaleDateString('tr-TR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {report.matched_candidates?.length || 0} aday
                    </span>
                  </div>
                </div>
              </div>

              {/* Top candidates preview */}
              {report.matched_candidates?.slice(0, 3).map((mc, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-surface-50 rounded-lg text-sm">
                  <span className="text-gray-700 font-medium">{i + 1}. {mc.candidate_name}</span>
                  <span className={`font-bold ${mc.score >= 70 ? 'text-success-500' : mc.score >= 40 ? 'text-warning-500' : 'text-danger-500'}`}>
                    %{mc.score}
                  </span>
                </div>
              ))}

              {/* AI Summary */}
              {report.ai_summary && (
                <p className="text-xs text-gray-500 italic">{report.ai_summary}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-surface-100">
                <button
                  onClick={() => setViewingReport(report)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-4 h-4" /> Detay
                </button>
                <button
                  onClick={() => handleDelete(report.id)}
                  className="p-2 rounded-xl text-danger-400 hover:bg-danger-50 hover:text-danger-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setViewingReport(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{viewingReport.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{capitalize(viewingReport.position)} • {new Date(viewingReport.created_at).toLocaleDateString('tr-TR')}</p>
              </div>
              <button onClick={() => setViewingReport(null)} className="p-2 hover:bg-surface-100 rounded-xl">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Filter Criteria */}
            {viewingReport.filter_criteria && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Arama Kriterleri</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingReport.filter_criteria.skills?.map(s => (
                    <span key={s} className="pill pill-blue">{s}</span>
                  ))}
                  {viewingReport.filter_criteria.languages?.map(l => (
                    <span key={l.language} className="pill pill-purple">{capitalize(l.language)} {l.level?.toUpperCase()}</span>
                  ))}
                  {viewingReport.filter_criteria.university && (
                    <span className="pill pill-yellow">{capitalize(viewingReport.filter_criteria.university)}</span>
                  )}
                </div>
              </div>
            )}

            {/* All Candidates */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Eşleşen Adaylar</h4>
              {viewingReport.matched_candidates?.map((mc, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-xs font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">{mc.candidate_name}</span>
                      {mc.ai_comment && <p className="text-xs text-gray-500 mt-0.5">{mc.ai_comment}</p>}
                    </div>
                  </div>
                  <span className={`text-2xl font-extrabold ${mc.score >= 70 ? 'text-success-500' : mc.score >= 40 ? 'text-warning-500' : 'text-danger-500'}`}>
                    %{mc.score}
                  </span>
                </div>
              ))}
            </div>

            {/* AI Summary */}
            {viewingReport.ai_summary && (
              <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl">
                <h4 className="text-sm font-semibold text-primary-700 mb-1">AI Genel Değerlendirme</h4>
                <p className="text-sm text-gray-600">{viewingReport.ai_summary}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

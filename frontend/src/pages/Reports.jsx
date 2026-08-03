import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api/api';
import SlideDeleteConfirm from '../components/SlideDeleteConfirm';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import {
  FileText, Eye, Calendar, Target, Users, X, Download,
  Save, SlidersHorizontal,
} from 'lucide-react';

const RADAR_AXES = [
  { key: 'technical_skills', label: 'Teknik Yetkinlik' },
  { key: 'project_experience', label: 'Proje Deneyimi' },
  { key: 'experience_level', label: 'Deneyim Seviyesi' },
  { key: 'language_proficiency', label: 'Dil Yeterliliği' },
  { key: 'communication_clarity', label: 'İletişim Netliği' },
  { key: 'technical_depth', label: 'Teknik Derinlik' },
];

const RADAR_COLORS = ['#1B4EF5', '#8E94F2', '#22B8A7', '#F59E0B'];
const LANGUAGE_LEVELS = { a1: 1, a2: 2, b1: 3, b2: 4, c1: 5, c2: 6 };
const SIGNAL_SCORES = {
  low: 3, düşük: 3,
  medium: 6, orta: 6,
  high: 9, yüksek: 9,
};

function capitalize(str) {
  if (!str) return '';
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function candidateKey(candidate, index = 0) {
  return String(candidate.candidate_id || candidate.candidate_name || index);
}

function candidateFinalScore(candidate) {
  return Number(candidate.final_score ?? candidate.hybrid_score ?? candidate.score ?? 0);
}

function scoreTone(score) {
  return score >= 70 ? 'text-success-500' : score >= 40 ? 'text-warning-500' : 'text-danger-500';
}

function requirementLabel(item) {
  return typeof item === 'string' ? item : item?.label || '';
}

function scoreFromSignal(value) {
  if (value === null || value === undefined || value === '') return null;
  if (Number.isFinite(Number(value))) return Math.max(0, Math.min(10, Number(value)));
  return SIGNAL_SCORES[String(value).trim().toLocaleLowerCase('tr-TR')] ?? null;
}

function roundRadar(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
  return Math.max(0, Math.min(10, Math.round(Number(value) * 10) / 10));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function deriveCvScores(report, matchedCandidate, candidate) {
  const criteria = report.filter_criteria || {};
  const saved = matchedCandidate.radar_scores || {};
  if (!candidate) return { ...saved };

  const requiredSkills = criteria.skills || [];
  const candidateSkills = new Set((candidate.skills || []).map(item => item.toLocaleLowerCase('tr-TR')));
  const technicalSkills = requiredSkills.length
    ? (requiredSkills.filter(item => candidateSkills.has(String(item).toLocaleLowerCase('tr-TR'))).length / requiredSkills.length) * 10
    : null;

  const projectKeywords = criteria.projects || [];
  const projectText = (candidate.projects || []).map(project =>
    `${project.title || ''} ${project.description || ''} ${(project.technologies || []).join(' ')}`
  ).join(' ').toLocaleLowerCase('tr-TR');
  const projectExperience = projectKeywords.length
    ? (projectKeywords.filter(item => projectText.includes(String(item).toLocaleLowerCase('tr-TR'))).length / projectKeywords.length) * 10
    : null;

  const requiredYears = Number(criteria.required_experience_years || 0);
  const experienceLevel = requiredYears > 0
    ? Math.min(10, (Number(candidate.experience_years || 0) / requiredYears) * 10)
    : null;

  const requiredLanguages = criteria.languages || [];
  const candidateLanguages = new Map((candidate.languages || []).map(language => [
    String(language.language || '').toLocaleLowerCase('tr-TR'),
    LANGUAGE_LEVELS[String(language.level || '').toLowerCase()] || 0,
  ]));
  const languageProficiency = requiredLanguages.length
    ? requiredLanguages.reduce((total, requirement) => {
      const requiredLevel = LANGUAGE_LEVELS[String(requirement.level || '').toLowerCase()] || 1;
      const candidateLevel = candidateLanguages.get(String(requirement.language || '').toLocaleLowerCase('tr-TR')) || 0;
      return total + Math.min(1, candidateLevel / requiredLevel);
    }, 0) / requiredLanguages.length * 10
    : null;

  return {
    technical_skills: saved.technical_skills ?? roundRadar(technicalSkills),
    project_experience: saved.project_experience ?? roundRadar(projectExperience),
    experience_level: saved.experience_level ?? roundRadar(experienceLevel),
    language_proficiency: saved.language_proficiency ?? roundRadar(languageProficiency),
    communication_clarity: saved.communication_clarity ?? null,
    technical_depth: saved.technical_depth ?? null,
  };
}

export default function Reports() {
  const {
    reports, candidates, deleteReport, updateReport,
  } = useStore();
  const [viewingReport, setViewingReport] = useState(null);
  const [draftCandidates, setDraftCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [isLoadingSignals, setIsLoadingSignals] = useState(false);
  const [isSavingScores, setIsSavingScores] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const openReport = async report => {
    const enriched = (report.matched_candidates || []).map((matchedCandidate, index) => {
      const candidate = candidates.find(item =>
        String(item.id) === String(matchedCandidate.candidate_id)
        || item.full_name?.toLocaleLowerCase('tr-TR') === matchedCandidate.candidate_name?.toLocaleLowerCase('tr-TR')
      );
      const resolvedCandidateId = matchedCandidate.candidate_id || candidate?.id;
      return {
        ...matchedCandidate,
        candidate_id: resolvedCandidateId,
        radar_scores: deriveCvScores(report, matchedCandidate, candidate),
        radar_sources: matchedCandidate.radar_sources || {},
        _key: String(resolvedCandidateId || matchedCandidate.candidate_name || index),
      };
    });

    setViewingReport(report);
    setDraftCandidates(enriched);
    setSelectedCandidates(enriched.slice(0, 3).map(item => item._key));
    setMessage('');

    const candidatesWithIds = enriched.filter(item => item.candidate_id);
    if (!candidatesWithIds.length) return;
    setIsLoadingSignals(true);
    try {
      const analyses = await Promise.all(candidatesWithIds.map(item =>
        api.getInterviewAnalyses(item.candidate_id).catch(() => [])
      ));
      setDraftCandidates(current => current.map(item => {
        const analysisIndex = candidatesWithIds.findIndex(candidate => candidate.candidate_id === item.candidate_id);
        const latest = analysisIndex >= 0 ? analyses[analysisIndex]?.[0] : null;
        const signals = latest?.communication_signals || {};
        const currentScores = item.radar_scores || {};
        const currentSources = item.radar_sources || {};
        return {
          ...item,
          radar_scores: {
            ...currentScores,
            communication_clarity: currentScores.communication_clarity
              ?? scoreFromSignal(signals.expression_clarity),
            technical_depth: currentScores.technical_depth
              ?? scoreFromSignal(signals.technical_depth),
          },
          radar_sources: {
            ...currentSources,
            ...(currentScores.communication_clarity == null && signals.expression_clarity
              ? { communication_clarity: 'llm' } : {}),
            ...(currentScores.technical_depth == null && signals.technical_depth
              ? { technical_depth: 'llm' } : {}),
          },
        };
      }));
    } finally {
      setIsLoadingSignals(false);
    }
  };

  const handleDelete = async id => {
    try {
      await api.deleteReport(id);
      deleteReport(id);
    } catch (error) {
      alert(error.message || 'Rapor silinemedi.');
      throw error;
    }
  };

  const toggleCandidate = key => {
    setSelectedCandidates(current => {
      if (current.includes(key)) return current.filter(item => item !== key);
      if (current.length >= 4) {
        setMessage('Radar karşılaştırmasında aynı anda en fazla 4 aday seçilebilir.');
        return current;
      }
      setMessage('');
      return [...current, key];
    });
  };

  const setRadarScore = (key, axis, value) => {
    setDraftCandidates(current => current.map(candidate => {
      if (candidate._key !== key) return candidate;
      return {
        ...candidate,
        radar_scores: {
          ...candidate.radar_scores,
          [axis]: value === '' ? null : roundRadar(value),
        },
        radar_sources: {
          ...candidate.radar_sources,
          [axis]: 'hr',
        },
      };
    }));
  };

  const saveRadarScores = async () => {
    if (!viewingReport) return;
    const cleanCandidates = draftCandidates.map(({ _key, ...candidate }) => candidate);
    setIsSavingScores(true);
    setMessage('');
    try {
      const saved = await api.updateReport(viewingReport.id, { matched_candidates: cleanCandidates });
      const nextReport = { ...viewingReport, ...saved, matched_candidates: cleanCandidates };
      updateReport(viewingReport.id, nextReport);
      setViewingReport(nextReport);
      setMessage('İK radar puanları rapora kaydedildi.');
    } catch (error) {
      setMessage(error.message || 'Radar puanları kaydedilemedi.');
    } finally {
      setIsSavingScores(false);
    }
  };

  const selectedDrafts = useMemo(
    () => draftCandidates.filter(candidate => selectedCandidates.includes(candidate._key)),
    [draftCandidates, selectedCandidates]
  );

  const radarData = useMemo(() => RADAR_AXES.map(axis => {
    const row = { axis: axis.label, fullMark: 10 };
    selectedDrafts.forEach(candidate => {
      row[candidate._key] = candidate.radar_scores?.[axis.key] ?? null;
    });
    return row;
  }), [selectedDrafts]);

  const exportReportPdf = (report, reportCandidates = [], includeRadar = false) => {
    const printWindow = window.open('', '_blank', 'width=1050,height=800');
    if (!printWindow) {
      alert('PDF penceresi açılamadı. Tarayıcı popup iznini kontrol edin.');
      return;
    }
    const radarSvg = includeRadar
      ? document.querySelector('[data-report-radar] svg')?.outerHTML || ''
      : '';
    const rows = reportCandidates.map((candidate, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(candidate.candidate_name)}</td>
        <td>%${escapeHtml(candidate.match_score ?? 0)}</td>
        <td>%${escapeHtml(candidate.quality_score ?? 0)}</td>
        <td><strong>%${escapeHtml(candidateFinalScore(candidate))}</strong></td>
        <td>${escapeHtml((candidate.matched_requirements || []).map(requirementLabel).join(', ') || 'Yok')}</td>
        <td>${escapeHtml((candidate.missing_requirements || []).map(requirementLabel).join(', ') || 'Yok')}</td>
        <td>${escapeHtml(candidate.evaluation_summary || candidate.ai_comment || '')}</td>
      </tr>
    `).join('');
    printWindow.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8">
      <title>${escapeHtml(report.title)}</title>
      <style>
        body{font-family:Arial,sans-serif;color:#1f2937;margin:36px}h1{font-size:24px;margin:0 0 6px}
        .meta{color:#6b7280;margin-bottom:24px}.summary{padding:14px;background:#f3f6ff;border-left:4px solid #1B4EF5;margin:20px 0}
        table{width:100%;border-collapse:collapse;margin-top:18px}th,td{padding:10px;border-bottom:1px solid #e5e7eb;text-align:left;font-size:11px;vertical-align:top}
        th{background:#f8fafc}.radar{max-width:680px;margin:20px auto}.foot{margin-top:28px;color:#6b7280;font-size:10px}table:nth-of-type(2){display:none}
      </style></head><body>
      <h1>${escapeHtml(report.title)}</h1>
      <div class="meta">${escapeHtml(capitalize(report.position) || 'Genel')} · ${escapeHtml(new Date(report.created_at).toLocaleDateString('tr-TR'))}</div>
      ${report.ai_summary ? `<div class="summary">${escapeHtml(report.ai_summary)}</div>` : ''}
      ${radarSvg ? `<div class="radar">${radarSvg}</div>` : ''}
      <table><thead><tr><th>#</th><th>Aday</th><th>Ilan uyumu</th><th>Profil kalitesi</th><th>Nihai skor</th><th>Karsilanan nitelikler</th><th>Eksik / teyit</th><th>Degerlendirme</th></tr></thead><tbody>${rows}</tbody></table>
      <table><thead><tr><th>#</th><th>Aday</th><th>Eşleşme</th><th>Değerlendirme</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="foot">Radar puanları karar destek amaçlıdır; tek başına işe alım kararı olarak kullanılmamalıdır.</div>
      <script>window.onload=()=>setTimeout(()=>window.print(),250)</script></body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Raporlar</h1>
        <p className="text-gray-500 mt-1">Kaydedilen aday analiz raporları ve mülakat notları</p>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Henüz kaydedilmiş rapor yok.</p>
          <p className="text-gray-300 text-sm mt-1">Eşleşme Motoru'ndan rapor kaydedin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report, index) => (
            <div key={report.id} className="antigravity-card p-6 space-y-4 animate-slide-up" style={{ animationDelay: `${index * 80}ms` }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{report.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Target className="w-3 h-3" />{capitalize(report.position) || 'Genel'}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(report.created_at).toLocaleDateString('tr-TR')}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{report.matched_candidates?.length || 0} aday</span>
                  </div>
                </div>
              </div>

              {report.matched_candidates?.slice(0, 3).map((candidate, candidateIndex) => (
                <React.Fragment key={candidateKey(candidate, candidateIndex)}>
                <div key={candidateKey(candidate, candidateIndex)} className="flex items-center justify-between py-1.5 px-3 bg-surface-50 rounded-lg text-sm">
                  <span className="text-gray-700 font-medium">{candidateIndex + 1}. {candidate.candidate_name}</span>
                  <span className={`font-bold ${scoreTone(candidateFinalScore(candidate))}`}>%{candidateFinalScore(candidate)}</span>
                </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
                    <span>Ä°lan uyumu %{candidate.match_score ?? 0}</span>
                    <span>Profil kalitesi %{candidate.quality_score ?? 0}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="requirement-ok">{candidate.matched_requirements?.length || 0} kriter karÅŸÄ±landÄ±</span>
                    <span className="requirement-missing">{candidate.missing_requirements?.length || 0} kriter eksik / teyit</span>
                  </div>
                </React.Fragment>
              ))}

              {report.ai_summary && <p className="text-xs text-gray-500 italic">{report.ai_summary}</p>}

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-100">
                <button onClick={() => openReport(report)} className="flex-1 py-2 rounded-xl text-sm font-medium text-primary-600 hover:bg-primary-50 flex items-center justify-center gap-1.5">
                  <Eye className="w-4 h-4" /> Detay
                </button>
                {deleteConfirmId !== report.id && (
                  <button onClick={() => exportReportPdf(report, report.matched_candidates || [])} className="p-2 rounded-xl text-primary-500 hover:bg-primary-50" title="PDF indir">
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <SlideDeleteConfirm
                  onConfirm={() => handleDelete(report.id)}
                  onOpenChange={isOpen => setDeleteConfirmId(isOpen ? report.id : null)}
                  label={`${report.title} raporunu sil`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setViewingReport(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-7 animate-slide-up" onClick={event => event.stopPropagation()}>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{viewingReport.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{capitalize(viewingReport.position)} · {new Date(viewingReport.created_at).toLocaleDateString('tr-TR')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => exportReportPdf(viewingReport, draftCandidates, true)} className="px-3 py-2 rounded-xl text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 flex items-center gap-2">
                  <Download className="w-4 h-4" /> PDF İndir
                </button>
                <button onClick={() => setViewingReport(null)} className="p-2 hover:bg-surface-100 rounded-xl"><X className="w-5 h-5 text-gray-400" /></button>
              </div>
            </div>

            {viewingReport.filter_criteria && (
              <div className="mb-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Arama Kriterleri</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingReport.filter_criteria.skills?.map(skill => <span key={skill} className="pill pill-blue">{skill}</span>)}
                  {viewingReport.filter_criteria.languages?.map(language => <span key={language.language} className="pill pill-purple">{capitalize(language.language)} {language.level?.toUpperCase()}</span>)}
                  {viewingReport.filter_criteria.required_experience_years && <span className="pill pill-yellow">{viewingReport.filter_criteria.required_experience_years}+ yıl deneyim</span>}
                </div>
              </div>
            )}

            <div className="border-y border-surface-200 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">Aday Yetkinlik Karşılaştırması</h3>
                  <p className="text-xs text-gray-500 mt-1">Grafikte göstermek için en fazla 4 aday seçin.</p>
                </div>
                {isLoadingSignals && <span className="text-xs text-primary-500">Mülakat sinyalleri yükleniyor...</span>}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {draftCandidates.map((candidate, index) => {
                  const key = candidate._key || candidateKey(candidate, index);
                  const selected = selectedCandidates.includes(key);
                  return (
                    <label key={key} className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${selected ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-surface-200 text-gray-500'}`}>
                      <input type="checkbox" checked={selected} onChange={() => toggleCandidate(key)} className="accent-primary-500" />
                      {candidate.candidate_name}
                    </label>
                  );
                })}
              </div>

              <div data-report-radar className="h-[420px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="72%">
                    <PolarGrid stroke="rgb(var(--surface-200))" />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} tickCount={6} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    <Tooltip formatter={(value, name) => [value == null ? 'Veri yok' : `${value}/10`, name]} />
                    <Legend />
                    {selectedDrafts.map((candidate, index) => (
                      <Radar
                        key={candidate._key}
                        name={candidate.candidate_name}
                        dataKey={candidate._key}
                        stroke={RADAR_COLORS[index]}
                        fill={RADAR_COLORS[index]}
                        fillOpacity={0.12}
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              {selectedDrafts.some(candidate => RADAR_AXES.some(axis => candidate.radar_scores?.[axis.key] == null)) && (
                <p className="text-xs text-warning-600 text-center">Bazı eksenlerde veri yok. Mülakat analizi yükleyebilir veya İK puanı girebilirsiniz.</p>
              )}
            </div>

            <div className="py-5">
              <div className="flex items-center gap-2 mb-3">
                <SlidersHorizontal className="w-4 h-4 text-primary-500" />
                <h3 className="font-bold text-gray-900">İK Puan Düzenleme</h3>
              </div>
              <div className="overflow-x-auto border border-surface-200 rounded-xl">
                <table className="w-full min-w-[850px] text-sm">
                  <thead className="bg-surface-50 text-xs text-gray-500">
                    <tr>
                      <th className="text-left px-3 py-2.5">Aday</th>
                      {RADAR_AXES.map(axis => <th key={axis.key} className="text-left px-2 py-2.5">{axis.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {draftCandidates.map((candidate, index) => {
                      const key = candidate._key || candidateKey(candidate, index);
                      return (
                        <tr key={key} className="border-t border-surface-100">
                          <td className="px-3 py-2 font-semibold text-gray-700 whitespace-nowrap">{candidate.candidate_name}</td>
                          {RADAR_AXES.map(axis => (
                            <td key={axis.key} className="px-2 py-2">
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.5"
                                value={candidate.radar_scores?.[axis.key] ?? ''}
                                onChange={event => setRadarScore(key, axis.key, event.target.value)}
                                placeholder="—"
                                className="w-16 rounded-lg border border-surface-200 bg-surface-50 px-2 py-1.5 text-sm outline-none focus:border-primary-400"
                                aria-label={`${candidate.candidate_name} ${axis.label}`}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-gray-500">{message || 'CV skorları otomatik, mülakat skorları LLM önerisi olarak gelir. İK tüm alanları değiştirebilir.'}</p>
                <button onClick={saveRadarScores} disabled={isSavingScores} className="antigravity-button flex items-center gap-2 disabled:opacity-50">
                  <Save className="w-4 h-4" /> {isSavingScores ? 'Kaydediliyor...' : 'İK Puanlarını Kaydet'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Eşleşen Adaylar</h4>
              {draftCandidates.map((candidate, index) => (
                <div key={candidate._key || candidateKey(candidate, index)} className="grid min-w-0 gap-4 border-b border-surface-100 py-5 md:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-xs font-bold">{index + 1}</div>
                    <div>
                      <span className="font-medium text-gray-800">{candidate.candidate_name}</span>
                      {candidate.evaluation_summary && <p className="text-xs text-gray-500 mt-0.5">{candidate.evaluation_summary}</p>}
                    </div>
                  </div>
                  <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3 sm:text-right">
                    <div><span className="score-caption">Ä°lan uyumu</span><strong className="text-sm text-gray-700">%{candidate.match_score ?? 0}</strong></div>
                    <div><span className="score-caption">Profil kalitesi</span><strong className="text-sm text-gray-700">%{candidate.quality_score ?? 0}</strong></div>
                    <div><span className="score-caption">Nihai skor</span><strong className={`text-lg ${scoreTone(candidateFinalScore(candidate))}`}>%{candidateFinalScore(candidate)}</strong></div>
                  </div>
                  <div className="grid min-w-0 gap-3 md:col-span-2 md:grid-cols-2">
                    <div><p className="mb-1.5 text-[11px] font-bold uppercase text-success-600">KarÅŸÄ±lanan nitelikler</p><div className="flex flex-wrap gap-1.5">{candidate.matched_requirements?.length ? candidate.matched_requirements.map((item, itemIndex) => <span key={`matched-${itemIndex}`} className="requirement-ok">{requirementLabel(item)}</span>) : <span className="text-xs text-gray-400">AÃ§Ä±k kriter bulunmuyor</span>}</div></div>
                    <div><p className="mb-1.5 text-[11px] font-bold uppercase text-danger-600">Eksik / teyit edilmeli</p><div className="flex flex-wrap gap-1.5">{candidate.missing_requirements?.length ? candidate.missing_requirements.map((item, itemIndex) => <span key={`missing-${itemIndex}`} className="requirement-missing">{requirementLabel(item)}</span>) : <span className="text-xs text-success-600">Belirgin kriter eksiÄŸi yok</span>}</div></div>
                  </div>
                  {candidate.breakdown && Object.keys(candidate.breakdown).length > 0 && (
                    <div className="rounded-xl bg-surface-50 p-3 md:col-span-2">
                      <p className="mb-2 text-[11px] font-bold uppercase text-gray-500">Puan kÄ±rÄ±lÄ±mÄ±</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {Object.entries(candidate.breakdown).map(([key, item]) => (
                          <div key={key} className="flex min-w-0 items-center justify-between gap-3 text-xs text-gray-600">
                            <span className="min-w-0 break-words">{item.label || key}</span>
                            <strong className="text-gray-800">{item.score ?? 0}/{item.max ?? 0}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

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

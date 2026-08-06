import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, BriefcaseBusiness, Building2, Check, ChevronRight, Clock3,
  FileText, MapPin, Pencil, Plus, Save, Search, Sparkles, Trash2, Upload, Users, X,
} from 'lucide-react';
import { api } from '../api/api';
import BatchCandidateUploader from '../components/BatchCandidateUploader';
import { useStore } from '../store/useStore';

const EMPTY_JOB = {
  title: '', company_name: '', company_url: '', location: '', workplace_type: 'İş Yerinde',
  employment_type: 'Tam Zamanlı', seniority: '', department: '', about: '', qualifications: [],
  responsibilities: [], min_experience_years: '', max_experience_years: '', education_level: 'Üniversite (Mezun)',
  education_departments: [], military_statuses: [], language_requirements: [], driver_licenses: [],
  required_skills: [], preferred_skills: [], preferred_certifications: [], status: 'draft',
};

const STATUS_LABELS = { draft: 'Taslak', published: 'Yayında', closed: 'Kapalı' };

function cleanTemplateLine(line) {
  return line.replace(/\*\*/g, '').replace(/^\s*(?:[-\u2022*]|\d+[.)])\s*/, '').trim();
}

function sectionLines(lines, aliases) {
  const start = lines.findIndex(line => aliases.some(alias => cleanTemplateLine(line).toLocaleLowerCase('tr-TR').startsWith(alias)));
  if (start < 0) return [];
  const result = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = cleanTemplateLine(lines[index]);
    if (!line) continue;
    if (/^(?:iş ilanı hakkında|aranan nitelikler|iş tanımı|sorumluluklar|aday kriterleri|zorunlu yetkinlikler|tercih edilen yetkinlikler|uygun bölümler|tercih edilen sertifikalar|askerlik durumu|ehliyet|eğitim seviyesi|yabancı dil|tecrübe|minimum deneyim|maksimum deneyim)/i.test(line)) break;
    result.push(line);
  }
  return result;
}

function labeledValue(lines, labels) {
  const line = lines.find(item => labels.some(label => item.toLocaleLowerCase('tr-TR').startsWith(label)));
  return line ? line.replace(/^([^:]+):\s*/i, '').trim() : '';
}

function parseJobTemplate(text) {
  const lines = String(text || '').split(/\r?\n/).map(cleanTemplateLine).filter(Boolean);
  const valueAfter = labels => labeledValue(lines, labels);
  const about = sectionLines(lines, ['iş ilanı hakkında']);
  const qualifications = sectionLines(lines, ['aranan nitelikler']);
  const responsibilities = sectionLines(lines, ['iş tanımı', 'sorumluluklar']);
  const requiredSkills = sectionLines(lines, ['zorunlu yetkinlikler']);
  const preferredSkills = sectionLines(lines, ['tercih edilen yetkinlikler']);
  const experience = valueAfter(['tecrübe', 'deneyim']);
  const experienceNumbers = (experience.match(/\d+(?:[.,]\d+)?/g) || []).map(Number);
  const language = valueAfter(['yabancı dil', 'yabancı diller']);
  const languageMatch = language.match(/^([^()\d]+?)(?:\s*\([^)]*\))?\s*(A1|A2|B1|B2|C1|C2|Anadil)?$/i);
  return {
    ...EMPTY_JOB,
    title: valueAfter(['iş ilanı başlığı', 'pozisyon', 'ilan başlığı']) || lines[0] || '',
    company_name: valueAfter(['şirket', 'firma', 'company']),
    location: valueAfter(['konum', 'lokasyon', 'çalışma yeri']),
    workplace_type: valueAfter(['çalışma modeli', 'çalışma ortamı']) || EMPTY_JOB.workplace_type,
    employment_type: valueAfter(['çalışma şekli', 'istihdam türü']) || EMPTY_JOB.employment_type,
    seniority: valueAfter(['seviye', 'kıdem']),
    department: valueAfter(['departman', 'bölüm']),
    about: about.join('\n'),
    qualifications,
    responsibilities,
    required_skills: requiredSkills,
    preferred_skills: preferredSkills,
    education_departments: sectionLines(lines, ['uygun bölümler']),
    preferred_certifications: sectionLines(lines, ['tercih edilen sertifikalar']),
    military_statuses: sectionLines(lines, ['askerlik durumu']),
    driver_licenses: sectionLines(lines, ['ehliyet']),
    min_experience_years: experienceNumbers[0] ?? '',
    max_experience_years: experienceNumbers[1] ?? experienceNumbers[0] ?? '',
    education_level: valueAfter(['eğitim seviyesi', 'öğrenim seviyesi']) || EMPTY_JOB.education_level,
    language_requirements: languageMatch && languageMatch[1] ? [{ language: languageMatch[1].trim(), level: (languageMatch[2] || 'B2').toUpperCase() }] : [],
  };
}

function TagEditor({ value = [], onChange, placeholder }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const item = draft.trim();
    if (item && !value.some(existing => existing.toLowerCase() === item.toLowerCase())) onChange([...value, item]);
    setDraft('');
  };
  return <div className="tag-editor">
    <div className="flex flex-wrap gap-1.5">{value.map(item => <span key={item} className="job-tag">{item}<button type="button" onClick={() => onChange(value.filter(valueItem => valueItem !== item))} aria-label={`${item} kaldır`}><X size={12} /></button></span>)}</div>
    <input value={draft} placeholder={placeholder} onChange={event => setDraft(event.target.value)} onBlur={add} onKeyDown={event => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); add(); } }} />
  </div>;
}

function LinesField({ value = [], onChange, placeholder, rows = 5 }) {
  const [text, setText] = useState(() => value.join('\n'));
  return <textarea className="job-input resize-y" rows={rows} value={text} placeholder={placeholder} onChange={event => {
    setText(event.target.value);
    onChange(event.target.value.split('\n').map(line => line.trim()).filter(Boolean));
  }} />;
}

function Field({ label, children, className = '' }) {
  return <label className={`block ${className}`}><span className="job-label">{label}</span>{children}</label>;
}

function JobForm({ initialJob, onCancel, onSaved }) {
  const [form, setForm] = useState(() => ({ ...EMPTY_JOB, ...(initialJob || {}) }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.company_name.trim()) {
      setError('İlan başlığı ve şirket adı zorunludur.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      language_requirements: form.language_requirements.filter(item => item.language?.trim()),
      min_experience_years: form.min_experience_years === '' ? null : Number(form.min_experience_years),
      max_experience_years: form.max_experience_years === '' ? null : Number(form.max_experience_years),
    };
    try {
      const saved = initialJob?.id ? await api.updateJob(initialJob.id, payload) : await api.createJob(payload);
      onSaved(saved);
    } catch (saveError) {
      setError(saveError.message || 'İş ilanı kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return <form onSubmit={submit} className="antigravity-card overflow-hidden">
    <div className="flex items-center justify-between border-b border-surface-200 px-6 py-5">
      <div><h2 className="text-xl font-bold text-gray-900">{initialJob?.id ? 'İş ilanını düzenle' : 'Yeni iş ilanı oluştur'}</h2><p className="mt-1 text-sm text-gray-500">Aday sıralamasında kullanılacak ölçülebilir kriterleri tanımlayın.</p></div>
      <button type="button" onClick={onCancel} className="rounded-lg p-2 text-gray-400 hover:bg-surface-100 hover:text-gray-700" title="Kapat"><X size={20} /></button>
    </div>
    <div className="space-y-8 p-6">
      {error && <div className="flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-600"><AlertCircle size={17} />{error}</div>}
      <section>
        <h3 className="job-section-title">İlan özeti</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field label="İlan başlığı"><input className="job-input" value={form.title} onChange={event => set('title', event.target.value)} placeholder="Bilgi Teknolojileri / IT Yöneticisi" /></Field>
          <Field label="Şirket"><input className="job-input" value={form.company_name} onChange={event => set('company_name', event.target.value)} placeholder="Şirket adı" /></Field>
          <Field label="Konum"><input className="job-input" value={form.location} onChange={event => set('location', event.target.value)} placeholder="Adana" /></Field>
          <Field label="Çalışma modeli"><select className="job-input" value={form.workplace_type} onChange={event => set('workplace_type', event.target.value)}><option>İş Yerinde</option><option>Hibrit</option><option>Uzaktan</option></select></Field>
          <Field label="Çalışma şekli"><select className="job-input" value={form.employment_type} onChange={event => set('employment_type', event.target.value)}><option>Tam Zamanlı</option><option>Yarı Zamanlı</option><option>Dönemsel</option><option>Stajyer</option></select></Field>
          <Field label="Seviye"><input className="job-input" value={form.seniority} onChange={event => set('seniority', event.target.value)} placeholder="Orta düzey yönetici" /></Field>
          <Field label="Departman"><input className="job-input" value={form.department} onChange={event => set('department', event.target.value)} placeholder="Bilgi Teknolojileri / IT" /></Field>
          <Field label="Şirket bağlantısı"><input className="job-input" value={form.company_url} onChange={event => set('company_url', event.target.value)} placeholder="https://..." /></Field>
          <Field label="İlan durumu"><select className="job-input" value={form.status} onChange={event => set('status', event.target.value)}><option value="draft">Taslak</option><option value="published">Yayında</option><option value="closed">Kapalı</option></select></Field>
        </div>
        <Field label="İş ilanı hakkında" className="mt-4"><textarea className="job-input resize-y" rows="4" value={form.about} onChange={event => set('about', event.target.value)} placeholder="Pozisyonun amacı ve kısa şirket tanımı..." /></Field>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Field label="Aranan nitelikler"><LinesField value={form.qualifications} onChange={value => set('qualifications', value)} placeholder="Her niteliği ayrı satıra yazın" rows={8} /></Field>
        <Field label="İş tanımı ve sorumluluklar"><LinesField value={form.responsibilities} onChange={value => set('responsibilities', value)} placeholder="Her sorumluluğu ayrı satıra yazın" rows={8} /></Field>
      </section>

      <section>
        <h3 className="job-section-title">Eşleştirme kriterleri</h3>
        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="Zorunlu yetkinlikler"><TagEditor value={form.required_skills} onChange={value => set('required_skills', value)} placeholder="Örn. C#, MSSQL, REST API" /></Field>
          <Field label="Tercih edilen yetkinlikler"><TagEditor value={form.preferred_skills} onChange={value => set('preferred_skills', value)} placeholder="Örn. VMware, CCNA" /></Field>
          <Field label="Uygun bölümler"><TagEditor value={form.education_departments} onChange={value => set('education_departments', value)} placeholder="Örn. Bilgisayar Mühendisliği" /></Field>
          <Field label="Tercih edilen sertifikalar"><TagEditor value={form.preferred_certifications} onChange={value => set('preferred_certifications', value)} placeholder="Örn. CCNP" /></Field>
          <Field label="Askerlik durumu"><TagEditor value={form.military_statuses} onChange={value => set('military_statuses', value)} placeholder="Örn. Yapıldı, Muaf" /></Field>
          <Field label="Ehliyet"><TagEditor value={form.driver_licenses} onChange={value => set('driver_licenses', value)} placeholder="Örn. B sınıfı" /></Field>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Field label="Minimum deneyim (yıl)"><input type="number" min="0" step="0.5" className="job-input" value={form.min_experience_years} onChange={event => set('min_experience_years', event.target.value)} /></Field>
          <Field label="Maksimum deneyim (yıl)"><input type="number" min="0" step="0.5" className="job-input" value={form.max_experience_years} onChange={event => set('max_experience_years', event.target.value)} /></Field>
          <Field label="Eğitim seviyesi"><input className="job-input" value={form.education_level} onChange={event => set('education_level', event.target.value)} /></Field>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between"><span className="job-label mb-0">Yabancı dil kriterleri</span><button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600" onClick={() => set('language_requirements', [...form.language_requirements, { language: '', level: 'B2' }])}><Plus size={15} /> Dil ekle</button></div>
          <div className="space-y-2">{form.language_requirements.map((language, index) => <div key={index} className="grid grid-cols-[1fr_140px_38px] gap-2"><input className="job-input" value={language.language || ''} placeholder="İngilizce" onChange={event => set('language_requirements', form.language_requirements.map((item, itemIndex) => itemIndex === index ? { ...item, language: event.target.value } : item))} /><select className="job-input" value={language.level || 'B2'} onChange={event => set('language_requirements', form.language_requirements.map((item, itemIndex) => itemIndex === index ? { ...item, level: event.target.value } : item))}>{['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => <option key={level}>{level}</option>)}</select><button type="button" className="rounded-lg text-gray-400 hover:bg-danger-50 hover:text-danger-500" onClick={() => set('language_requirements', form.language_requirements.filter((_, itemIndex) => itemIndex !== index))}><X size={17} className="mx-auto" /></button></div>)}</div>
        </div>
      </section>
    </div>
    <div className="flex justify-end gap-3 border-t border-surface-200 bg-surface-50 px-6 py-4"><button type="button" className="rounded-lg border border-surface-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-white" onClick={onCancel}>Vazgeç</button><button type="submit" className="antigravity-button flex items-center gap-2 px-6 py-2.5 disabled:opacity-50" disabled={saving}><Save size={17} />{saving ? 'Kaydediliyor' : 'İlanı kaydet'}</button></div>
  </form>;
}

function TemplateImportModal({ onClose, onParsed }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const parse = () => {
    const parsed = parseJobTemplate(text);
    if (!parsed.title.trim()) {
      setError('Metinde ilan başlığı bulunamadı.');
      return;
    }
    onParsed(parsed);
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" onClick={onClose}>
    <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl" onClick={event => event.stopPropagation()}>
      <div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-gray-900">Hazır şablondan ilan oluştur</h2><p className="mt-1 text-sm text-gray-500">Elindeki ilan metnini yapıştır; alanlar forma otomatik aktarılsın.</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-surface-100"><X size={20} /></button></div>
      <textarea value={text} onChange={event => { setText(event.target.value); setError(''); }} autoFocus rows={16} placeholder="Örn.\nPozisyon: Backend Developer\nŞirket: HRAI\nKonum: İstanbul\n\u0130ş ilanı hakkında\n...\nAranan Nitelikler\n- Python\n..." className="w-full resize-y rounded-xl border border-surface-200 bg-surface-50 p-4 text-sm leading-6 text-gray-700 outline-none focus:border-primary-400" />
      {error && <p className="mt-2 text-sm text-danger-600">{error}</p>}
      <div className="mt-4 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border border-surface-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-surface-50">Vazgeç</button><button type="button" onClick={parse} className="antigravity-button inline-flex items-center gap-2 px-5 py-2.5 text-sm"><FileText size={17} />Alanları doldur</button></div>
    </div>
  </div>;
}

function MatchResults({ response }) {
  const [savingReport, setSavingReport] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  if (!response?.results?.length) return null;
  const saveReport = async () => {
    setSavingReport(true);
    setSaveMessage('');
    try {
      const matchedCandidates = response.results.map(item => ({
        candidate_id: item.candidate.id,
        candidate_name: item.candidate.full_name,
        score: item.hybrid_score,
        final_score: item.hybrid_score,
        match_score: item.match_score,
        quality_score: item.quality_score,
        breakdown: item.score_breakdown,
        radar_scores: item.candidate.radar_scores || {},
        matched_requirements: item.matched_requirements,
        missing_requirements: item.missing_requirements,
        evaluation_summary: item.evaluation_summary,
      }));
      await api.saveReport({
        title: `${response.job.title} - Ilan Aday Esleśtirme Raporu`,
        position: response.job.title,
        filter_criteria: { job_id: response.job.id, job: response.job, run_id: response.run?.id },
        matched_candidates: matchedCandidates,
        ai_summary: response.run?.ai_summary || '',
      });
      setSaveMessage('Rapor kaydedildi.');
    } catch (saveError) {
      setSaveMessage(saveError.message || 'Rapor kaydedilemedi.');
    } finally {
      setSavingReport(false);
    }
  };
  return <section className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-gray-900">Aday sıralaması</h2><p className="mt-1 text-sm text-gray-500">İlana uyum %80, CV profil kalitesi %20 ağırlıkla nihai sırayı oluşturur.</p></div><div className="flex items-center gap-3"><span className={`text-sm ${saveMessage.includes('kaydedildi') ? 'text-success-600' : 'text-danger-600'}`}>{saveMessage}</span><button type="button" onClick={saveReport} disabled={savingReport} className="antigravity-button inline-flex items-center gap-2 px-4 py-2.5 text-sm disabled:opacity-50"><Save size={16} />{savingReport ? 'Kaydediliyor...' : 'Raporu kaydet'}</button></div></div>
    {response.results.map(result => <article key={result.candidate.id} className="job-result-card">
      <div className="flex items-start gap-4">
        <div className="rank-badge">{result.rank}</div>
        <div className="min-w-0 flex-1"><h3 className="text-lg font-bold text-gray-900 capitalize">{result.candidate.full_name}</h3><p className="mt-0.5 text-sm text-gray-500 capitalize">{result.candidate.profession || 'Pozisyon belirtilmemiş'} · {result.candidate.experience_years || 0} yıl</p></div>
        <div className="grid grid-cols-3 gap-5 text-right"><div><span className="score-caption">İlana uyum</span><strong className="score-value">%{Math.round(result.match_score)}</strong></div><div><span className="score-caption">Profil kalitesi</span><strong className="score-value">%{Math.round(result.quality_score)}</strong></div><div><span className="score-caption">Nihai skor</span><strong className="score-value text-primary-600">%{Math.round(result.hybrid_score)}</strong></div></div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2"><div><p className="mb-2 text-xs font-bold uppercase text-success-600">Karşılanan nitelikler</p><div className="flex flex-wrap gap-1.5">{result.matched_requirements.length ? result.matched_requirements.map((item, index) => <span key={`${item.label}-${index}`} className="requirement-ok"><Check size={12} />{item.label}</span>) : <span className="text-sm text-gray-400">Eşleşen açık kriter yok</span>}</div></div><div><p className="mb-2 text-xs font-bold uppercase text-danger-600">Eksik / teyit edilmeli</p><div className="flex flex-wrap gap-1.5">{result.missing_requirements.length ? result.missing_requirements.map((item, index) => <span key={`${item.label}-${index}`} className="requirement-missing"><X size={12} />{item.label}</span>) : <span className="text-sm text-success-600">Belirgin kriter eksiği yok</span>}</div></div></div>
      <p className="mt-4 rounded-lg bg-surface-50 px-4 py-3 text-sm leading-6 text-gray-600">{result.evaluation_summary}</p>
    </article>)}
  </section>;
}

export default function JobPostings({ defaultTab = 'list' }) {
  const [tab, setTab] = useState(defaultTab);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formJob, setFormJob] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [matchResponse, setMatchResponse] = useState(null);
  const [matchingExisting, setMatchingExisting] = useState(false);
  const [candidateSource, setCandidateSource] = useState('upload');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const candidates = useStore(state => state.candidates);

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await api.getJobs();
      setJobs(Array.isArray(data) ? data : []);
      if (!selectedJobId && data?.[0]) setSelectedJobId(data[0].id);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'İş ilanları yüklenemedi.');
    } finally { setLoading(false); }
  };
  useEffect(() => { loadJobs(); }, []);

  const filteredJobs = useMemo(() => jobs.filter(job => `${job.title} ${job.company_name} ${job.department}`.toLowerCase().includes(search.toLowerCase())), [jobs, search]);
  const filteredCandidates = useMemo(() => {
    const query = candidateSearch.trim().toLocaleLowerCase('tr-TR');
    if (!query) return candidates;
    return candidates.filter(candidate => [
      candidate.full_name,
      candidate.profession,
      candidate.university,
      candidate.department,
      ...(candidate.skills || []),
    ].filter(Boolean).join(' ').toLocaleLowerCase('tr-TR').includes(query));
  }, [candidateSearch, candidates]);
  const selectedJob = jobs.find(job => job.id === selectedJobId);
  const deleteJob = async (job) => {
    if (!window.confirm(`“${job.title}” ilanı silinsin mi?`)) return;
    try { await api.deleteJob(job.id); await loadJobs(); } catch (deleteError) { setError(deleteError.message); }
  };
  const toggleCandidate = (candidateId) => {
    setSelectedCandidateIds(current => current.includes(candidateId)
      ? current.filter(id => id !== candidateId)
      : [...current, candidateId]);
  };
  const toggleVisibleCandidates = () => {
    const visibleIds = filteredCandidates.map(candidate => candidate.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedCandidateIds.includes(id));
    setSelectedCandidateIds(current => allVisibleSelected
      ? current.filter(id => !visibleIds.includes(id))
      : [...new Set([...current, ...visibleIds])]);
  };
  const matchExisting = async () => {
    if (!selectedJobId || !selectedCandidateIds.length) return;
    setMatchingExisting(true); setError('');
    try { setMatchResponse(await api.matchJobCandidates(selectedJobId, selectedCandidateIds)); } catch (matchError) { setError(matchError.message); }
    finally { setMatchingExisting(false); }
  };

  if (showForm) return <div className="space-y-6 animate-fade-in"><JobForm initialJob={formJob} onCancel={() => { setShowForm(false); setFormJob(null); }} onSaved={async saved => { setShowForm(false); setFormJob(null); await loadJobs(); setSelectedJobId(saved.id); }} /></div>;

  return <div className="space-y-6 animate-fade-in">
    <div className="flex items-end justify-between gap-4"><div><h1 className="text-3xl font-bold text-gray-900">İş İlanları</h1><p className="mt-1 text-gray-500">İç ilan havuzunu yönetin, toplu CV’leri ilan kriterlerine göre sıralayın</p></div><button type="button" className="antigravity-button flex items-center gap-2 px-5 py-3" onClick={() => { setFormJob(null); setShowForm(true); }}><Plus size={18} />İş ilanı oluştur</button></div>
    <div className="border-b border-surface-200"><div className="flex gap-7"><button className={`job-tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}><BriefcaseBusiness size={17} />İlanlar</button><button className={`job-tab ${tab === 'match' ? 'active' : ''}`} onClick={() => setTab('match')}><Users size={17} />İlan-CV Eşleştirme</button></div></div>
    {error && <div className="flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-600"><AlertCircle size={17} />{error}</div>}

    <div className="flex justify-end"><button type="button" className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-100" onClick={() => setShowTemplateModal(true)}><FileText size={17} />{'Haz\u0131r \u015Fablondan olu\u015Ftur'}</button></div>
    {showTemplateModal && <TemplateImportModal onClose={() => setShowTemplateModal(false)} onParsed={parsed => { setShowTemplateModal(false); setFormJob(parsed); setShowForm(true); }} />}
    {tab === 'list' ? <>
      <div className="relative max-w-md"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="job-input pl-10" value={search} onChange={event => setSearch(event.target.value)} placeholder="İlan, şirket veya departman ara" /></div>
      {loading ? <p className="py-12 text-center text-gray-400">İlanlar yükleniyor...</p> : filteredJobs.length ? <div className="grid gap-4 lg:grid-cols-2">{filteredJobs.map(job => <article key={job.id} className="job-card">
        <div className="flex items-start gap-4"><div className="job-icon"><BriefcaseBusiness size={21} /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-gray-900">{job.title}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500"><Building2 size={14} />{job.company_name}</p></div><span className={`job-status job-status-${job.status}`}>{STATUS_LABELS[job.status]}</span></div><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">{job.location && <span className="inline-flex items-center gap-1"><MapPin size={13} />{job.location}</span>}{job.employment_type && <span className="inline-flex items-center gap-1"><Clock3 size={13} />{job.employment_type}</span>}{job.department && <span>{job.department}</span>}</div><div className="mt-4 flex flex-wrap gap-1.5">{(job.required_skills || []).slice(0, 6).map(skill => <span key={skill} className="job-skill">{skill}</span>)}{(job.required_skills || []).length > 6 && <span className="job-skill">+{job.required_skills.length - 6}</span>}</div></div></div>
        <div className="mt-5 flex items-center justify-between border-t border-surface-100 pt-4"><button className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600" onClick={() => { setSelectedJobId(job.id); setTab('match'); }}>Aday eşleştir <ChevronRight size={16} /></button><div className="flex gap-1"><button className="job-icon-button" title="Düzenle" onClick={() => { setFormJob(job); setShowForm(true); }}><Pencil size={16} /></button><button className="job-icon-button danger" title="Sil" onClick={() => deleteJob(job)}><Trash2 size={16} /></button></div></div>
      </article>)}</div> : <div className="empty-state"><BriefcaseBusiness size={28} /><p className="font-semibold">Henüz iş ilanı yok</p><span>İlk ilanı oluşturarak kriter bazlı eşleştirmeyi başlatın.</span></div>}
    </> : <>
      <section className="match-job-band">
        <div>
          <p className="job-label">Eşleştirilecek iş ilanı</p>
          <select className="job-input min-w-[320px]" value={selectedJobId} onChange={event => { setSelectedJobId(event.target.value); setMatchResponse(null); setSelectedCandidateIds([]); }}>
            <option value="">İlan seçin</option>
            {jobs.map(job => <option key={job.id} value={job.id}>{job.title} · {job.company_name}</option>)}
          </select>
        </div>
        {selectedJob && <div className="min-w-0 flex-1 border-l border-surface-200 pl-6"><p className="font-bold text-gray-900">{selectedJob.title}</p><p className="mt-1 text-sm text-gray-500">{selectedJob.company_name} · {(selectedJob.required_skills || []).length} zorunlu yetkinlik</p></div>}
        <button className="hrai-animated-button inline-flex min-w-[220px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50" onClick={() => selectedCandidateIds.length ? matchExisting() : setCandidateSource('saved')} disabled={!selectedJobId || matchingExisting}>
          {selectedCandidateIds.length ? <Sparkles size={16} /> : <Users size={16} />}{matchingExisting ? 'Eşleştiriliyor' : selectedCandidateIds.length ? `Seçilen adayları eşleştir (${selectedCandidateIds.length})` : 'Kayıtlı adaylardan seç'}
        </button>
      </section>
      {selectedJobId ? <section className="candidate-source-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="mode-segment candidate-source-switch" aria-label="Aday kaynağı">
            <button type="button" className={candidateSource === 'upload' ? 'active' : ''} onClick={() => setCandidateSource('upload')}><Upload size={15} />Yeni PDF yükle</button>
            <button type="button" className={candidateSource === 'saved' ? 'active' : ''} onClick={() => setCandidateSource('saved')}><Users size={15} />Kayıtlı CV’lerden seç</button>
          </div>
          <p className="text-sm font-semibold text-primary-600">{selectedCandidateIds.length} aday seçildi</p>
        </div>

        {candidateSource === 'upload' ? <BatchCandidateUploader
          key={selectedJobId}
          jobId={selectedJobId}
          autoMatch={false}
          actionLabel="Analiz et ve seçime ekle"
          onComplete={({ savedCandidates }) => setSelectedCandidateIds(current => [...new Set([...current, ...savedCandidates.map(candidate => candidate.id)])])}
        /> : <div className="candidate-picker">
          <div className="candidate-picker-toolbar">
            <div className="relative min-w-0 flex-1">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="job-input pl-10" value={candidateSearch} onChange={event => setCandidateSearch(event.target.value)} placeholder="İsim, pozisyon, üniversite veya yetkinlik ara" />
            </div>
            <button type="button" className="candidate-select-all" onClick={toggleVisibleCandidates}>
              {filteredCandidates.length > 0 && filteredCandidates.every(candidate => selectedCandidateIds.includes(candidate.id)) ? 'Görünenleri temizle' : 'Görünenlerin tümünü seç'}
            </button>
          </div>
          {filteredCandidates.length ? <div className="candidate-picker-grid">{filteredCandidates.map(candidate => {
            const selected = selectedCandidateIds.includes(candidate.id);
            return <button type="button" key={candidate.id} className={`candidate-pick-card ${selected ? 'selected' : ''}`} aria-pressed={selected} onClick={() => toggleCandidate(candidate.id)}>
              <span className="candidate-pick-check">{selected && <Check size={14} />}</span>
              <span className="candidate-pick-name">{candidate.full_name}</span>
              <span className="candidate-pick-role">{candidate.profession || 'Pozisyon belirtilmemiş'}</span>
            </button>;
          })}</div> : <div className="candidate-picker-empty">Aramanızla eşleşen kayıtlı CV bulunamadı.</div>}
        </div>}
      </section> : <div className="empty-state"><Users size={28} /><p className="font-semibold">Önce bir iş ilanı seçin</p><span>CV seçim alanı ilan seçildikten sonra açılır.</span></div>}
      <MatchResults response={matchResponse} />
    </>}
  </div>;
}

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api/api';
import { Upload, FileText, Sparkles, Save, X, CheckCircle, Briefcase, GraduationCap, Globe, Code, FolderGit2, MapPin, Link2, GitFork, ExternalLink, Award, Building2, ShieldCheck } from 'lucide-react';
import BatchCandidateUploader from '../components/BatchCandidateUploader';

function capitalize(str) {
  if (!str) return '';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function safeUrl(url) {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export default function AnalyzeUpload() {
  const { analyzedCV, setAnalyzedCV, addCandidate, updateCandidate } = useStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMode, setUploadMode] = useState('single');

  const handleDemoAnalyze = () => {
    setIsAnalyzing(true);
    setSaved(false);
    setTimeout(() => {
      setAnalyzedCV({
        full_name: 'ahmet yılmaz',
        email: 'ahmet.yilmaz@email.com',
        phone: '+90 555 123 4567',
        profession: 'backend developer',
        department: 'bilgisayar mühendisliği',
        university: 'odtü',
        location: 'ankara, türkiye',
        experience_years: 4,
        linkedin_url: 'https://linkedin.com/in/ahmetyilmaz',
        github_url: 'https://github.com/ahmetyilmaz',
        portfolio_url: 'https://ahmetyilmaz.dev',
        skills: ['python', 'java', 'fastapi', 'docker', 'postgresql', 'git', 'redis', 'kubernetes'],
        languages: [
          { language: 'türkçe', level: 'c2' },
          { language: 'ingilizce', level: 'b2' },
          { language: 'almanca', level: 'a2' }
        ],
        certifications: [
          { name: 'AWS Certified Developer', issuer: 'Amazon Web Services', year: '2025' },
          { name: 'Professional Scrum Master I', issuer: 'Scrum.org', year: '2024' }
        ],
        projects: [
          { title: 'e-ticaret microservices api', description: 'Yüksek trafikli e-ticaret platformu için microservices mimarisi ile API geliştirme.', technologies: ['python', 'fastapi', 'docker', 'kubernetes'] },
          { title: 'cloud monitoring dashboard', description: 'AWS altyapısı için gerçek zamanlı monitoring ve alerting sistemi.', technologies: ['python', 'aws', 'grafana', 'prometheus'] },
          { title: 'chat uygulaması backend', description: 'WebSocket tabanlı gerçek zamanlı mesajlaşma uygulaması.', technologies: ['java', 'spring boot', 'redis', 'websocket'] }
        ],
        ai_summary: 'Güçlü backend geliştirme deneyimine sahip, microservices mimarisinde uzmanlaşmış bir yazılım mühendisi. Docker/Kubernetes ile containerization ve cloud deployment konularında tecrübeli. Python ve Java ekosistemlerinde aktif.',
        raw_cv_text: 'Demo CV metni...',
        original_filename: 'ahmet_yilmaz_cv.pdf'
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleFileUploadLegacy = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setIsAnalyzing(true);
      setSaved(false);
      setError('');
      api.uploadCV(file)
        .then(data => {
          if (data?.error) throw new Error(data.error);
          setAnalyzedCV(data);
        })
        .catch(() => setError('PDF analiz edilemedi. Backend ve API anahtarlarını kontrol edin.'))
        .finally(() => setIsAnalyzing(false));
    }
  };

  const selectPDF = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Lütfen yalnızca PDF dosyası yükleyin.');
      return;
    }
    setSelectedFile(file);
    setUploadProgress(0);
    setError('');
    setSaved(false);
  };

  const handleFileUpload = (e) => {
    selectPDF(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    selectPDF(e.dataTransfer.files?.[0]);
  };

  const handleRealAnalyze = () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setSaved(false);
    setError('');
    setUploadProgress(0);
    api.uploadCV(selectedFile, setUploadProgress)
      .then(data => {
        if (!data || data.error) throw new Error(data?.error || 'PDF analiz sonucu boş döndü.');
        setAnalyzedCV(data);
        setSelectedFile(null);
      })
      .catch((uploadError) => setError(uploadError.message || 'PDF analiz edilemedi.'))
      .finally(() => setIsAnalyzing(false));
  };

  const handleSave = async () => {
    if (analyzedCV) {
      try {
        setError('');
        const savedCandidate = await api.saveCandidate(analyzedCV);
        if (savedCandidate.save_action === 'updated') updateCandidate(savedCandidate.id, savedCandidate);
        else addCandidate(savedCandidate);
        setAnalyzedCV(savedCandidate);
        setSaved(true);
      } catch (saveError) {
        setError(saveError.message || 'CV veritabanına kaydedilemedi.');
      }
    }
  };

  const handleClear = () => {
    setAnalyzedCV(null);
    setSaved(false);
  };

  if (uploadMode === 'batch') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analiz & Kayıt</h1>
            <p className="mt-1 text-gray-500">PDF CV’leri analiz edin ve güvenli biçimde kaydedin</p>
          </div>
          <div className="mode-segment" role="tablist" aria-label="Yükleme modu">
            <button type="button" onClick={() => setUploadMode('single')}>Tek CV</button>
            <button type="button" className="active" aria-selected="true">Toplu CV</button>
          </div>
        </div>
        <BatchCandidateUploader />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analiz & Kayıt</h1>
          <p className="text-gray-500 mt-1">PDF CV yükleyin, AI otomatik analiz etsin</p>
        </div>
        <div className="mode-segment" role="tablist" aria-label="Yükleme modu">
          <button type="button" className="active" aria-selected="true">Tek CV</button>
          <button type="button" onClick={() => setUploadMode('batch')}>Toplu CV</button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-600 text-sm">
          {error}
        </div>
      )}

      {/* Upload Area */}
      {!analyzedCV && (
        <div
          className={`antigravity-card p-12 text-center transition-colors ${isDragActive ? 'border-primary-400 bg-primary-50/50' : ''}`}
          onDragEnter={(e) => { e.preventDefault(); setIsDragActive(true); }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center ring-4 ring-primary-100">
              <Upload className="w-8 h-8 text-primary-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">CV PDF Yükleyin</h2>
              <p className="text-sm text-gray-400 mt-2">
                NVIDIA Nemotron Parse + Gemini 3.5 Flash ile CV otomatik analiz edilir.
              </p>
              <p className="text-sm text-gray-400">
                Yetkinlikler, diller, projeler ve semantik özet çıkarılır.
              </p>
            </div>

            <div className="flex gap-3 mt-4">
              <label className="px-6 py-2.5 rounded-xl font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 cursor-pointer flex items-center gap-2">
                <Upload className="w-4 h-4" />
                PDF seç / sürükle bırak
                <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileUpload} />
              </label>
              <button
                onClick={handleRealAnalyze}
                disabled={!selectedFile || isAnalyzing}
                className="antigravity-button hrai-animated-button flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isAnalyzing ? 'HRAI analiz ediyor...' : 'HRAI PDF analiz'}
              </button>
              <button
                onClick={handleDemoAnalyze}
                disabled={isAnalyzing}
                className="px-6 py-2.5 rounded-xl font-semibold text-white bg-primary-500 hover:bg-primary-600 shadow-lg shadow-primary-500/25 transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isAnalyzing ? 'Analiz Ediliyor...' : 'Demo CV Analiz Et'}
              </button>
            </div>

            {selectedFile && <p className="text-sm text-primary-600 mt-3 truncate" title={selectedFile.name}>Seçilen dosya: {selectedFile.name}</p>}
            {isAnalyzing && <div className="max-w-md mx-auto mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500"><span>{uploadProgress < 100 ? 'PDF yükleniyor...' : 'NVIDIA OCR ve Gemini işliyor...'}</span><span>%{uploadProgress}</span></div>
              <div className="h-2 rounded-full bg-surface-100 overflow-hidden"><div className="h-full rounded-full bg-primary-500 transition-all duration-200" style={{ width: `${Math.max(uploadProgress, 4)}%` }} /></div>
            </div>}

            <p className="text-xs text-gray-300 mt-2">
              Demo modunda örnek bir CV otomatik yüklenir. API anahtarı eklenince gerçek OCR çalışır.
            </p>
          </div>

          {/* Loading Animation */}
          {isAnalyzing && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-accent-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm text-gray-400">AI analiz ediyor...</span>
            </div>
          )}
        </div>
      )}

      {/* Analyzed CV Card */}
      {analyzedCV && (
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success-500" />
              CV Analiz Sonucu
            </h2>
            <button onClick={handleClear} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="antigravity-card p-6 space-y-6">
            {/* Name & Basic Info */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold gradient-text">{capitalize(analyzedCV.full_name)}</h3>
                <p className="text-gray-500 mt-1 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {capitalize(analyzedCV.profession)}
                </p>
                {analyzedCV.department && <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                  <Building2 className="w-4 h-4" />
                  {capitalize(analyzedCV.department)}
                </p>}
                <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                  <GraduationCap className="w-4 h-4" />
                  {capitalize(analyzedCV.university)} • {analyzedCV.experience_years} yıl deneyim
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <FileText className="w-4 h-4" />
                {analyzedCV.original_filename}
              </div>
            </div>

            {analyzedCV.analysis_meta?.pipeline_status === 'success' && (
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-success-200 bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-600">
                  <ShieldCheck className="h-3.5 w-3.5" /> NVIDIA OCR doğrulandı
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-success-200 bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-600">
                  <ShieldCheck className="h-3.5 w-3.5" /> Gemini 3.5 Flash doğrulandı
                </span>
              </div>
            )}

            {/* Contact */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
              {analyzedCV.email && <span>📧 {analyzedCV.email}</span>}
              {analyzedCV.phone && <span>📱 {analyzedCV.phone}</span>}
              {analyzedCV.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{capitalize(analyzedCV.location)}</span>}
              {analyzedCV.linkedin_url && <a href={safeUrl(analyzedCV.linkedin_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"><Link2 className="h-4 w-4" />LinkedIn</a>}
              {analyzedCV.github_url && <a href={safeUrl(analyzedCV.github_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"><GitFork className="h-4 w-4" />GitHub</a>}
              {analyzedCV.portfolio_url && <a href={safeUrl(analyzedCV.portfolio_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"><ExternalLink className="h-4 w-4" />Portföy</a>}
            </div>

            {/* Skills */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Code className="w-4 h-4 text-primary-500" />
                Yetkinlikler
              </h4>
              <div className="flex flex-wrap gap-2">
                {(analyzedCV.skills || []).map(skill => (
                  <span key={skill} className="pill pill-blue">{skill}</span>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-language-500" />
                Diller
              </h4>
              <div className="flex flex-wrap gap-2">
                {(analyzedCV.languages || []).map(lang => (
                  <span key={lang.language} className="pill pill-purple">
                    {capitalize(lang.language)}{lang.level ? ` — ${lang.level.toUpperCase()}` : ''}
                  </span>
                ))}
              </div>
            </div>

            {(analyzedCV.certifications || []).length > 0 && <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Award className="h-4 w-4 text-warning-500" /> Sertifikalar
              </h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {analyzedCV.certifications.map((certificate, idx) => (
                  <div key={`${certificate.name}-${idx}`} className="rounded-xl border border-surface-200 bg-surface-50 p-3">
                    <p className="text-sm font-semibold text-gray-800">{certificate.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{[certificate.issuer, certificate.year].filter(Boolean).join(' • ')}</p>
                  </div>
                ))}
              </div>
            </div>}

            {/* Projects */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-success-500" />
                Projeler
              </h4>
              <div className="space-y-3">
                {(analyzedCV.projects || []).map((project, idx) => (
                  <div key={idx} className="p-4 bg-surface-50 rounded-xl border border-surface-200">
                    <h5 className="font-semibold text-gray-800">{capitalize(project.title)}</h5>
                    <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(Array.isArray(project.technologies) ? project.technologies : []).map(tech => (
                        <span key={tech} className="text-xs px-2 py-0.5 rounded-md bg-primary-50 text-primary-600 font-medium">{tech}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Summary */}
            <div className="p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl border border-primary-100">
              <h4 className="text-sm font-semibold text-primary-700 mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Semantik Özet
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">{analyzedCV.ai_summary}</p>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              {!saved ? (
                <button
                  onClick={handleSave}
                  className="w-full antigravity-button py-4 text-lg flex items-center justify-center gap-3"
                >
                  <Save className="w-5 h-5" />
                  Veritabanına Kaydet
                </button>
              ) : (
                <div className="w-full py-4 rounded-xl bg-success-50 text-success-600 font-semibold text-center flex items-center justify-center gap-2 border border-success-200">
                  <CheckCircle className="w-5 h-5" />
                  Veritabanına Kaydedildi!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

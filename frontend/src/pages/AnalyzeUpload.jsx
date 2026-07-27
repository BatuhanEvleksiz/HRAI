import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api/api';
import { Upload, FileText, Sparkles, Save, X, CheckCircle, Briefcase, GraduationCap, Globe, Code, FolderGit2 } from 'lucide-react';

function capitalize(str) {
  if (!str) return '';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function AnalyzeUpload() {
  const { analyzedCV, setAnalyzedCV, addCandidate } = useStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDemoAnalyze = () => {
    setIsAnalyzing(true);
    setSaved(false);
    setTimeout(() => {
      setAnalyzedCV({
        full_name: 'ahmet yılmaz',
        email: 'ahmet.yilmaz@email.com',
        phone: '+90 555 123 4567',
        profession: 'backend developer',
        university: 'odtü',
        experience_years: 4,
        skills: ['python', 'java', 'fastapi', 'docker', 'postgresql', 'git', 'redis', 'kubernetes'],
        languages: [
          { language: 'türkçe', level: 'c2' },
          { language: 'ingilizce', level: 'b2' },
          { language: 'almanca', level: 'a2' }
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
        addCandidate(savedCandidate);
        setAnalyzedCV(savedCandidate);
        setSaved(true);
      } catch {
        setError('CV veritabanına kaydedilemedi. Supabase bağlantısını kontrol edin.');
      }
    }
  };

  const handleClear = () => {
    setAnalyzedCV(null);
    setSaved(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analiz & Kayıt</h1>
        <p className="text-gray-500 mt-1">PDF CV yükleyin, AI otomatik analiz etsin</p>
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
                NVIDIA NeMo OCR + Gemini 1.5 Flash ile CV otomatik analiz edilir.
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
                className="antigravity-button flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isAnalyzing ? 'API analiz ediyor...' : 'PDF\'yi API ile analiz et'}
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
              <div className="flex justify-between text-xs text-gray-500"><span>{uploadProgress < 100 ? 'PDF yükleniyor...' : 'Gemini PDF içeriğini analiz ediyor...'}</span><span>%{uploadProgress}</span></div>
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

            {/* Contact */}
            <div className="flex gap-4 text-sm text-gray-500">
              <span>📧 {analyzedCV.email}</span>
              <span>📱 {analyzedCV.phone}</span>
            </div>

            {/* Skills */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Code className="w-4 h-4 text-primary-500" />
                Yetkinlikler
              </h4>
              <div className="flex flex-wrap gap-2">
                {analyzedCV.skills.map(skill => (
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
                {analyzedCV.languages.map(lang => (
                  <span key={lang.language} className="pill pill-purple">
                    {capitalize(lang.language)} — {lang.level.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-success-500" />
                Projeler
              </h4>
              <div className="space-y-3">
                {analyzedCV.projects.map((project, idx) => (
                  <div key={idx} className="p-4 bg-surface-50 rounded-xl border border-surface-200">
                    <h5 className="font-semibold text-gray-800">{capitalize(project.title)}</h5>
                    <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {project.technologies.map(tech => (
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

import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api/api';
import { Settings, Save, RotateCcw, CheckCircle, AlertCircle, Key, Palette, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { DEFAULT_WEIGHTS, WEIGHT_CONFIG } from '../constants/scoringWeights';

export default function SettingsPage() {
  const { weights, setWeights } = useStore();
  const [theme, setTheme] = useState(() => localStorage.getItem('ikai-theme') || 'blue');
  const [localWeights, setLocalWeights] = useState({ ...weights });
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [companyLogo, setCompanyLogo] = useState(() => localStorage.getItem('ikai-company-logo') || '');
  const [logoDraft, setLogoDraft] = useState(() => localStorage.getItem('ikai-company-logo') || '');
  const [logoSaved, setLogoSaved] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [apiStatus, setApiStatus] = useState(null);
  const [apiStatusLoading, setApiStatusLoading] = useState(false);
  const [apiStatusError, setApiStatusError] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('theme-pink', theme === 'pink');
    localStorage.setItem('ikai-theme', theme);
  }, [theme]);

  useEffect(() => {
    setLocalWeights({ ...weights });
  }, [weights]);

  useEffect(() => {
    api.getApiStatus().then(setApiStatus).catch(() => setApiStatusError('API durumları alınamadı.'));
  }, []);

  const testApiStatus = async () => {
    setApiStatusLoading(true);
    setApiStatusError('');
    try { setApiStatus(await api.getApiStatus(true)); }
    catch (error) { setApiStatusError(error.message || 'Bağlantı testi başarısız.'); }
    finally { setApiStatusLoading(false); }
  };

  const statusLabel = (service) => {
    if (!service) return 'Kontrol ediliyor';
    if (service.state === 'connected') return 'Bağlı';
    if (service.state === 'unreachable') return 'Erişilemiyor';
    if (service.state === 'missing') return 'Eksik';
    return 'Yapılandırıldı';
  };

  const statusClass = (service) => service?.state === 'connected' ? 'pill pill-green' : service?.state === 'unreachable' || service?.state === 'missing' ? 'pill pill-red' : 'pill pill-yellow';

  const total = Object.values(localWeights).reduce((a, b) => a + b, 0);
  const isValid = total === 100;

  const handleChange = (key, value) => {
    const num = Math.max(0, Math.min(100, parseInt(value) || 0));
    setLocalWeights({ ...localWeights, [key]: num });
    setSaved(false);
  };

  const handleSliderChange = (key, value) => {
    setLocalWeights({ ...localWeights, [key]: parseInt(value) });
    setSaved(false);
  };

  const handleSave = async () => {
    if (isValid) {
      setSaveError('');
      try {
        const persisted = await api.updateWeights(localWeights);
        setWeights(persisted);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (error) {
        setSaveError(error.message || 'Ağırlıklar kaydedilemedi.');
      }
    }
  };

  const handleReset = () => {
    setLocalWeights({ ...DEFAULT_WEIGHTS });
    setSaved(false);
  };

  const handleLogoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoError('');
    setLogoSaved(false);

    if (!file.type.startsWith('image/')) {
      setLogoError('Lütfen PNG, JPG, WEBP veya SVG formatında bir görsel seçin.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 512;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        setLogoDraft(canvas.toDataURL('image/png'));
      };
      image.onerror = () => setLogoError('Logo okunamadı. Başka bir görsel deneyin.');
      image.src = reader.result;
    };
    reader.onerror = () => setLogoError('Logo okunamadı. Başka bir görsel deneyin.');
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleLogoSave = () => {
    if (!logoDraft) {
      localStorage.removeItem('ikai-company-logo');
    } else {
      localStorage.setItem('ikai-company-logo', logoDraft);
    }
    setCompanyLogo(logoDraft);
    window.dispatchEvent(new Event('company-logo-updated'));
    setLogoSaved(true);
    setTimeout(() => setLogoSaved(false), 3000);
  };

  const handleLogoRemove = () => {
    setLogoDraft('');
    setLogoError('');
    setLogoSaved(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-500 mt-1">Dinamik puanlama motoru ağırlıkları</p>
      </div>

      <div className="antigravity-card-static p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-primary-500" />
          <div>
            <h2 className="text-lg font-bold text-gray-800">Tema Rengi</h2>
            <p className="text-xs text-gray-400 mt-0.5">Mavi ve lila tema arasında geçiş yapın.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 max-w-md">
          <span className="text-sm font-semibold text-primary-600">Mavi</span>
          <button
            type="button"
            role="switch"
            aria-checked={theme === 'pink'}
            aria-label="Mavi ve lila tema arasında geçiş yap"
            onClick={() => setTheme(theme === 'pink' ? 'blue' : 'pink')}
            className="relative h-10 flex-1 min-w-[180px] rounded-full bg-gradient-to-r from-primary-500 via-accent-600 to-accent-500 p-1 shadow-inner"
          >
            <span className={`absolute top-1 h-8 w-8 rounded-full bg-white shadow-md transition-all duration-300 ${theme === 'pink' ? 'right-1' : 'left-1'}`} />
          </button>
          <span className="text-sm font-semibold text-accent-600">Lila</span>
        </div>
      </div>

      {/* Company Logo */}
      <div className="antigravity-card-static p-6 space-y-5">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary-500" />
          <div>
            <h2 className="text-lg font-bold text-gray-800">Şirket Logosu</h2>
            <p className="text-xs text-gray-400 mt-0.5">Sol menüde görünecek şirket logosunu yükleyin.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <div className="w-20 h-20 rounded-2xl border border-surface-200 bg-surface-50 flex items-center justify-center overflow-hidden shrink-0">
            {logoDraft ? (
              <img src={logoDraft} alt="Şirket logosu önizlemesi" className="w-full h-full object-contain p-2" />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-300" />
            )}
          </div>
          <div className="flex-1 min-w-[220px] space-y-2">
            <div className="flex flex-wrap gap-2">
              <label className="antigravity-button inline-flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                Logo seç
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogoSelect} className="sr-only" />
              </label>
              {logoDraft && (
                <button type="button" onClick={handleLogoRemove} className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-surface-100 hover:bg-surface-200 transition-colors inline-flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Kaldır
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400">PNG, JPG veya WEBP. En fazla 512 px olarak optimize edilir.</p>
            {logoError && <p className="text-sm text-danger-600">{logoError}</p>}
          </div>
        </div>
        <div className="pt-4 border-t border-surface-100 flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400">Bu cihazdaki oturumlarda korunur.</span>
          <button type="button" onClick={handleLogoSave} className={`antigravity-button flex items-center gap-2 ${logoSaved ? 'from-success-500 to-success-400' : ''}`}>
            {logoSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {logoSaved ? 'Logo kaydedildi!' : 'Logo kaydet'}
          </button>
        </div>
      </div>

      {/* Scoring Weights */}
      <div className="antigravity-card-static p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-bold text-gray-800">Skorlama Ağırlıkları</h2>
        </div>

        {/* Total Weight Indicator */}
        <div className="flex items-center justify-between p-4 bg-surface-50 rounded-xl border border-surface-200">
          <div>
            <p className="font-semibold text-gray-700">Toplam Ağırlık</p>
            <p className="text-xs text-gray-400 mt-0.5">Herhangi bir ağırlık %0 yapılabilir. Örn: 5 beceri seçildiyse, her beceri (ağırlık / 5) puan değerindedir.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-3xl font-extrabold ${isValid ? 'text-success-500' : 'text-danger-500'}`}>
              {total}%
            </span>
            {isValid ? (
              <CheckCircle className="w-6 h-6 text-success-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-danger-500" />
            )}
          </div>
        </div>

        {!isValid && (
          <div className="p-3 bg-danger-50 rounded-xl border border-danger-200 text-sm text-danger-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Toplam ağırlık %100 olmalıdır. Şu an: %{total} ({total > 100 ? `${total - 100} fazla` : `${100 - total} eksik`})
          </div>
        )}
        {saveError && <p className="text-sm text-danger-600">{saveError}</p>}

        {/* Weight Sliders */}
        <div className="space-y-6">
          {WEIGHT_CONFIG.map(({ key, label, color, soft }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} /> {label}
                </label>
                <span className="text-sm font-bold" style={{ color }}>{localWeights[key]}%</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: soft }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${localWeights[key]}%`, backgroundColor: color }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={localWeights[key]}
                    onChange={(e) => handleSliderChange(key, e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {/* Slider thumb visual indicator */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 shadow-md transition-all duration-300 pointer-events-none"
                    style={{ left: `calc(${localWeights[key]}% - 8px)`, borderColor: color }}
                  />
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={localWeights[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-16 px-2 py-1.5 rounded-lg bg-surface-50 border border-surface-200 text-center text-sm font-medium outline-none focus:border-primary-400"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-surface-100">
          <button
            onClick={handleReset}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-surface-100 hover:bg-surface-200 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Varsayılana Dön
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className={`antigravity-button flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${saved ? 'from-success-500 to-success-400' : ''}`}
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Kaydedildi!' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* API Configuration */}
      <div className="antigravity-card-static p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">API Yapılandırması</h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-400">Anahtarlar backend ortam değişkenlerinden okunur; değerler bu ekranda gösterilmez.</p>
          <button type="button" onClick={testApiStatus} disabled={apiStatusLoading} className="antigravity-button text-xs disabled:opacity-60">
            {apiStatusLoading ? 'Kontrol ediliyor...' : 'Bağlantıları test et'}
          </button>
        </div>
        {apiStatusError && <p className="text-xs text-red-500">{apiStatusError}</p>}

        <div className="space-y-3">
          {[
            { name: 'NVIDIA NeMo (OCR)', description: 'PDF\'den metin çıkarma', key: 'NVIDIA_API_KEY' },
            { name: 'Gemini 1.5 Flash (AI)', description: 'Semantik analiz ve chatbot', key: 'GEMINI_API_KEY' },
            { name: 'Supabase (Veritabanı)', description: 'PostgreSQL veritabanı', key: 'SUPABASE_URL' },
          ].map(service => (
            <div key={service.key} className="flex items-center justify-between p-4 bg-surface-50 rounded-xl border border-surface-200">
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{service.name}</p>
                  <p className="text-xs text-gray-400">{service.description}</p>
                  {apiStatus?.[{ 'NVIDIA_API_KEY': 'nvidia', 'GEMINI_API_KEY': 'gemini', 'SUPABASE_URL': 'supabase' }[service.key]]?.error && <p className="mt-1 max-w-xl text-xs text-red-500">{apiStatus[{ 'NVIDIA_API_KEY': 'nvidia', 'GEMINI_API_KEY': 'gemini', 'SUPABASE_URL': 'supabase' }[service.key]].error}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={statusClass(apiStatus?.[{ 'NVIDIA_API_KEY': 'nvidia', 'GEMINI_API_KEY': 'gemini', 'SUPABASE_URL': 'supabase' }[service.key]])}>{statusLabel(apiStatus?.[{ 'NVIDIA_API_KEY': 'nvidia', 'GEMINI_API_KEY': 'gemini', 'SUPABASE_URL': 'supabase' }[service.key]])}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

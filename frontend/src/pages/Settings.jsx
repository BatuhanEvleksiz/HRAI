import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Settings, Save, RotateCcw, CheckCircle, AlertCircle, Key, Palette } from 'lucide-react';

const WEIGHT_CONFIG = [
  { key: 'skill_weight', label: 'Beceri/Yetkinlik', icon: '🔧', gradient: 'from-primary-500 to-primary-400' },
  { key: 'project_weight', label: 'Proje/Deneyim', icon: '📁', gradient: 'from-yellow-500 to-orange-500' },
  { key: 'llm_summary_weight', label: 'İK LLM Semantik Özeti', icon: '🍬', gradient: 'from-primary-500 to-accent-500' },
  { key: 'university_weight', label: 'Üniversite', icon: '🎓', gradient: 'from-blue-400 to-cyan-500' },
  { key: 'language_weight', label: 'Dil Seviyesi', icon: '🌐', gradient: 'from-green-500 to-teal-500' },
];

const DEFAULTS = { skill_weight: 40, project_weight: 20, llm_summary_weight: 20, university_weight: 10, language_weight: 10 };

export default function SettingsPage() {
  const { weights, setWeights } = useStore();
  const [theme, setTheme] = useState(() => localStorage.getItem('ikai-theme') || 'blue');
  const [localWeights, setLocalWeights] = useState({ ...weights });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('theme-pink', theme === 'pink');
    localStorage.setItem('ikai-theme', theme);
  }, [theme]);

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

  const handleSave = () => {
    if (isValid) {
      setWeights(localWeights);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleReset = () => {
    setLocalWeights({ ...DEFAULTS });
    setSaved(false);
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

        {/* Weight Sliders */}
        <div className="space-y-6">
          {WEIGHT_CONFIG.map(({ key, label, icon, gradient }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span>{icon}</span> {label}
                </label>
                <span className="text-sm font-bold text-gray-900">{localWeights[key]}%</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <div className="w-full h-2 bg-surface-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-300`}
                      style={{ width: `${localWeights[key]}%` }}
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
                    className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-primary-500 shadow-md transition-all duration-300 pointer-events-none`}
                    style={{ left: `calc(${localWeights[key]}% - 8px)` }}
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
        <p className="text-xs text-gray-400">API anahtarlarını backend <code>.env</code> dosyasından yapılandırın.</p>

        <div className="space-y-3">
          {[
            { name: 'NVIDIA NeMo (OCR)', description: 'PDF\'den metin çıkarma', key: 'NVIDIA_API_KEY' },
            { name: 'Gemini 1.5 Flash (AI)', description: 'Semantik analiz ve chatbot', key: 'GEMINI_API_KEY' },
            { name: 'Supabase (Veritabanı)', description: 'PostgreSQL veritabanı', key: 'SUPABASE_URL' },
          ].map(api => (
            <div key={api.key} className="flex items-center justify-between p-4 bg-surface-50 rounded-xl border border-surface-200">
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{api.name}</p>
                  <p className="text-xs text-gray-400">{api.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="pill pill-yellow">Demo Mod</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

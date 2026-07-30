export const WEIGHT_CONFIG = [
  { key: 'skill_weight', label: 'Beceri/Yetkinlik', color: '#1B4EF5', soft: '#DDE7FF' },
  { key: 'project_weight', label: 'Proje/Deneyim', color: '#F59E0B', soft: '#FEF3C7' },
  { key: 'llm_summary_weight', label: 'İK LLM Semantik Özeti', color: '#8E94F2', soft: '#EEEEFF' },
  { key: 'university_weight', label: 'Üniversite', color: '#06B6D4', soft: '#CFFAFE' },
  { key: 'language_weight', label: 'Dil Seviyesi', color: '#10B981', soft: '#D1FAE5' },
];

export const DEFAULT_WEIGHTS = {
  skill_weight: 40,
  project_weight: 20,
  llm_summary_weight: 20,
  university_weight: 10,
  language_weight: 10,
};

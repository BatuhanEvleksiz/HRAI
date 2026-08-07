import React, { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api/api';
import { Target, Search, Sparkles, X, ChevronDown, ChevronUp, Save, GraduationCap, Code, Globe, FolderGit2, Brain, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { WEIGHT_CONFIG } from '../constants/scoringWeights';

function capitalize(str) {
  if (!str) return '';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const AVAILABLE_SKILLS = [
  'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust', 'ruby', 'php',
  'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
  'react', 'vue.js', 'angular', 'next.js', 'svelte',
  'node.js', 'express', 'fastapi', 'django', 'flask', 'spring boot',
  'docker', 'kubernetes', 'aws', 'azure', 'gcp',
  'git', 'ci/cd', 'terraform', 'jenkins', 'linux',
  'html', 'css', 'tailwindcss', 'sass',
  'graphql', 'rest api', 'microservices', 'kafka', 'rabbitmq',
  'tensorflow', 'pytorch', 'scikit-learn', 'opencv', 'computer vision', 'nlp',
  'machine learning', 'deep learning', 'data analysis', 'data visualization',
  'power bi', 'tableau', 'excel', 'matlab', 'spss', 'r', 'spark', 'hadoop',
  'airflow', 'dbt', 'snowflake', 'databricks', 'bigquery',
  'autocad', 'revit', 'solidworks', 'catia', 'sap2000', 'etabs', 'staad.pro',
  'tekla structures', 'navisworks', 'civil 3d', 'archicad', 'sketchup',
  '3ds max', 'lumion', 'primavera p6', 'ms project', 'quantity surveying',
  'bim', 'structural analysis', 'project planning', 'site management',
  'erp', 'sap', 'microsoft dynamics', 'salesforce', 'sharepoint',
  'network security', 'firewall', 'vpn', 'routing', 'switching', 'ccna',
  'active directory', 'windows server', 'vmware', 'cybersecurity',
  'agile', 'scrum', 'kanban', 'devops', 'test automation', 'unit testing',
  'system design', 'software architecture', 'api integration', 'technical writing',
  'leadership', 'teamwork', 'communication', 'problem solving', 'time management'
];

const AVAILABLE_LANGUAGES = [
  { value: 'ingilizce', label: 'İngilizce', flag: '🇬🇧' },
  { value: 'almanca', label: 'Almanca', flag: '🇩🇪' },
  { value: 'fransızca', label: 'Fransızca', flag: '🇫🇷' },
  { value: 'ispanyolca', label: 'İspanyolca', flag: '🇪🇸' },
  { value: 'türkçe', label: 'Türkçe', flag: '🇹🇷' },
  { value: 'italyanca', label: 'İtalyanca', flag: '🇮🇹' },
  { value: 'arapça', label: 'Arapça', flag: '🇸🇦' },
  { value: 'rusça', label: 'Rusça', flag: '🇷🇺' },
];
const LANGUAGE_LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
const LEVEL_ORDER = { 'a1': 1, 'a2': 2, 'b1': 3, 'b2': 4, 'c1': 5, 'c2': 6 };

const AVAILABLE_UNIVERSITIES = [
  'odtü', 'boğaziçi üniversitesi', 'itü', 'hacettepe üniversitesi', 'ytü',
  'muğla sıtkı koçman üniversitesi', 'bilkent üniversitesi', 'koç üniversitesi',
  'sabancı üniversitesi', 'ege üniversitesi'
];

const WEIGHT_STYLE = Object.fromEntries(WEIGHT_CONFIG.map(item => [item.key, item]));

function InlineWeightSlider({ weightKey, weights, onChange }) {
  const config = WEIGHT_STYLE[weightKey];
  const value = Number(weights[weightKey] || 0);
  return (
    <div className="ml-auto flex min-w-[190px] items-center gap-2" aria-label={`${config.label} ağırlığı`}>
      <div className="relative h-2 flex-1 rounded-full" style={{ backgroundColor: config.soft }}>
        <div className="h-full rounded-full transition-all duration-200" style={{ width: `${value}%`, backgroundColor: config.color }} />
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={value}
          onChange={event => onChange(weightKey, event.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <span
          className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 bg-white shadow-sm transition-all duration-200"
          style={{ left: `calc(${value}% - 7px)`, borderColor: config.color }}
        />
      </div>
      <span className="w-10 text-right text-xs font-bold" style={{ color: config.color }}>%{value}</span>
    </div>
  );
}

function TagInput({ tags, setTags, placeholder }) {
  const [input, setInput] = useState('');
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim().toLowerCase())) {
        setTags([...tags, input.trim().toLowerCase()]);
      }
      setInput('');
    }
  };
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-surface-50 rounded-xl border border-surface-200 min-h-[44px]">
      {tags.map(tag => (
        <span key={tag} className="pill pill-blue flex items-center gap-1">
          {tag}
          <X className="w-3 h-3 cursor-pointer hover:text-danger-500" onClick={() => setTags(tags.filter(t => t !== tag))} />
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-gray-300"
      />
    </div>
  );
}

export default function MatchingEngine() {
  const { candidates, weights, setWeights, addReport, updateCandidate } = useStore();

  // Filter criteria
  const [position, setPosition] = useState('');
  const [requiredExperienceYears, setRequiredExperienceYears] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedUniversities, setSelectedUniversities] = useState([]);
  const [projectKeywords, setProjectKeywords] = useState([]);
  const [llmKeywords, setLlmKeywords] = useState([]);

  // Language selection
  const [langToAdd, setLangToAdd] = useState('');
  const [levelToAdd, setLevelToAdd] = useState('b2');
  const [languageSearch, setLanguageSearch] = useState('');
  const [languageOpen, setLanguageOpen] = useState(false);

  // Results
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [matchingMode, setMatchingMode] = useState(null);
  const [matchingError, setMatchingError] = useState('');
  const [expandedCard, setExpandedCard] = useState(null);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const totalWeight = Object.values(weights).reduce((sum, value) => sum + Number(value || 0), 0);
  const weightsValid = totalWeight === 100;

  const addLanguage = () => {
    if (!langToAdd) return;
    if (!selectedLanguages.find(l => l.language === langToAdd)) {
      setSelectedLanguages([...selectedLanguages, { language: langToAdd, level: levelToAdd }]);
    }
  };

  const removeLanguage = (lang) => {
    setSelectedLanguages(selectedLanguages.filter(l => l.language !== lang));
  };

  const languageOption = value => AVAILABLE_LANGUAGES.find(language => language.value === value);
  const visibleLanguages = AVAILABLE_LANGUAGES.filter(language =>
    language.label.toLocaleLowerCase('tr-TR').includes(languageSearch.trim().toLocaleLowerCase('tr-TR'))
  );

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const visibleSkills = AVAILABLE_SKILLS.filter(skill =>
    skill.toLocaleLowerCase('tr-TR').includes(skillSearch.trim().toLocaleLowerCase('tr-TR'))
  );

  const handleInlineWeightChange = (key, value) => {
    const nextValue = Math.max(0, Math.min(100, Number(value)));
    setWeights({ ...weights, [key]: nextValue });
  };

  const runDemoMatching = useCallback(() => {
    setIsSearching(true);
    setMatchingMode('demo');
    setMatchingError('');

    setTimeout(() => {
      const scored = candidates.map(candidate => {
        let totalScore = 0;
        const breakdown = {};
        const skillMatches = [];

        // Skill Score
        if (selectedSkills.length > 0 && weights.skill_weight > 0) {
          const perSkill = weights.skill_weight / selectedSkills.length;
          let skillScore = 0;
          selectedSkills.forEach(skill => {
            const hasSkill = candidate.skills.includes(skill.toLowerCase());
            skillMatches.push({ skill, matched: hasSkill });
            if (hasSkill) skillScore += perSkill;
          });
          breakdown.skill = { score: Math.round(skillScore), max: weights.skill_weight, matched: skillMatches.filter(s => s.matched).length, total: selectedSkills.length };
          totalScore += skillScore;
        } else {
          breakdown.skill = { score: 0, max: weights.skill_weight, matched: 0, total: 0 };
        }

        // Language Score
        if (selectedLanguages.length > 0 && weights.language_weight > 0) {
          const perLang = weights.language_weight / selectedLanguages.length;
          let langScore = 0;
          selectedLanguages.forEach(reqLang => {
            const candidateLang = candidate.languages.find(l => l.language === reqLang.language);
            if (candidateLang && LEVEL_ORDER[candidateLang.level] >= LEVEL_ORDER[reqLang.level]) {
              langScore += perLang;
            }
          });
          breakdown.language = { score: Math.round(langScore), max: weights.language_weight, matched: Math.round(langScore / perLang), total: selectedLanguages.length };
          totalScore += langScore;
        } else {
          breakdown.language = { score: 0, max: weights.language_weight, matched: 0, total: 0 };
        }

        // University Score
        if (selectedUniversities.length > 0 && weights.university_weight > 0) {
          const uniMatch = selectedUniversities.some(university => {
            const selected = university.toLowerCase();
            const candidateUniversity = candidate.university?.toLowerCase() || '';
            return candidateUniversity === selected || candidateUniversity.includes(selected) || selected.includes(candidateUniversity);
          });
          breakdown.university = { score: uniMatch ? weights.university_weight : 0, max: weights.university_weight, matched: uniMatch };
          totalScore += uniMatch ? weights.university_weight : 0;
        } else {
          breakdown.university = { score: 0, max: weights.university_weight, matched: false };
        }

        // Project Score
        if (projectKeywords.length > 0 && weights.project_weight > 0) {
          const perProject = weights.project_weight / projectKeywords.length;
          let projectScore = 0;
          projectKeywords.forEach(keyword => {
            const hasProject = candidate.projects.some(p =>
              p.title.toLowerCase().includes(keyword.toLowerCase()) ||
              p.description?.toLowerCase().includes(keyword.toLowerCase()) ||
              p.technologies.some(t => t.toLowerCase().includes(keyword.toLowerCase()))
            );
            if (hasProject) projectScore += perProject;
          });
          breakdown.project = { score: Math.round(projectScore), max: weights.project_weight, matched: Math.round(projectScore / perProject), total: projectKeywords.length };
          totalScore += projectScore;
        } else {
          breakdown.project = { score: 0, max: weights.project_weight, matched: 0, total: 0 };
        }

        // LLM Summary Score
        if (llmKeywords.length > 0 && weights.llm_summary_weight > 0) {
          const perKeyword = weights.llm_summary_weight / llmKeywords.length;
          let llmScore = 0;
          llmKeywords.forEach(keyword => {
            if (candidate.ai_summary?.toLowerCase().includes(keyword.toLowerCase())) {
              llmScore += perKeyword;
            }
          });
          breakdown.llm_summary = { score: Math.round(llmScore), max: weights.llm_summary_weight, matched: Math.round(llmScore / perKeyword), total: llmKeywords.length };
          totalScore += llmScore;
        } else {
          breakdown.llm_summary = { score: 0, max: weights.llm_summary_weight, matched: 0, total: 0 };
        }

        totalScore = Math.round(totalScore);

        // AI Comment
        let aiComment = '';
        if (totalScore >= 70) {
          aiComment = `${capitalize(candidate.full_name)} güçlü bir aday. `;
          if (breakdown.skill?.matched > 0) aiComment += `İstenen ${breakdown.skill.total} yetkinliğin ${breakdown.skill.matched} tanesine sahip. `;
          if (breakdown.project?.matched > 0) aiComment += `Proje deneyimi uyumlu. `;
          if (breakdown.university?.matched) aiComment += `İstenen üniversiteden mezun. `;
        } else if (totalScore >= 40) {
          aiComment = `${capitalize(candidate.full_name)} kısmi uyum gösteriyor. Bazı yetkinlik eksikleri mevcut ancak deneyim potansiyel taşıyor.`;
        } else {
          aiComment = `${capitalize(candidate.full_name)} pozisyon gereksinimleriyle düşük uyum gösteriyor. Farklı bir pozisyon değerlendirilebilir.`;
        }

        return {
          ...candidate,
          totalScore,
          breakdown,
          skillMatches,
          aiComment,
        };
      });

      scored.sort((a, b) => b.totalScore - a.totalScore);
      setResults(scored);
      setIsSearching(false);
    }, 1500);
  }, [candidates, selectedSkills, selectedLanguages, selectedUniversities, projectKeywords, llmKeywords, weights]);

  const normalizeApiResults = (data) => data.map(item => {
    const candidate = item.candidate || item;
    const raw = item.score_breakdown || {};
    const asBreakdown = (value, max) => {
      if (value && typeof value === 'object') {
        return { score: Number(value.score ?? 0), max: Number(value.max ?? max) };
      }
      return { score: Number(value ?? 0), max: Number(max) };
    };
    return {
      ...candidate,
      totalScore: Math.round(item.total_score ?? item.totalScore ?? 0),
      breakdown: {
        skill: asBreakdown(raw.skill ?? raw.skills, weights.skill_weight),
        project: asBreakdown(raw.project ?? raw.projects, weights.project_weight),
        llm_summary: asBreakdown(raw.llm_summary ?? raw.ai_summary, weights.llm_summary_weight),
        university: asBreakdown(raw.university, weights.university_weight),
        language: asBreakdown(raw.language ?? raw.languages, weights.language_weight),
      },
      skillMatches: item.skill_matches || item.skillMatches || [],
      aiComment: item.ai_comment || item.aiComment || 'API eşleştirmesi tamamlandı.',
    };
  });

  const runApiMatching = async () => {
    setIsSearching(true);
    setMatchingMode('api');
    setMatchingError('');
    try {
      await api.updateWeights(weights);
      const data = await api.matchCandidates({
        position,
        required_experience_years: requiredExperienceYears ? Number(requiredExperienceYears) : null,
        required_skills: selectedSkills,
        required_languages: selectedLanguages,
        required_universities: selectedUniversities,
        required_projects: projectKeywords,
        llm_summary_keywords: llmKeywords,
      });
      const normalized = normalizeApiResults(data);
      setResults(normalized);
      normalized.forEach(candidate => {
        if (candidate.id && candidate.radar_scores) {
          updateCandidate(candidate.id, { radar_scores: candidate.radar_scores });
        }
      });
    } catch {
      setMatchingError('API eşleştirmesi başarısız oldu. Backend bağlantısını kontrol edin.');
    } finally {
      setIsSearching(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return { text: 'text-success-500', bg: 'bg-success-50', border: 'border-success-200', gradient: 'from-success-500 to-success-400' };
    if (score >= 40) return { text: 'text-warning-500', bg: 'bg-warning-50', border: 'border-warning-200', gradient: 'from-warning-500 to-warning-400' };
    return { text: 'text-danger-500', bg: 'bg-danger-50', border: 'border-danger-200', gradient: 'from-danger-500 to-danger-400' };
  };

  const saveReport = async () => {
    if (!results) return;
    const toTen = (entry, active) => active && entry?.max > 0
      ? Math.round((Number(entry.score || 0) / Number(entry.max)) * 100) / 10
      : null;
    const requiredYears = Number(requiredExperienceYears || 0);
    const payload = {
      title: `${capitalize(position) || 'Genel'} Aday Raporu - ${new Date().toLocaleDateString('tr-TR')}`,
      position,
      filter_criteria: {
        skills: selectedSkills,
        languages: selectedLanguages,
        universities: selectedUniversities,
        projects: projectKeywords,
        llm_keywords: llmKeywords,
        required_experience_years: requiredYears || null,
      },
      matched_candidates: results.map(candidate => ({
        candidate_id: candidate.id,
        candidate_name: capitalize(candidate.full_name),
        score: candidate.totalScore,
        ai_comment: candidate.aiComment,
        breakdown: candidate.breakdown,
        radar_scores: {
          technical_skills: toTen(candidate.breakdown?.skill, selectedSkills.length > 0),
          project_experience: toTen(candidate.breakdown?.project, projectKeywords.length > 0),
          experience_level: requiredYears > 0
            ? Math.min(10, Math.round((Number(candidate.experience_years || 0) / requiredYears) * 100) / 10)
            : null,
          language_proficiency: toTen(candidate.breakdown?.language, selectedLanguages.length > 0),
          communication_clarity: null,
          technical_depth: null,
        },
        radar_sources: {
          technical_skills: 'cv',
          project_experience: 'cv',
          experience_level: 'cv',
          language_proficiency: 'cv',
        },
      })),
      ai_summary: `${results.length} aday ${capitalize(position) || 'pozisyon'} için değerlendirildi. En yüksek eşleşme: ${capitalize(results[0]?.full_name)} (%${results[0]?.totalScore}).`,
    };
    setIsSavingReport(true);
    try {
      const saved = await api.saveReport(payload);
      addReport(saved);
      alert('Rapor veritabanına kaydedildi!');
    } catch (error) {
      alert(error.message || 'Rapor kaydedilemedi.');
    } finally {
      setIsSavingReport(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Eşleşme Motoru</h1>
          <p className="text-gray-500 mt-1">Aday gereksinimlerini belirleyin, AI eşleştirme yapsın</p>
        </div>
      </div>

      {/* Filter Criteria */}
      <div className="antigravity-card-static p-6 space-y-5">
        {/* Position */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Pozisyon</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Örn: Backend Developer"
              className="antigravity-input"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">İstenen deneyim (Radar)</label>
            <input
              type="number"
              min="0"
              max="50"
              step="1"
              value={requiredExperienceYears}
              onChange={(e) => setRequiredExperienceYears(e.target.value)}
              placeholder="Örn: 3"
              className="antigravity-input"
            />
          </div>
        </div>

        {/* Skills */}
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Code className="w-4 h-4 text-primary-500" />
              Beceri/Yetkinlikler
              <span className="text-xs text-gray-400 font-normal">({selectedSkills.length} seçili)</span>
            </label>
            <InlineWeightSlider weightKey="skill_weight" weights={weights} onChange={handleInlineWeightChange} />
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSkillsOpen(open => !open)}
              className="flex min-h-[48px] w-full items-center gap-2 rounded-xl border border-surface-200 bg-surface-50 p-2.5 text-left transition-colors hover:border-primary-300"
              aria-expanded={skillsOpen}
              aria-haspopup="listbox"
            >
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                {selectedSkills.slice(0, 3).map(skill => (
                  <span key={skill} className="pill pill-blue inline-flex items-center gap-1">
                    {skill}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-danger-500"
                      onClick={event => { event.stopPropagation(); toggleSkill(skill); }}
                    />
                  </span>
                ))}
                {selectedSkills.length > 3 && <span className="pill pill-blue">+{selectedSkills.length - 3}</span>}
                {!selectedSkills.length && <span className="px-1 text-sm text-gray-400">Beceri seçin veya arayın</span>}
              </div>
              <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${skillsOpen ? 'rotate-180' : ''}`} />
            </button>
            {skillsOpen && (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-xl border border-surface-200 bg-white p-3 shadow-xl">
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    autoFocus
                    type="search"
                    value={skillSearch}
                    onChange={event => setSkillSearch(event.target.value)}
                    placeholder="Beceri ara..."
                    className="antigravity-input w-full pl-9"
                  />
                </div>
                <div className="grid max-h-52 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2" role="listbox" aria-label="Beceri seçenekleri">
                  {visibleSkills.map(skill => {
                    const selected = selectedSkills.includes(skill);
                    return (
                      <button
                        type="button"
                        key={skill}
                        role="option"
                        aria-selected={selected}
                        onClick={() => toggleSkill(skill)}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${selected ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-surface-50 hover:text-primary-600'}`}
                      >
                        {skill}
                        {selected && <CheckCircle className="h-3.5 w-3.5 text-primary-500" />}
                      </button>
                    );
                  })}
                  {!visibleSkills.length && <p className="col-span-full px-3 py-4 text-center text-xs text-gray-400">Beceri bulunamadı.</p>}
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-surface-100 pt-2">
                  <span className="text-xs text-gray-400">{selectedSkills.length} beceri seçili</span>
                  <button type="button" onClick={() => { setSkillsOpen(false); setSkillSearch(''); }} className="text-xs font-semibold text-primary-600 hover:text-primary-700">Tamam</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Languages */}
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Globe className="w-4 h-4 text-language-500" />
              Dil Seviyesi
            </label>
            <InlineWeightSlider weightKey="language_weight" weights={weights} onChange={handleInlineWeightChange} />
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedLanguages.map(lang => (
              <span key={lang.language} className="pill pill-purple flex items-center gap-1">
                {languageOption(lang.language)?.flag || '🌐'} {languageOption(lang.language)?.label || capitalize(lang.language)} — {lang.level.toUpperCase()} ve üstü
                <X className="w-3 h-3 cursor-pointer hover:text-danger-500" onClick={() => removeLanguage(lang.language)} />
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <button type="button" onClick={() => setLanguageOpen(open => !open)} className="flex w-full items-center justify-between rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm hover:border-primary-300" aria-expanded={languageOpen}>
                <span className="flex items-center gap-2"><span>{languageOption(langToAdd)?.flag || '🌐'}</span>{languageOption(langToAdd)?.label || 'Dil seçin'}</span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${languageOpen ? 'rotate-180' : ''}`} />
              </button>
              {languageOpen && <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-xl border border-surface-200 bg-white p-2 shadow-xl">
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input autoFocus value={languageSearch} onChange={event => setLanguageSearch(event.target.value)} placeholder="Dil ara..." className="antigravity-input w-full pl-9" />
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {visibleLanguages.map(language => <button type="button" key={language.value} onClick={() => { setLangToAdd(language.value); setLanguageOpen(false); setLanguageSearch(''); }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-primary-50 ${langToAdd === language.value ? 'bg-primary-50 text-primary-700' : 'text-gray-700'}`}><span className="text-lg">{language.flag}</span><span>{language.label}</span>{langToAdd === language.value && <CheckCircle className="ml-auto h-4 w-4 text-primary-500" />}</button>)}
                  {!visibleLanguages.length && <p className="px-3 py-3 text-center text-xs text-gray-400">Dil bulunamadı.</p>}
                </div>
              </div>}
            </div>
            <select value={levelToAdd} onChange={(e) => setLevelToAdd(e.target.value)} className="antigravity-select w-24">
              {LANGUAGE_LEVELS.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
            <button type="button" onClick={addLanguage} className="px-4 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors">
              Ekle
            </button>
          </div>
        </div>

        {/* University */}
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-warning-500" />
              Üniversite
            </label>
            <InlineWeightSlider weightKey="university_weight" weights={weights} onChange={handleInlineWeightChange} />
          </div>
          <div className="flex flex-wrap gap-2 p-3 bg-surface-50 rounded-xl border border-surface-200">
            {AVAILABLE_UNIVERSITIES.map(university => {
              const selected = selectedUniversities.includes(university);
              return (
                <button
                  key={university}
                  type="button"
                  onClick={() => setSelectedUniversities(selected
                    ? selectedUniversities.filter(item => item !== university)
                    : [...selectedUniversities, university])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selected
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-surface-200 hover:border-primary-300 hover:text-primary-600'}`}
                >
                  {capitalize(university)}
                </button>
              );
            })}
          </div>
          {selectedUniversities.length > 0 && (
            <p className="text-xs text-primary-600 mt-2">{selectedUniversities.length} üniversite seçildi; herhangi biri eşleşirse tam puan verilir.</p>
          )}
        </div>

        {/* Projects */}
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-success-500" />
              Proje Anahtar Kelimeleri
              <span className="text-xs text-gray-400 font-normal">(Yazıp Enter'a basın)</span>
            </label>
            <InlineWeightSlider weightKey="project_weight" weights={weights} onChange={handleInlineWeightChange} />
          </div>
          <TagInput tags={projectKeywords} setTags={setProjectKeywords} placeholder="Örn: cloud, e-ticaret, microservices..." />
        </div>

        {/* LLM Keywords */}
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary-500" />
              İK LLM Semantik Özet Anahtar Kelimeleri
              <span className="text-xs text-gray-400 font-normal">(Yazıp Enter'a basın)</span>
            </label>
            <InlineWeightSlider weightKey="llm_summary_weight" weights={weights} onChange={handleInlineWeightChange} />
          </div>
          <TagInput tags={llmKeywords} setTags={setLlmKeywords} placeholder="Örn: backend, microservices, deneyimli..." />
        </div>

        <div className={`flex items-center justify-between rounded-xl border p-4 transition-colors ${
          weightsValid
            ? 'border-success-200 bg-success-50'
            : 'border-danger-200 bg-danger-50'
        }`}>
          <div>
            <p className={`text-sm font-semibold ${weightsValid ? 'text-success-700' : 'text-danger-700'}`}>
              Toplam Ağırlık
            </p>
            <p className={`mt-0.5 text-xs ${weightsValid ? 'text-success-600' : 'text-danger-600'}`}>
              {weightsValid
                ? 'Eşleştirme için ağırlık dağılımı hazır.'
                : `Toplam %100 olmalıdır; şu anda ${totalWeight > 100 ? `%${totalWeight - 100} fazla` : `%${100 - totalWeight} eksik`}.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-extrabold ${weightsValid ? 'text-success-600' : 'text-danger-600'}`}>
              %{totalWeight}
            </span>
            {weightsValid
              ? <CheckCircle className="h-5 w-5 text-success-600" />
              : <AlertCircle className="h-5 w-5 text-danger-600" />}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => { setSelectedSkills([]); setSelectedLanguages([]); setSelectedUniversities([]); setProjectKeywords([]); setLlmKeywords([]); setPosition(''); setResults(null); setMatchingError(''); }}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-surface-100 hover:bg-surface-200 transition-colors"
          >
            Sıfırla
          </button>
          <button
            onClick={runApiMatching}
            disabled={isSearching || !weightsValid}
            className="antigravity-button hrai-animated-button w-fit shrink-0 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Target className="w-4 h-4" />
            {isSearching && matchingMode === 'api' ? 'HRAI eşleştiriyor...' : 'HRAI EŞLEŞTİRME'}
          </button>
          <button
            onClick={runDemoMatching}
            disabled={isSearching || !weightsValid}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isSearching && matchingMode === 'demo' ? 'Demo Hesaplıyor...' : 'Demo Eşleştirmeyi Başlat'}
          </button>
        </div>
      </div>

      {matchingError && (
        <div className="p-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-600 text-sm">
          {matchingError}
        </div>
      )}

      {/* Loading */}
      {isSearching && (
        <div className="flex items-center justify-center py-8 gap-3">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-accent-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm text-gray-400">AI adayları değerlendiriyor...</span>
        </div>
      )}

      {/* Results */}
      {results && !isSearching && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">
              Sonuçlar <span className="text-gray-400 font-normal text-sm">({results.length} aday)</span>
            </h2>
            <button
              onClick={saveReport}
              disabled={isSavingReport}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors flex items-center gap-2 border border-primary-200"
            >
              <Save className="w-4 h-4" />
              {isSavingReport ? 'Kaydediliyor...' : 'Raporu Kaydet'}
            </button>
          </div>

          {results.map((candidate, idx) => {
            const scoreColor = getScoreColor(candidate.totalScore);
            const isExpanded = expandedCard === candidate.id;

            return (
              <div key={candidate.id} className="antigravity-card overflow-hidden animate-slide-up" style={{ animationDelay: `${idx * 80}ms` }}>
                {/* Score header strip */}
                <div className={`h-1 w-full bg-gradient-to-r ${scoreColor.gradient}`} />

                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Candidate Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{capitalize(candidate.full_name)}</h3>
                          <p className="text-sm text-gray-500">
                            {capitalize(candidate.profession)} • {capitalize(candidate.university)} • {candidate.experience_years} yıl
                          </p>
                        </div>
                      </div>

                      {/* Score Breakdown */}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className={`px-2 py-1 rounded-lg ${scoreColor.bg} ${scoreColor.text} font-medium ${scoreColor.border} border`}>
                          Beceri {candidate.breakdown.skill?.score}/{candidate.breakdown.skill?.max}
                        </span>
                        <span className={`px-2 py-1 rounded-lg bg-surface-50 border border-surface-200`}>
                          Proje {candidate.breakdown.project?.score}/{candidate.breakdown.project?.max}
                        </span>
                        <span className={`px-2 py-1 rounded-lg bg-surface-50 border border-surface-200`}>
                          LLM Özet {candidate.breakdown.llm_summary?.score}/{candidate.breakdown.llm_summary?.max}
                        </span>
                        <span className={`px-2 py-1 rounded-lg bg-surface-50 border border-surface-200`}>
                          Üniversite {candidate.breakdown.university?.score}/{candidate.breakdown.university?.max}
                        </span>
                        <span className={`px-2 py-1 rounded-lg bg-surface-50 border border-surface-200`}>
                          Dil {candidate.breakdown.language?.score}/{candidate.breakdown.language?.max}
                        </span>
                      </div>

                      {/* Skill Pills */}
                      {candidate.skillMatches.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {candidate.skillMatches.map(sm => (
                            <span
                              key={sm.skill}
                              className={`pill ${sm.matched ? 'pill-green' : 'pill-red'} flex items-center gap-1`}
                            >
                              {sm.matched ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {sm.skill}
                              {!sm.matched && <span className="text-[10px] opacity-70 ml-1">yok</span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Score Badge */}
                    <div className="text-right ml-6 flex-shrink-0">
                      <div className={`text-4xl font-extrabold bg-gradient-to-r ${scoreColor.gradient} bg-clip-text text-transparent`}>
                        %{candidate.totalScore}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Eşleşme</p>
                    </div>
                  </div>

                  {/* AI Comment */}
                  <div className="mt-4 p-3 bg-gradient-to-r from-primary-50/50 to-accent-50/50 rounded-xl border border-primary-100/50">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{candidate.aiComment}</p>
                    </div>
                  </div>

                  {/* Expand/Collapse */}
                  <button
                    onClick={() => setExpandedCard(isExpanded ? null : candidate.id)}
                    className="mt-3 text-xs text-primary-500 hover:text-primary-700 flex items-center gap-1 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {isExpanded ? 'Daralt' : 'Detay Göster'}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-surface-100 space-y-4 animate-fade-in">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Diller</h4>
                        <div className="flex flex-wrap gap-2">
                          {candidate.languages.map(l => (
                            <span key={l.language} className="pill pill-purple">{capitalize(l.language)} — {l.level.toUpperCase()}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Projeler</h4>
                        <div className="space-y-2">
                          {candidate.projects.map((p, i) => (
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
                      {candidate.ai_summary && (
                        <div className="p-3 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl">
                          <h4 className="text-sm font-semibold text-primary-700 mb-1">AI Özet</h4>
                          <p className="text-sm text-gray-600">{candidate.ai_summary}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

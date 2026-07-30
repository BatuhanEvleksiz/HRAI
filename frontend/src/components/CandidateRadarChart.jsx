import React from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';

const AXES = [
  ['technical_skills', 'Teknik Yetkinlik'],
  ['project_experience', 'Proje Deneyimi'],
  ['experience_level', 'Deneyim Seviyesi'],
  ['language_proficiency', 'Dil Yeterliliği'],
  ['communication_clarity', 'İletişim Netliği'],
  ['technical_depth', 'Teknik Derinlik'],
];

const LEVELS = { a1: 1, a2: 2, b1: 3, b2: 4, c1: 5, c2: 6 };

export function deriveCandidateRadar(candidate) {
  if (candidate?.radar_scores && Object.keys(candidate.radar_scores).length) {
    return candidate.radar_scores;
  }
  const skills = candidate?.skills || [];
  const projects = candidate?.projects || [];
  const years = Math.max(0, Number(candidate?.experience_years || 0));
  const languages = (candidate?.languages || [])
    .map(language => LEVELS[String(language.level || '').toLowerCase()] || 0);
  const technicalSkills = Math.min(10, Math.round(skills.length * 11) / 10);
  const projectExperience = Math.min(10, Math.round((projects.length * 2.5 + Math.min(years, 5) * 0.6) * 10) / 10);
  return {
    technical_skills: technicalSkills,
    project_experience: projectExperience,
    experience_level: Math.min(10, Math.round(years * 17) / 10),
    language_proficiency: languages.length
      ? Math.round((languages.reduce((sum, level) => sum + level, 0) / languages.length / 6) * 100) / 10
      : null,
    communication_clarity: null,
    technical_depth: Math.round(((technicalSkills + projectExperience) / 2) * 10) / 10,
  };
}

export default function CandidateRadarChart({ candidate, height = 330 }) {
  const scores = deriveCandidateRadar(candidate);
  const data = AXES.map(([key, label]) => ({
    axis: label,
    score: scores[key] ?? null,
    fullMark: 10,
  }));
  const missingCommunication = scores.communication_clarity == null;

  return (
    <div>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="68%">
            <PolarGrid stroke="rgb(var(--surface-200))" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <PolarRadiusAxis angle={90} domain={[0, 10]} tickCount={6} tick={{ fill: '#9ca3af', fontSize: 9 }} />
            <Tooltip formatter={value => [value == null ? 'Veri yok' : `${value}/10`, 'Puan']} />
            <Radar
              name={candidate?.full_name || candidate?.candidate_name || 'Aday'}
              dataKey="score"
              stroke="#1B4EF5"
              fill="#5996FF"
              fillOpacity={0.22}
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#1B4EF5' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      {missingCommunication && (
        <p className="text-center text-[11px] text-warning-600">
          İletişim netliği mülakat analizi sonrasında tamamlanır.
        </p>
      )}
    </div>
  );
}

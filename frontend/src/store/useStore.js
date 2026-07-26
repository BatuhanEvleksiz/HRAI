import { create } from 'zustand';

// Demo data for when backend is not available
const DEMO_CANDIDATES = [
  {
    id: '1', full_name: 'ahmet yılmaz', email: 'ahmet@email.com', phone: '+90 555 111 2233',
    profession: 'backend developer', university: 'odtü', experience_years: 4,
    skills: ['python', 'java', 'fastapi', 'docker', 'postgresql', 'git', 'redis', 'kubernetes'],
    languages: [{ language: 'türkçe', level: 'c2' }, { language: 'ingilizce', level: 'b2' }, { language: 'almanca', level: 'a2' }],
    projects: [
      { title: 'e-ticaret microservices api', description: 'Yüksek trafikli e-ticaret platformu için microservices mimarisi.', technologies: ['python', 'fastapi', 'docker', 'kubernetes'] },
      { title: 'cloud monitoring dashboard', description: 'AWS altyapısı için gerçek zamanlı monitoring sistemi.', technologies: ['python', 'aws', 'grafana'] },
      { title: 'chat uygulaması backend', description: 'WebSocket tabanlı mesajlaşma uygulaması.', technologies: ['java', 'spring boot', 'redis'] }
    ],
    ai_summary: 'Güçlü backend geliştirme deneyimine sahip, microservices mimarisinde uzmanlaşmış yazılım mühendisi. Docker/Kubernetes ile containerization ve cloud deployment konularında tecrübeli.',
    status: 'approved', created_at: '2026-07-15T10:00:00Z', updated_at: '2026-07-15T10:00:00Z'
  },
  {
    id: '2', full_name: 'ayşe çelik', email: 'ayse@email.com', phone: '+90 555 222 3344',
    profession: 'frontend developer', university: 'boğaziçi üniversitesi', experience_years: 3,
    skills: ['javascript', 'react', 'typescript', 'css', 'html', 'git', 'next.js', 'tailwindcss'],
    languages: [{ language: 'türkçe', level: 'c2' }, { language: 'ingilizce', level: 'c1' }],
    projects: [
      { title: 'e-ticaret frontend', description: 'React ve Next.js ile modern e-ticaret arayüzü.', technologies: ['react', 'next.js', 'typescript'] },
      { title: 'dashboard analytics', description: 'Veri görselleştirme dashboard uygulaması.', technologies: ['react', 'recharts', 'd3.js'] }
    ],
    ai_summary: 'Modern frontend teknolojilerinde deneyimli, React ekosisteminde uzman geliştirici. UI/UX odaklı, responsive tasarım konusunda güçlü.',
    status: 'approved', created_at: '2026-07-14T09:00:00Z', updated_at: '2026-07-14T09:00:00Z'
  },
  {
    id: '3', full_name: 'mehmet demir', email: 'mehmet@email.com', phone: '+90 555 333 4455',
    profession: 'backend developer', university: 'hacettepe üniversitesi', experience_years: 5,
    skills: ['java', 'spring boot', 'python', 'sql', 'mongodb', 'docker', 'git', 'aws', 'microservices'],
    languages: [{ language: 'türkçe', level: 'c2' }, { language: 'ingilizce', level: 'b2' }, { language: 'fransızca', level: 'b1' }],
    projects: [
      { title: 'bankacılık api sistemi', description: 'Büyük ölçekli bankacılık API altyapısı geliştirme.', technologies: ['java', 'spring boot', 'oracle', 'docker'] },
      { title: 'cloud migration projesi', description: 'On-premise sistemlerin AWS bulut ortamına taşınması.', technologies: ['aws', 'terraform', 'docker', 'kubernetes'] }
    ],
    ai_summary: 'Fintech sektöründe deneyimli, güvenli ve ölçeklenebilir backend sistemleri geliştirme konusunda uzman. Cloud migration ve DevOps süreçlerinde tecrübeli.',
    status: 'pending', created_at: '2026-07-16T14:00:00Z', updated_at: '2026-07-16T14:00:00Z'
  },
  {
    id: '4', full_name: 'zeynep arslan', email: 'zeynep@email.com', phone: '+90 555 444 5566',
    profession: 'full stack developer', university: 'ytü', experience_years: 2,
    skills: ['javascript', 'react', 'node.js', 'express', 'mongodb', 'git', 'css', 'html'],
    languages: [{ language: 'türkçe', level: 'c2' }, { language: 'ingilizce', level: 'b1' }],
    projects: [
      { title: 'sosyal medya platformu', description: 'MERN stack ile sosyal medya uygulaması.', technologies: ['react', 'node.js', 'mongodb', 'express'] }
    ],
    ai_summary: 'MERN stack konusunda deneyimli junior full stack geliştirici. Hızlı öğrenme kapasitesine sahip.',
    status: 'rejected', created_at: '2026-07-13T11:00:00Z', updated_at: '2026-07-13T11:00:00Z'
  },
  {
    id: '5', full_name: 'can öztürk', email: 'can@email.com', phone: '+90 555 555 6677',
    profession: 'frontend developer', university: 'muğla sıtkı koçman üniversitesi', experience_years: 3,
    skills: ['react', 'vue.js', 'javascript', 'typescript', 'sass', 'git', 'figma', 'tailwindcss'],
    languages: [{ language: 'türkçe', level: 'c2' }, { language: 'ingilizce', level: 'b2' }, { language: 'ispanyolca', level: 'a1' }],
    projects: [
      { title: 'crm dashboard', description: 'Vue.js ile müşteri ilişkileri yönetim paneli.', technologies: ['vue.js', 'typescript', 'tailwindcss'] },
      { title: 'portfolio website builder', description: 'Drag & drop portfolio oluşturucu.', technologies: ['react', 'dnd-kit', 'sass'] }
    ],
    ai_summary: 'Frontend geliştirme ve UI/UX tasarım süreçlerinde deneyimli. React ve Vue.js ekosistemlerinde aktif.',
    status: 'pending', created_at: '2026-07-17T16:00:00Z', updated_at: '2026-07-17T16:00:00Z'
  },
  {
    id: '6', full_name: 'elif kaya', email: 'elif@email.com', phone: '+90 555 666 7788',
    profession: 'data engineer', university: 'itü', experience_years: 4,
    skills: ['python', 'sql', 'spark', 'kafka', 'airflow', 'aws', 'docker', 'git', 'postgresql'],
    languages: [{ language: 'türkçe', level: 'c2' }, { language: 'ingilizce', level: 'c1' }, { language: 'almanca', level: 'b1' }],
    projects: [
      { title: 'real-time data pipeline', description: 'Kafka ve Spark ile gerçek zamanlı veri işleme hattı.', technologies: ['python', 'kafka', 'spark', 'aws'] },
      { title: 'data warehouse projesi', description: 'Büyük ölçekli veri ambarı tasarımı ve implementasyonu.', technologies: ['python', 'sql', 'airflow', 'postgresql'] }
    ],
    ai_summary: 'Büyük veri teknolojilerinde uzman data engineer. ETL süreçleri, real-time streaming ve veri ambarı tasarımında deneyimli.',
    status: 'approved', created_at: '2026-07-12T08:00:00Z', updated_at: '2026-07-12T08:00:00Z'
  },
  {
    id: '7', full_name: 'burak şahin', email: 'burak@email.com', phone: '+90 555 777 8899',
    profession: 'devops engineer', university: 'odtü', experience_years: 6,
    skills: ['docker', 'kubernetes', 'terraform', 'aws', 'azure', 'jenkins', 'git', 'linux', 'python', 'bash'],
    languages: [{ language: 'türkçe', level: 'c2' }, { language: 'ingilizce', level: 'c1' }],
    projects: [
      { title: 'ci/cd pipeline otomasyonu', description: 'Jenkins ve GitLab CI ile tam otomatik deployment pipeline.', technologies: ['jenkins', 'docker', 'kubernetes', 'terraform'] },
      { title: 'cloud infrastructure', description: 'Multi-cloud altyapı yönetimi ve optimizasyonu.', technologies: ['aws', 'azure', 'terraform', 'kubernetes'] }
    ],
    ai_summary: 'Deneyimli DevOps mühendisi. CI/CD, container orchestration ve cloud altyapı yönetiminde uzman. Multi-cloud stratejileri konusunda tecrübeli.',
    status: 'approved', created_at: '2026-07-11T12:00:00Z', updated_at: '2026-07-11T12:00:00Z'
  },
  {
    id: '8', full_name: 'seda yıldız', email: 'seda@email.com', phone: '+90 555 888 9900',
    profession: 'backend developer', university: 'boğaziçi üniversitesi', experience_years: 3,
    skills: ['python', 'django', 'flask', 'postgresql', 'redis', 'docker', 'git', 'celery'],
    languages: [{ language: 'türkçe', level: 'c2' }, { language: 'ingilizce', level: 'c1' }, { language: 'ispanyolca', level: 'a2' }],
    projects: [
      { title: 'saas platform backend', description: 'Multi-tenant SaaS platform backend geliştirme.', technologies: ['python', 'django', 'postgresql', 'redis'] },
      { title: 'api gateway', description: 'Microservices için merkezi API gateway.', technologies: ['python', 'flask', 'redis', 'docker'] }
    ],
    ai_summary: 'Python ekosisteminde güçlü backend geliştirici. Django ve Flask framework deneyimi, SaaS ve microservices mimarilerinde tecrübeli.',
    status: 'pending', created_at: '2026-07-18T10:00:00Z', updated_at: '2026-07-18T10:00:00Z'
  },
  {
    id: '9', full_name: 'emre koç', email: 'emre@email.com', phone: '+90 555 999 0011',
    profession: 'mobile developer', university: 'hacettepe üniversitesi', experience_years: 3,
    skills: ['flutter', 'dart', 'kotlin', 'swift', 'firebase', 'git', 'rest api'],
    languages: [{ language: 'türkçe', level: 'c2' }, { language: 'ingilizce', level: 'b2' }],
    projects: [
      { title: 'fitness tracking app', description: 'Flutter ile cross-platform fitness takip uygulaması.', technologies: ['flutter', 'dart', 'firebase'] },
      { title: 'e-ticaret mobil app', description: 'Kotlin ile Android e-ticaret uygulaması.', technologies: ['kotlin', 'retrofit', 'room'] }
    ],
    ai_summary: 'Cross-platform ve native mobil uygulama geliştirmede deneyimli. Flutter ve Kotlin teknolojilerinde uzman.',
    status: 'pending', created_at: '2026-07-19T15:00:00Z', updated_at: '2026-07-19T15:00:00Z'
  },
  {
    id: '10', full_name: 'deniz aktaş', email: 'deniz@email.com', phone: '+90 555 000 1122',
    profession: 'bilgisayar mühendisi', university: 'itü', experience_years: 1,
    skills: ['python', 'java', 'c++', 'sql', 'git', 'html', 'css'],
    languages: [{ language: 'türkçe', level: 'c2' }, { language: 'ingilizce', level: 'b1' }],
    projects: [
      { title: 'üniversite bitirme projesi', description: 'Makine öğrenmesi ile metin sınıflandırma.', technologies: ['python', 'scikit-learn', 'flask'] }
    ],
    ai_summary: 'Yeni mezun bilgisayar mühendisi. Temel programlama becerilerine sahip, öğrenmeye açık.',
    status: 'pending', created_at: '2026-07-20T09:00:00Z', updated_at: '2026-07-20T09:00:00Z'
  }
];

const DEMO_INTERVIEWS = [
  {
    id: '1', candidate_id: '3', candidate_name: 'Mehmet Demir', position: 'Backend Developer',
    interview_date: '2026-07-20', interview_time: '18:00', status: 'pending',
    is_completed: true, notes: 'Ön değerlendirme mülakatı.',
  },
  {
    id: '2', candidate_id: '5', candidate_name: 'Can Öztürk', position: 'Frontend Developer',
    interview_date: '2026-07-21', interview_time: '15:00', status: 'pending',
    is_completed: true, notes: 'Ön değerlendirme mülakatı.',
  },
  {
    id: '3', candidate_id: '2', candidate_name: 'Ayşe Çelik', position: 'Senior Backend Engineer',
    interview_date: '2026-07-23', interview_time: '10:30', status: 'approved',
    is_completed: null, notes: 'Sistem tasarımı mülakatı planlandı.',
  },
  {
    id: '4', candidate_id: '3', candidate_name: 'Ahmet Yılmaz', position: 'Backend Developer',
    interview_date: '2026-07-22', interview_time: '13:00', status: 'approved',
    is_completed: true, notes: 'İkinci mülakat aşaması - teknik değerlendirme.',
  },
  {
    id: '5', candidate_id: '4', candidate_name: 'Zeynep Arslan', position: 'Backend Developer',
    interview_date: '2026-07-15', interview_time: '14:00', status: 'rejected',
    is_completed: null, notes: 'Deneyim seviyesi pozisyon için yetersiz.',
  },
];

const DEMO_REPORTS = [
  {
    id: '1', title: 'Backend Developer Aday Raporu - Temmuz 2026',
    position: 'Backend Developer', created_at: '2026-07-18T10:00:00Z',
    filter_criteria: { skills: ['python', 'docker', 'sql'], languages: [{ language: 'ingilizce', level: 'b2' }] },
    matched_candidates: [
      { candidate_name: 'Ahmet Yılmaz', score: 85 },
      { candidate_name: 'Mehmet Demir', score: 78 },
      { candidate_name: 'Seda Yıldız', score: 72 },
    ],
    ai_summary: 'Backend Developer pozisyonu için 3 güçlü aday belirlendi. En yüksek eşleşme Ahmet Yılmaz ile sağlanmıştır.',
  },
  {
    id: '2', title: 'Frontend Developer Analiz Raporu',
    position: 'Frontend Developer', created_at: '2026-07-19T14:00:00Z',
    filter_criteria: { skills: ['react', 'typescript'], languages: [{ language: 'ingilizce', level: 'b1' }] },
    matched_candidates: [
      { candidate_name: 'Ayşe Çelik', score: 92 },
      { candidate_name: 'Can Öztürk', score: 80 },
    ],
    ai_summary: 'Frontend Developer için Ayşe Çelik en güçlü aday olarak öne çıkmaktadır.',
  }
];

export const useStore = create((set, get) => ({
  // Candidates
  candidates: DEMO_CANDIDATES,
  setCandidates: (candidates) => set({ candidates }),
  addCandidate: (candidate) => set((state) => ({ candidates: [...state.candidates, { ...candidate, id: String(state.candidates.length + 1), status: 'pending', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }] })),
  updateCandidate: (id, data) => set((state) => ({
    candidates: state.candidates.map(c => c.id === id ? { ...c, ...data, updated_at: new Date().toISOString() } : c)
  })),
  deleteCandidate: (id) => set((state) => ({ candidates: state.candidates.filter(c => c.id !== id) })),

  // Interviews
  interviews: DEMO_INTERVIEWS,
  setInterviews: (interviews) => set({ interviews }),
  addInterview: (interview) => set((state) => ({
    interviews: [...state.interviews, { ...interview, id: String(state.interviews.length + 1) }]
  })),
  updateInterview: (id, data) => set((state) => ({
    interviews: state.interviews.map(i => i.id === id ? { ...i, ...data } : i)
  })),
  deleteInterview: (id) => set((state) => ({ interviews: state.interviews.filter(i => i.id !== id) })),
  moveInterview: (id, newStatus) => set((state) => ({
    interviews: state.interviews.map(i => i.id === id ? { ...i, status: newStatus } : i)
  })),

  // Reports
  reports: DEMO_REPORTS,
  addReport: (report) => set((state) => ({
    reports: [...state.reports, { ...report, id: String(state.reports.length + 1), created_at: new Date().toISOString() }]
  })),
  deleteReport: (id) => set((state) => ({ reports: state.reports.filter(r => r.id !== id) })),

  // Scoring Weights
  weights: {
    skill_weight: 40,
    project_weight: 20,
    llm_summary_weight: 20,
    university_weight: 10,
    language_weight: 10,
  },
  setWeights: (weights) => set({ weights }),

  // Chat
  chatMessages: [],
  addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),

  // Analyzed CV (temporary before save)
  analyzedCV: null,
  setAnalyzedCV: (cv) => set({ analyzedCV: cv }),

  // Active page
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),
}));

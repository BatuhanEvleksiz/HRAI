const configuredApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = configuredApiUrl
  ? `${configuredApiUrl}${configuredApiUrl.endsWith('/api') ? '' : '/api'}`
  : '/api';

async function request(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
      signal: options.signal || controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || data.message || `API Error: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Candidates
  uploadCV: (file, onProgress) => new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    const request = new XMLHttpRequest();
    request.open('POST', `${API_BASE}/candidates/upload`);
    request.timeout = 180000;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.upload.onload = () => { if (onProgress) onProgress(100); };
    request.onload = () => {
      let data = {};
      try { data = JSON.parse(request.responseText || '{}'); } catch { /* keep generic error */ }
      if (request.status >= 200 && request.status < 300) resolve(data);
      else reject(new Error(data.detail || data.error || 'PDF analiz edilemedi.'));
    };
    request.onerror = () => reject(new Error('PDF dosyası gönderilemedi.'));
    request.ontimeout = () => reject(new Error('PDF analizi 180 saniyede tamamlanamadı.'));
    request.send(formData);
  }),
  demoAnalyze: () => request('/candidates/demo-analyze', { method: 'POST' }),
  saveCandidate: (data) => request('/candidates/save', { method: 'POST', body: JSON.stringify(data) }),
  getCandidates: (status) => request(`/candidates/${status ? `?status=${status}` : ''}`),
  getCandidate: (id) => request(`/candidates/${id}`),
  updateCandidate: (id, data) => request(`/candidates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCandidate: (id) => request(`/candidates/${id}`, { method: 'DELETE' }),

  // Matching
  matchCandidates: (data) => request('/matching/match', { method: 'POST', body: JSON.stringify(data) }),

  // Interviews
  getInterviews: () => request('/interviews/'),
  createInterview: (data) => request('/interviews/', { method: 'POST', body: JSON.stringify(data) }),
  updateInterview: (id, data) => request(`/interviews/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateInterviewStatus: (id, status) => request(`/interviews/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteInterview: (id) => request(`/interviews/${id}`, { method: 'DELETE' }),
  analyzeInterview: (data) => request('/interviews/assistant/analyze', { method: 'POST', body: JSON.stringify(data) }),
  analyzeInterviewAudio: async (file, data = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(data).forEach(([key, value]) => formData.append(key, value || ''));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 150000);
    try {
      const response = await fetch(`${API_BASE}/interviews/assistant/analyze-audio`, { method: 'POST', body: formData, signal: controller.signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Sesli mülakat analiz edilemedi.');
      return result;
    } finally {
      clearTimeout(timeout);
    }
  },
  transcribeInterviewAudio: (file, onProgress) => new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    const request = new XMLHttpRequest();
    request.open('POST', `${API_BASE}/interviews/assistant/transcribe`);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      let data = {};
      try { data = JSON.parse(request.responseText || '{}'); } catch { /* keep the generic error */ }
      if (request.status >= 200 && request.status < 300) resolve(data);
      else reject(new Error(data.detail || 'Ses transkripsiyonu başarısız.'));
    };
    request.onerror = () => reject(new Error('Ses dosyası gönderilemedi.'));
    request.onabort = () => reject(new Error('Ses dosyası yüklemesi iptal edildi.'));
    request.send(formData);
  }),
  saveInterviewAnalysis: (data) => request('/interviews/assistant/save', { method: 'POST', body: JSON.stringify(data) }),
  getInterviewAnalyses: (candidateId, interviewId) => request(`/interviews/assistant?${new URLSearchParams({ ...(candidateId ? { candidate_id: candidateId } : {}), ...(interviewId ? { interview_id: interviewId } : {}) })}`),

  // Reports
  getReports: () => request('/reports/'),
  getReport: (id) => request(`/reports/${id}`),
  saveReport: (data) => request('/reports/', { method: 'POST', body: JSON.stringify(data) }),
  updateReport: (id, data) => request(`/reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReport: (id) => request(`/reports/${id}`, { method: 'DELETE' }),

  // Chatbot
  sendChatMessage: (message) => request('/chatbot/chat', { method: 'POST', body: JSON.stringify({ user_message: message }) }),
  getChatHistory: () => request('/chatbot/history'),

  // Settings
  getWeights: () => request('/settings/weights'),
  updateWeights: (data) => request('/settings/weights', { method: 'PUT', body: JSON.stringify(data) }),
};

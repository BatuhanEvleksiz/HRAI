const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function request(url, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

export const api = {
  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Candidates
  uploadCV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/candidates/upload`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },
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
  deleteReport: (id) => request(`/reports/${id}`, { method: 'DELETE' }),

  // Chatbot
  sendChatMessage: (message) => request('/chatbot/chat', { method: 'POST', body: JSON.stringify({ user_message: message }) }),
  getChatHistory: () => request('/chatbot/history'),

  // Settings
  getWeights: () => request('/settings/weights'),
  updateWeights: (data) => request('/settings/weights', { method: 'PUT', body: JSON.stringify(data) }),
};

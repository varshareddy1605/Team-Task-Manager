// ===== API CLIENT =====
const BASE = '/api';

const api = {
  token: null,

  setToken(t) { this.token = t; if (t) localStorage.setItem('ttm_token', t); else localStorage.removeItem('ttm_token'); },
  loadToken() { this.token = localStorage.getItem('ttm_token'); return this.token; },

  async request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const res = await fetch(`${BASE}${path}`, {
      method, headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.errors?.[0]?.msg || 'Request failed');
    return data;
  },

  get: (path) => api.request('GET', path),
  post: (path, body) => api.request('POST', path, body),
  put: (path, body) => api.request('PUT', path, body),
  delete: (path) => api.request('DELETE', path),

  // Auth
  signup: (d) => api.post('/auth/signup', d),
  login: (d) => api.post('/auth/login', d),
  me: () => api.get('/auth/me'),

  // Dashboard
  dashboard: () => api.get('/dashboard'),

  // Projects
  getProjects: () => api.get('/projects'),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (d) => api.post('/projects', d),
  updateProject: (id, d) => api.put(`/projects/${id}`, d),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  getMembers: (id) => api.get(`/projects/${id}/members`),
  addMember: (id, d) => api.post(`/projects/${id}/members`, d),
  removeMember: (pid, uid) => api.delete(`/projects/${pid}/members/${uid}`),

  // Tasks
  getTasks: (params = {}) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v)));
    return api.get(`/tasks${q.toString() ? '?' + q : ''}`);
  },
  createTask: (d) => api.post('/tasks', d),
  updateTask: (id, d) => api.put(`/tasks/${id}`, d),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
};

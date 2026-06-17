/* EcoRise — API utility (cookie session + CSRF, no token in localStorage) */
const BASE = (import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:3001';

function getCookie(name) {
  return document.cookie.split('; ').find(c => c.startsWith(name + '='))?.split('=')[1] || '';
}

async function apiFetch(path, opts = {}) {
  const method = (opts.method || 'GET').toUpperCase();
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
  if (method !== 'GET' && method !== 'HEAD') {
    const csrf = getCookie('csrf');
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }
  const res = await fetch(`${BASE}${path}`, { credentials: 'include', headers, ...opts });
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  // Auth (session is an httpOnly cookie set by the server)
  signup: (body) => apiFetch('/api/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
  me: () => apiFetch('/api/auth/me'),

  // Leaderboards
  createLeaderboard: (body) => apiFetch('/api/leaderboards', { method: 'POST', body: JSON.stringify(body) }),
  getLeaderboard: (id) => apiFetch(`/api/leaderboards/${id}`),
  updateLeaderboard: (id, body) => apiFetch(`/api/leaderboards/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  joinLeaderboard: (id, inviteCode) => apiFetch(`/api/leaderboards/${id}/join`, { method: 'POST', body: JSON.stringify({ inviteCode }) }),
  joinByCode: (inviteCode) => apiFetch('/api/leaderboards/join', { method: 'POST', body: JSON.stringify({ inviteCode }) }),
  listLeaderboards: () => apiFetch('/api/leaderboards'),
  getSeasons: (id) => apiFetch(`/api/leaderboards/${id}/seasons`),

  // Posts
  createPost: (body) => apiFetch('/api/posts', { method: 'POST', body: JSON.stringify(body) }),
  getPosts: (leaderboardId) => apiFetch(`/api/posts${leaderboardId ? `?leaderboardId=${leaderboardId}` : ''}`),
  likePost: (id) => apiFetch(`/api/posts/${id}/like`, { method: 'POST' }),
  commentPost: (id, text) => apiFetch(`/api/posts/${id}/comment`, { method: 'POST', body: JSON.stringify({ text }) }),
  getComments: (id) => apiFetch(`/api/posts/${id}/comments`),
  reportPost: (id) => apiFetch(`/api/posts/${id}/report`, { method: 'POST' }),
  deletePost: (id) => apiFetch(`/api/posts/${id}`, { method: 'DELETE' }),
  resolvePost: (id) => apiFetch(`/api/posts/${id}/resolve`, { method: 'POST' }),

  // Quests
  getQuests: () => apiFetch('/api/quests'),
  questProgress: (id, leaderboardId) => apiFetch(`/api/quests/${id}/progress`, { method: 'POST', body: JSON.stringify({ leaderboardId }) }),

  // Trash
  reportTrash: (body) => apiFetch('/api/trash', { method: 'POST', body: JSON.stringify(body) }),

  // Users
  getUser: (id) => apiFetch(`/api/users/${id}`),
  updateUser: (id, body) => apiFetch(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  getNotifications: (id) => apiFetch(`/api/users/${id}/notifications`),
  readNotifications: (id) => apiFetch(`/api/users/${id}/notifications/read`, { method: 'POST' }),

  // AI Eco Coach (gated behind COACH_ENABLED on the server)
  coachStatus: () => apiFetch('/api/coach/status'),
  coachQuestion: (topic) => apiFetch(`/api/coach/question${topic ? `?topic=${encodeURIComponent(topic)}` : ''}`),
  coachAnswer: (id, body) => apiFetch(`/api/coach/question/${id}/answer`, { method: 'POST', body: JSON.stringify(body) }),
  coachGuidance: () => apiFetch('/api/coach/guidance'),
  coachTip: () => apiFetch('/api/coach/tip'),
  coachPreferences: (body) => apiFetch('/api/coach/preferences', { method: 'POST', body: JSON.stringify(body) }),
};

export default api;

/* EcoRise — API utility (cookie session + CSRF, no token in localStorage) */
// In the browser, use relative paths so the Vite proxy (dev) or same-origin
// backend (prod) handles routing without cross-origin cookie friction.
const BASE = (import.meta.env && import.meta.env.VITE_API_BASE) || '';

function getCookie(name) {
  return document.cookie.split('; ').find(c => c.startsWith(name + '='))?.split('=')[1] || '';
}

async function apiFetch(path, opts = {}) {
  const method = (opts.method || 'GET').toUpperCase();
  const headers = { ...opts.headers };
  if (!(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
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

  // Research library (1000-paper corpus)
  coachAsk: (q) => apiFetch(`/api/coach/ask?q=${encodeURIComponent(q)}`),
  coachPapers: ({ q = '', topic = '', limit = 20, offset = 0 } = {}) =>
    apiFetch(`/api/coach/papers?q=${encodeURIComponent(q)}&topic=${encodeURIComponent(topic)}&limit=${limit}&offset=${offset}`),
  coachPaperSummary: (id) => apiFetch(`/api/coach/papers/${id}/summary`),
  coachPaperVisual: (id) => apiFetch(`/api/coach/papers/${id}/visual`),
  coachEvalReport: () => apiFetch('/api/coach/eval-report'),

  // School hidden-footprint (Direction B)
  coachSchoolInsight: (leaderboardId) => apiFetch(`/api/coach/school-insight${leaderboardId ? `?leaderboardId=${encodeURIComponent(leaderboardId)}` : ''}`),
  coachSetFootprint: (body) => apiFetch('/api/coach/school-footprint', { method: 'POST', body: JSON.stringify(body) }),

  // AI Insights (Direction B reasoning layer)
  coachInsights: (leaderboardId) => apiFetch(`/api/coach/insights${leaderboardId ? `?leaderboardId=${encodeURIComponent(leaderboardId)}` : ''}`),
  coachInsightsLoadDemo: (leaderboardId) => apiFetch('/api/coach/insights/load-demo', { method: 'POST', body: JSON.stringify({ leaderboardId }) }),
  coachInsightsApprove: (leaderboardId, itemKey) => apiFetch('/api/coach/insights/approve', { method: 'POST', body: JSON.stringify({ leaderboardId, itemKey }) }),
  coachInsightsStatus: (leaderboardId, itemKey, status) => apiFetch('/api/coach/insights/status', { method: 'POST', body: JSON.stringify({ leaderboardId, itemKey, status }) }),
  coachInsightsImport: (leaderboardId, readings) => apiFetch('/api/coach/insights/import', { method: 'POST', body: JSON.stringify({ leaderboardId, readings }) }),
  coachInsightsVerify: (leaderboardId, itemKey, before, after, metric) => apiFetch('/api/coach/insights/verify', { method: 'POST', body: JSON.stringify({ leaderboardId, itemKey, before, after, metric }) }),

  // School Footprint Insights — Direction B core (new dedicated route /api/footprint/*)
  footprintInsights: () => apiFetch('/api/footprint/insights'),
  footprintApprove: (id) => apiFetch(`/api/footprint/recommendations/${id}/approve`, { method: 'POST' }),
  footprintAssign: (id, body) => apiFetch(`/api/footprint/recommendations/${id}/assign`, { method: 'POST', body: JSON.stringify(body) }),
  footprintFlag: (body) => apiFetch('/api/footprint/flag', { method: 'POST', body: JSON.stringify(body) }),
  footprintRefresh: () => apiFetch('/api/footprint/refresh', { method: 'POST' }),

  // Privacy / FERPA-COPPA (Phase 2)
  privacyPolicy: () => apiFetch('/api/privacy/policy'),
  getConsent: (leaderboardId) => apiFetch(`/api/privacy/consent?leaderboardId=${encodeURIComponent(leaderboardId)}`),
  setConsent: (body) => {
    if (body instanceof FormData) {
      return apiFetch('/api/privacy/consent', { method: 'POST', body });
    }
    return apiFetch('/api/privacy/consent', { method: 'POST', body: JSON.stringify(body) });
  },
  getConsentVault: (boardId) => apiFetch(`/api/privacy/boards/${boardId}/consent-vault`),
  getConsentDocument: (boardId, userId) => apiFetch(`/api/privacy/boards/${boardId}/consent-vault/${userId}/document`),
  setBoardPrivacy: (id, body) => apiFetch(`/api/privacy/boards/${id}/privacy`, { method: 'POST', body: JSON.stringify(body) }),
  reviewQueue: (id) => apiFetch(`/api/privacy/boards/${id}/review-queue`),
  reviewPost: (id, body) => apiFetch(`/api/privacy/posts/${id}/review`, { method: 'POST', body: JSON.stringify(body) }),
  boardAudit: (leaderboardId) => apiFetch(`/api/privacy/audit?leaderboardId=${encodeURIComponent(leaderboardId)}`),
  exportData: () => apiFetch('/api/privacy/export'),
  deleteAccount: () => apiFetch('/api/privacy/account/delete', { method: 'POST', body: JSON.stringify({ confirm: true }) }),
};

export default api;

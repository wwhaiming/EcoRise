/* EcoRise — API utility */
const BASE = 'http://localhost:3001';

async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('ecorise_token');
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  signup: (body) => apiFetch('/api/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
  me: () => apiFetch('/api/auth/me'),

  // Leaderboards
  createLeaderboard: (body) => apiFetch('/api/leaderboards', { method: 'POST', body: JSON.stringify(body) }),
  getLeaderboard: (id) => apiFetch(`/api/leaderboards/${id}`),
  updateLeaderboard: (id, body) => apiFetch(`/api/leaderboards/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  joinLeaderboard: (id, inviteCode) => apiFetch(`/api/leaderboards/${id}/join`, { method: 'POST', body: JSON.stringify({ inviteCode }) }),
  listLeaderboards: () => apiFetch('/api/leaderboards'),

  // Posts
  createPost: (body) => apiFetch('/api/posts', { method: 'POST', body: JSON.stringify(body) }),
  getPosts: (leaderboardId) => apiFetch(`/api/posts${leaderboardId ? `?leaderboardId=${leaderboardId}` : ''}`),
  likePost: (id) => apiFetch(`/api/posts/${id}/like`, { method: 'POST' }),
  reportPost: (id) => apiFetch(`/api/posts/${id}/report`, { method: 'POST' }),
  deletePost: (id) => apiFetch(`/api/posts/${id}`, { method: 'DELETE' }),
  resolvePost: (id) => apiFetch(`/api/posts/${id}/resolve`, { method: 'POST' }),

  // Quests
  getQuests: () => apiFetch('/api/quests'),

  // Trash
  reportTrash: (body) => apiFetch('/api/trash', { method: 'POST', body: JSON.stringify(body) }),

  // Users
  getUser: (id) => apiFetch(`/api/users/${id}`),
};

export default api;

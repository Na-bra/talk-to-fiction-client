// In development this is empty and Vite proxies /api to the server (see
// vite.config.js). In production set VITE_API_URL to the deployed API origin,
// e.g. https://ai-npc-generator.onrender.com
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.code = data.code;
    throw error;
  }
  return data;
}

export const api = {
  health: () => request('/health'),
  options: () => request('/options'),

  listNpcs: () => request('/npcs'),
  getNpc: (id) => request(`/npcs/${id}`),
  createNpc: (body) => request('/npcs', { method: 'POST', body }),
  updateNpc: (id, body) => request(`/npcs/${id}`, { method: 'PUT', body }),
  deleteNpc: (id) => request(`/npcs/${id}`, { method: 'DELETE' }),
  generateDraft: (body) => request('/npcs/generate', { method: 'POST', body }),
  resetNpc: (id) => request(`/npcs/${id}/reset`, { method: 'POST' }),

  memories: (id) => request(`/npcs/${id}/memories`),
  conversations: (id) => request(`/npcs/${id}/conversations`),
  conversation: (id, conversationId) => request(`/npcs/${id}/conversations/${conversationId}`),
  newConversation: (id) => request(`/npcs/${id}/conversations`, { method: 'POST' }),
  chat: (id, body) => request(`/npcs/${id}/chat`, { method: 'POST', body }),
};

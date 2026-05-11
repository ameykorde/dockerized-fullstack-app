// All API calls go through this file.
// Set VITE_API_BASE_URL in .env to point at your hosted backend.

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export const notesApi = {
  getAll: () => request('/notes'),
  create: (data) => request('/notes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`/notes/${id}`, { method: 'DELETE' }),
};

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = (data && data.message) || (data && data.error) || `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

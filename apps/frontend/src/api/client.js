import { getApiBaseUrl } from '../config/urls.js';

const API_BASE = getApiBaseUrl();

export function getApiBase() {
  return getApiBaseUrl();
}

export async function apiRequest(endpoint, options = {}) {
  if (!API_BASE) {
    throw new Error(
      'API URL is not configured. Set VITE_API_BASE on Vercel (e.g. https://your-api.onrender.com/api).'
    );
  }
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

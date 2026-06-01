/** Normalize API root — must end with /api (no trailing slash after api). */
function resolveApiBase() {
  const raw =
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_API_URL ||
    '';
  if (!raw) {
    return import.meta.env.DEV ? 'http://localhost:3000/api' : '';
  }
  const trimmed = raw.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

const API_BASE = resolveApiBase();

export function getApiBase() {
  return API_BASE;
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

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, signup as apiSignup } from '../api/auth.js';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

const DEMO_USERS = {
  'demo@quizora.com': { id: '1', name: 'Demo User', email: 'demo@quizora.com', password: 'demo123' },
  'admin@quizora.com': { id: '2', name: 'Admin', email: 'admin@quizora.com', password: 'admin123' },
};

function readStoredAuth() {
  try {
    const saved = localStorage.getItem('quizora_user');
    const token = localStorage.getItem('token');
    return {
      user: saved ? JSON.parse(saved) : null,
      token: token || null,
    };
  } catch {
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { user: savedUser, token: savedToken } = readStoredAuth();
    setUser(savedUser);
    setToken(savedToken);
    setLoading(false);
  }, []);

  const persistAuth = useCallback((userData, authToken) => {
    localStorage.setItem('token', authToken);
    localStorage.setItem('quizora_user', JSON.stringify(userData));
    setUser(userData);
    setToken(authToken);
  }, []);

  async function login(email, password) {
    try {
      const data = await apiLogin(email, password);
      persistAuth(data.user, data.token);
      return data;
    } catch (err) {
      if (!import.meta.env.DEV) {
        throw err instanceof Error ? err : new Error('Login failed');
      }
      /* Local dev only — mock when backend is down */
    }

    const demo = DEMO_USERS[email];
    if (demo && demo.password === password) {
      const userData = { id: demo.id, name: demo.name, email: demo.email };
      const authToken = 'mock-token-' + Date.now();
      persistAuth(userData, authToken);
      return { user: userData, token: authToken };
    }

    const hint = import.meta.env.DEV
      ? ' Start http-backend (port 3000) or use demo@quizora.com / demo123.'
      : '';
    throw new Error(`Invalid email or password.${hint}`);
  }

  async function signup(email, password, name) {
    try {
      const data = await apiSignup(email, password, name);
      persistAuth(data.user, data.token);
      return data;
    } catch (err) {
      if (!import.meta.env.DEV) {
        throw err instanceof Error ? err : new Error('Signup failed');
      }
      /* Local dev only — mock when backend is down */
    }

    const userData = { id: 'user-' + Date.now(), name: name || 'New User', email };
    const authToken = 'mock-token-' + Date.now();
    persistAuth(userData, authToken);
    return { user: userData, token: authToken };
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('quizora_user');
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

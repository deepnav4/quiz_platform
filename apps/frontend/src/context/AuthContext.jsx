import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/* ——————————————————————————————————
   Mock / Demo Auth Provider
   Works fully without backend.
   Login/Signup stores user in localStorage.
   —————————————————————————————————— */
const DEMO_USERS = {
  'demo@quizora.com': { id: '1', name: 'Demo User', email: 'demo@quizora.com', password: 'demo123' },
  'admin@quizora.com': { id: '2', name: 'Admin', email: 'admin@quizora.com', password: 'admin123' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Restore user from localStorage on mount */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('quizora_user');
      if (saved) setUser(JSON.parse(saved));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  async function login(email, password) {
    /* Try real API first */
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('quizora_user', JSON.stringify(data.user));
        setUser(data.user);
        return data;
      }
    } catch { /* Backend not available — use mock */ }

    /* Mock login */
    const demo = DEMO_USERS[email];
    if (demo && demo.password === password) {
      const userData = { id: demo.id, name: demo.name, email: demo.email };
      const token = 'mock-token-' + Date.now();
      localStorage.setItem('token', token);
      localStorage.setItem('quizora_user', JSON.stringify(userData));
      setUser(userData);
      return { user: userData, token };
    }

    throw new Error('Invalid email or password. Try demo@quizora.com / demo123');
  }

  async function signup(email, password, name) {
    /* Try real API first */
    try {
      const res = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('quizora_user', JSON.stringify(data.user));
        setUser(data.user);
        return data;
      }
    } catch { /* Backend not available — use mock */ }

    /* Mock signup — always succeeds */
    const userData = { id: 'user-' + Date.now(), name: name || 'New User', email };
    const token = 'mock-token-' + Date.now();
    localStorage.setItem('token', token);
    localStorage.setItem('quizora_user', JSON.stringify(userData));
    setUser(userData);
    return { user: userData, token };
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('quizora_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token: localStorage.getItem('token'), login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

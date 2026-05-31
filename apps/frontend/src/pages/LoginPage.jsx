import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 bg-menti-surface rounded-2xl shadow-lg p-8">
      <h1 className="font-heading font-semibold text-3xl mb-2 text-menti-text">
        Welcome back
      </h1>
      <p className="font-body text-menti-text-weak mb-8">
        Log in to your Quizora account
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="font-body font-semibold text-sm mb-1.5 block text-menti-text-primary">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand focus:ring-2 focus:ring-menti-brand-weakest outline-none transition font-body text-sm"
          />
        </div>

        <div>
          <label htmlFor="password" className="font-body font-semibold text-sm mb-1.5 block text-menti-text-primary">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand focus:ring-2 focus:ring-menti-brand-weakest outline-none transition font-body text-sm"
          />
        </div>

        {error && (
          <p className="text-menti-coral text-sm mt-2 font-body">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-full bg-menti-brand text-white font-body font-semibold hover:bg-menti-brand-hover transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="text-center mt-6 text-sm font-body text-menti-text-weak">
        Don't have an account?{' '}
        <Link to="/signup" className="text-menti-brand font-semibold hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

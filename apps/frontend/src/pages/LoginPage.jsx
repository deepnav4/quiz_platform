import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
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
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-menti-bg">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-menti-surface rounded-2xl shadow-lg p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-heading font-semibold text-3xl text-menti-text mb-2">Welcome back</h1>
            <p className="font-body text-menti-text-weak text-sm">Log in to your Quizora account</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-50 border border-menti-coral/20">
              <p className="font-body text-sm text-menti-coral text-center">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="font-body font-semibold text-sm text-menti-text-primary block mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand focus:ring-2 focus:ring-menti-brand-weakest outline-none transition-all duration-200 font-body text-sm" />
            </div>
            <div>
              <label className="font-body font-semibold text-sm text-menti-text-primary block mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand focus:ring-2 focus:ring-menti-brand-weakest outline-none transition-all duration-200 font-body text-sm" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-full bg-menti-brand text-white font-body font-semibold text-sm hover:bg-menti-brand-hover transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging in...
                </span>
              ) : 'Log in'}
            </button>
          </form>
        </div>

        {/* Bottom link */}
        <p className="text-center mt-6 font-body text-sm text-menti-text-weak">
          Don't have an account?{' '}
          <Link to="/signup" className="text-menti-brand font-semibold hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

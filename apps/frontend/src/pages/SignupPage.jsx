import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, name);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 bg-menti-surface rounded-2xl shadow-lg p-8">
      <h1 className="font-heading font-semibold text-3xl mb-2 text-menti-text">
        Create your account
      </h1>
      <p className="font-body text-menti-text-weak mb-8">
        Sign up to start creating quizzes on Quizora
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="font-body font-semibold text-sm mb-1.5 block text-menti-text-primary">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full px-4 py-3 rounded-xl bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand focus:ring-2 focus:ring-menti-brand-weakest outline-none transition font-body text-sm"
          />
        </div>

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

        <div>
          <label htmlFor="confirmPassword" className="font-body font-semibold text-sm mb-1.5 block text-menti-text-primary">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center mt-6 text-sm font-body text-menti-text-weak">
        Already have an account?{' '}
        <Link to="/login" className="text-menti-brand font-semibold hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

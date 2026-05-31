import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await signup(email, password, name);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand focus:ring-2 focus:ring-menti-brand-weakest outline-none transition-all duration-200 font-body text-sm";

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-menti-bg">
      <div className="w-full max-w-md">
        <div className="bg-menti-surface rounded-2xl shadow-lg p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="font-heading font-semibold text-3xl text-menti-text mb-2">Create your account</h1>
            <p className="font-body text-menti-text-weak text-sm">Join Quizora and start creating interactive quizzes</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-50 border border-menti-coral/20">
              <p className="font-body text-sm text-menti-coral text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="font-body font-semibold text-sm text-menti-text-primary block mb-1.5">Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your full name" className={inputCls} />
            </div>
            <div>
              <label className="font-body font-semibold text-sm text-menti-text-primary block mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className={inputCls} />
            </div>
            <div>
              <label className="font-body font-semibold text-sm text-menti-text-primary block mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 6 characters" className={inputCls} />
            </div>
            <div>
              <label className="font-body font-semibold text-sm text-menti-text-primary block mb-1.5">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Repeat password" className={inputCls} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-full bg-menti-brand text-white font-body font-semibold text-sm hover:bg-menti-brand-hover transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 font-body text-sm text-menti-text-weak">
          Already have an account?{' '}
          <Link to="/login" className="text-menti-brand font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}

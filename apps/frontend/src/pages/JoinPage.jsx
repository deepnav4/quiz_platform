import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinSession } from '../api/session.js';

export default function JoinPage() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 8));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (joinCode.length < 4) { setError('Please enter a valid code'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await joinSession(joinCode);
      const sessionId = data.session?.id || data.id;
      if (!sessionId) {
        throw new Error('Invalid session. Please check the code and try again.');
      }
      navigate(`/session/${sessionId}/waiting`);
    } catch (err) {
      setError(err.message || 'Could not join. Check the code and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 bg-menti-bg">
      <div className="max-w-md w-full bg-menti-surface rounded-2xl shadow-lg p-8 sm:p-12 text-center">
        <div className="w-16 h-16 bg-menti-brand-weakest rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5769E7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 3h-8l-2 4h12z"/>
          </svg>
        </div>
        <h1 className="font-hero uppercase text-4xl sm:text-5xl text-menti-text mb-2">JOIN A QUIZ</h1>
        <p className="font-body text-menti-text-weak text-sm mb-8">Enter the code shared by your host to join</p>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-menti-coral/20">
            <p className="font-body text-sm text-menti-coral">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input type="tel" value={joinCode} onChange={handleChange} maxLength={8} placeholder="1234 5678" autoFocus
            className="w-full text-center text-3xl sm:text-4xl tracking-[0.25em] font-mono py-5 px-4 rounded-2xl bg-menti-surface-sunken border-2 border-menti-border-weak focus:border-menti-brand outline-none transition-colors duration-200 text-menti-text" />
          <button type="submit" disabled={loading || joinCode.length < 4}
            className="w-full mt-6 bg-menti-brand text-white py-4 rounded-full font-body font-semibold text-lg hover:bg-menti-brand-hover transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Joining...
              </span>
            ) : 'Join quiz'}
          </button>
        </form>
      </div>
    </div>
  );
}

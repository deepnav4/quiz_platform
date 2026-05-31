import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinSession } from '../api/session.js';

export default function JoinPage() {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleCodeChange(e) {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
    setJoinCode(value);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (joinCode.length < 4) {
      setError('Please enter a valid join code.');
      return;
    }

    setLoading(true);
    try {
      const data = await joinSession(joinCode);
      const sessionId = data.session?._id || data._id || data.sessionId;
      navigate(`/session/${sessionId}/waiting`);
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="max-w-md w-full bg-menti-surface rounded-2xl shadow-lg p-10 text-center">
        <h1 className="font-hero uppercase text-4xl mb-2 text-menti-text">
          JOIN A QUIZ
        </h1>
        <p className="font-body text-menti-text-weak mb-8">
          Enter the code shared by your host to join
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={8}
            value={joinCode}
            onChange={handleCodeChange}
            placeholder="1234 5678"
            className="w-full text-center text-3xl tracking-[0.3em] font-mono py-4 px-6 rounded-2xl bg-menti-surface-sunken border-2 border-menti-border-weak focus:border-menti-brand outline-none transition"
          />

          {error && (
            <p className="text-menti-coral text-sm mt-3 font-body">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || joinCode.length < 4}
            className="w-full mt-6 bg-menti-brand text-white py-4 rounded-full font-body font-semibold text-lg hover:bg-menti-brand-hover transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining…' : 'Join'}
          </button>
        </form>
      </div>
    </div>
  );
}

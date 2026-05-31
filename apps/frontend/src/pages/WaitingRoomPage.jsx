import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function WaitingRoomPage() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [joinCode] = useState(sessionId || '00000000');

  /* Mock participants for demo */
  useEffect(() => {
    const names = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey'];
    const timer = setInterval(() => {
      setParticipants(prev => {
        if (prev.length >= names.length) { clearInterval(timer); return prev; }
        return [...prev, { id: prev.length, name: names[prev.length] }];
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const handleStart = () => navigate(`/session/${sessionId}/host`);

  return (
    <div className="min-h-screen bg-menti-brand-weakest flex items-center justify-center p-4 sm:p-6">
      <div className="bg-menti-surface rounded-3xl shadow-2xl p-8 sm:p-12 text-center max-w-lg w-full">
        {/* Title */}
        <h1 className="font-hero uppercase text-4xl sm:text-5xl text-menti-text mb-2">WAITING ROOM</h1>
        <p className="font-body text-sm text-menti-text-weak mb-8">Share this code with participants</p>

        {/* Join Code */}
        <div className="bg-menti-surface-sunken rounded-2xl px-6 sm:px-8 py-5 mb-4">
          <p className="font-mono text-3xl sm:text-4xl tracking-[0.2em] text-menti-brand font-bold select-all">{joinCode}</p>
        </div>
        <p className="font-body text-xs text-menti-text-weaker mb-8">
          Go to <span className="font-semibold text-menti-brand">quizora.com/join</span> and enter this code
        </p>

        {/* Loading dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-2.5 h-2.5 rounded-full bg-menti-brand animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>

        {/* Participants */}
        <div className="mb-8">
          <p className="font-heading font-semibold text-base text-menti-text mb-4">
            {participants.length} participant{participants.length !== 1 ? 's' : ''} joined
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {participants.map(p => (
              <span key={p.id} className="bg-menti-brand-weakest text-menti-brand rounded-full px-4 py-2 font-body text-sm font-semibold animate-fade-in-up">
                {p.name}
              </span>
            ))}
          </div>
        </div>

        {/* Start Button (host only) */}
        {user && (
          <button onClick={handleStart} disabled={participants.length < 1}
            className="w-full bg-menti-brand text-white py-4 px-12 rounded-full font-body font-semibold text-lg hover:bg-menti-brand-hover transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none animate-pulse hover:animate-none">
            Start Quiz
          </button>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { onMessage } from '../api/socket.js';
import { getSession } from '../api/session.js';

export default function WaitingRoomPage() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const { socket, sendMessage, connected } = useSocket();
  const navigate = useNavigate();

  const [participants, setParticipants] = useState([]);
  const [joinCode, setJoinCode] = useState('--------');
  const [quizTitle, setQuizTitle] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);

  /* Fetch session data on mount */
  useEffect(() => {
    let cancelled = false;

    async function fetchSession() {
      try {
        const { session } = await getSession(sessionId);
        if (cancelled) return;

        setJoinCode(session.joinCode || sessionId);
        setQuizTitle(session.quiz?.title || '');

        // Determine if current user is the host
        const hostId = session.hostId || session.host?.id;
        setIsHost(user?.id && hostId && String(user.id) === String(hostId));

        // Load existing participants
        if (session.participants?.length) {
          setParticipants(
            session.participants.map(p => ({
              id: p.user?.id || p.id,
              name: p.user?.name || p.name || 'Anonymous',
            }))
          );
        }
      } catch (err) {
        if (!cancelled) setError('Failed to load session data');
        console.error('Failed to fetch session:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSession();
    return () => { cancelled = true; };
  }, [sessionId, user?.id]);

  /* Join the session via WebSocket once connected */
  useEffect(() => {
    if (connected && sessionId) {
      // ensure join is sent when socket is open
      sendMessage('join_session', { sessionId });
    }
  }, [connected, sessionId, sendMessage]);

  /* Listen for WebSocket events */
  useEffect(() => {
    if (!socket) return;

    const cleanup = onMessage(socket, (msg) => {
      switch (msg.type) {
        case 'participant_joined': {
          const { userId, name, participantCount } = msg.data || {};
          setParticipants(prev => {
            // Avoid duplicates
            if (prev.some(p => String(p.id) === String(userId))) return prev;
            return [...prev, { id: userId, name: name || 'Anonymous' }];
          });
          break;
        }

        case 'participant_left': {
          const { userId } = msg.data || {};
          setParticipants(prev => prev.filter(p => String(p.id) !== String(userId)));
          break;
        }

        case 'quiz_started': {
          // Navigate host to host view, participants to live view
          if (isHost) {
            navigate(`/session/${sessionId}/host`);
          } else {
            navigate(`/session/${sessionId}/live`);
          }
          break;
        }

        default:
          break;
      }
    });

    return cleanup;
  }, [socket, sessionId, isHost, navigate]);

  /* Host starts the quiz */
  const handleStart = () => {
    setStarting(true);
    const ok = sendMessage('start_quiz', { sessionId });
    if (!ok) {
      // If WS send failed, show a friendly error and allow retry
      console.warn('Start quiz failed: not connected to WS');
      setStarting(false);
      alert('Unable to start quiz: not connected to the real-time server. Try refreshing the page.');
      return;
    }
    // Navigation will be handled by the 'quiz_started' WS event
  };

  /* Loading state */
  if (loading) {
    return (
      <div className="min-h-screen bg-menti-brand-weakest flex items-center justify-center p-4 sm:p-6">
        <div className="bg-menti-surface rounded-3xl shadow-2xl p-8 sm:p-12 text-center max-w-lg w-full">
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-2.5 h-2.5 rounded-full bg-menti-brand animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
          <p className="font-body text-sm text-menti-text-weak mt-4">Loading session…</p>
        </div>
      </div>
    );
  }

  /* Error state */
  if (error) {
    return (
      <div className="min-h-screen bg-menti-brand-weakest flex items-center justify-center p-4 sm:p-6">
        <div className="bg-menti-surface rounded-3xl shadow-2xl p-8 sm:p-12 text-center max-w-lg w-full">
          <p className="font-body text-base text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-menti-brand text-white py-3 px-8 rounded-full font-body font-semibold text-sm hover:bg-menti-brand-hover transition-all duration-300 cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-menti-brand-weakest flex items-center justify-center p-4 sm:p-6">
      <div className="bg-menti-surface rounded-3xl shadow-2xl p-8 sm:p-12 text-center max-w-lg w-full">
        {/* Connection indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-400 animate-pulse'}`} />
          <span className="font-body text-xs text-menti-text-weaker">
            {connected ? 'Connected' : 'Reconnecting…'}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-hero uppercase text-4xl sm:text-5xl text-menti-text mb-2">WAITING ROOM</h1>
        {quizTitle && (
          <p className="font-body text-base text-menti-text font-semibold mb-1">{quizTitle}</p>
        )}
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
        {isHost && (
          <button onClick={handleStart} disabled={participants.length < 1 || starting}
            className="w-full bg-menti-brand text-white py-4 px-12 rounded-full font-body font-semibold text-lg hover:bg-menti-brand-hover transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none animate-pulse hover:animate-none">
            {starting ? 'Starting…' : 'Start Quiz'}
          </button>
        )}
      </div>
    </div>
  );
}

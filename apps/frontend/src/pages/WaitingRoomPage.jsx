import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { onMessage } from '../api/socket.js';
import { getSession, startSession } from '../api/session.js';
import { requestFullscreen } from '../hooks/useFullscreen.js';

export default function WaitingRoomPage() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const { socket, sendMessage, connected, wsError, reconnect } = useSocket();
  const navigate = useNavigate();

  const [participants, setParticipants] = useState([]);
  const [joinCode, setJoinCode] = useState('--------');
  const [quizTitle, setQuizTitle] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(null);
  const [hostId, setHostId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSession() {
      try {
        const { session } = await getSession(sessionId);
        if (cancelled) return;

        setJoinCode(session.joinCode || sessionId);
        setQuizTitle(session.quiz?.title || '');

        const sessionHostId = session.hostId || session.host?.id;
        setHostId(sessionHostId);
        setIsHost(Boolean(user?.id && sessionHostId && String(user.id) === String(sessionHostId)));

        if (session.participants?.length) {
          setParticipants(
            session.participants
              .filter((p) => String(p.userId || p.user?.id) !== String(sessionHostId))
              .map((p) => ({
                id: p.user?.id || p.userId || p.id,
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
    return () => {
      cancelled = true;
    };
  }, [sessionId, user?.id]);

  useEffect(() => {
    if (connected && sessionId) {
      sendMessage('join_session', { sessionId });
    }
  }, [connected, sessionId, sendMessage]);

  useEffect(() => {
    if (!socket) return;

    const cleanup = onMessage(socket, (msg) => {
      switch (msg.type) {
        case 'participant_joined': {
          const { userId, name, hostId: evtHostId } = msg.data || {};
          if (evtHostId && userId && String(userId) === String(evtHostId)) break;
          if (hostId && userId && String(userId) === String(hostId)) break;
          setParticipants((prev) => {
            if (prev.some((p) => String(p.id) === String(userId))) return prev;
            return [...prev, { id: userId, name: name || 'Anonymous' }];
          });
          break;
        }

        case 'participant_left': {
          const { userId, hostId: evtHostId } = msg.data || {};
          if (evtHostId && userId && String(userId) === String(evtHostId)) break;
          if (hostId && userId && String(userId) === String(hostId)) break;
          setParticipants((prev) => prev.filter((p) => String(p.id) !== String(userId)));
          break;
        }

        case 'quiz_started': {
          // Enter fullscreen for immersive quiz experience
          requestFullscreen();
          if (isHost) {
            navigate(`/session/${sessionId}/host`);
          } else {
            navigate(`/session/${sessionId}/live`);
          }
          break;
        }

        case 'error': {
          const message = msg.data?.message;
          if (message) {
            setStartError(message);
            setStarting(false);
          }
          break;
        }

        default:
          break;
      }
    });

    return cleanup;
  }, [socket, sessionId, isHost, navigate, hostId]);

  const canStart = isHost && participants.length >= 1 && connected && !wsError?.isAuthError;

  const handleStart = async () => {
    setStartError(null);
    setStarting(true);

    const wsOk = sendMessage('start_quiz', { sessionId });
    if (wsOk) return;

    // Fallback: start via HTTP when WS is down (updates DB; host can navigate manually)
    try {
      await startSession(sessionId);
      navigate(`/session/${sessionId}/host`);
    } catch (err) {
      console.error('Start quiz failed:', err);
      setStartError(
        connected
          ? 'Could not start the quiz. Please try again.'
          : 'Not connected to the real-time server. Check the connection indicator above, then retry.'
      );
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-menti-brand-weakest flex items-center justify-center p-4 sm:p-6">
        <div className="bg-menti-surface rounded-3xl shadow-2xl p-8 sm:p-12 text-center max-w-lg w-full">
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-menti-brand animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <p className="font-body text-sm text-menti-text-weak mt-4">Loading session…</p>
        </div>
      </div>
    );
  }

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
        <div className="flex flex-col items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-green-500' : wsError?.isAuthError ? 'bg-red-500' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="font-body text-xs text-menti-text-weaker">
              {connected
                ? 'Connected'
                : wsError?.isAuthError
                  ? 'Authentication failed'
                  : wsError
                    ? 'Connection lost'
                    : 'Connecting…'}
            </span>
          </div>
          {wsError?.isAuthError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center max-w-sm">
              <p className="font-body text-xs text-red-600 mb-2">
                Your login token could not be verified by the real-time server. Log in again as the
                session host (e.g. professor@university.edu / password123).
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-menti-brand text-white rounded-full px-4 py-1.5 text-xs font-body font-semibold hover:bg-menti-brand-hover transition-colors cursor-pointer"
                >
                  Re-Login
                </button>
                <button
                  onClick={reconnect}
                  className="border border-menti-border rounded-full px-4 py-1.5 text-xs font-body font-semibold text-menti-text-primary hover:bg-menti-surface-sunken transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          {!connected && wsError && !wsError.isAuthError && (
            <button
              onClick={reconnect}
              className="border border-menti-border rounded-full px-4 py-1.5 text-xs font-body font-semibold text-menti-text-primary hover:bg-menti-surface-sunken transition-colors cursor-pointer"
            >
              Retry Connection
            </button>
          )}
        </div>

        <h1 className="font-hero uppercase text-4xl sm:text-5xl text-menti-text mb-2">WAITING ROOM</h1>
        {quizTitle && (
          <p className="font-body text-base text-menti-text font-semibold mb-1">{quizTitle}</p>
        )}
        <p className="font-body text-sm text-menti-text-weak mb-8">Share this code with participants</p>

        <div className="bg-menti-surface-sunken rounded-2xl px-6 sm:px-8 py-5 mb-4">
          <p className="font-mono text-3xl sm:text-4xl tracking-[0.2em] text-menti-brand font-bold select-all">
            {joinCode}
          </p>
        </div>
        <p className="font-body text-xs text-menti-text-weaker mb-8">
          Go to <span className="font-semibold text-menti-brand">quizora.com/join</span> and enter this code
        </p>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-menti-brand animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>

        <div className="mb-8">
          <p className="font-heading font-semibold text-base text-menti-text mb-4">
            {participants.length} participant{participants.length !== 1 ? 's' : ''} joined
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {participants.map((p) => (
              <span
                key={p.id}
                className="bg-menti-brand-weakest text-menti-brand rounded-full px-4 py-2 font-body text-sm font-semibold animate-fade-in-up"
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>

        {startError && (
          <p className="font-body text-sm text-red-500 mb-4" role="alert">
            {startError}
          </p>
        )}

        {isHost && (
          <>
            {!connected && !wsError?.isAuthError && (
              <p className="font-body text-xs text-amber-600 mb-3">
                Waiting for real-time connection before you can start…
              </p>
            )}
            <button
              onClick={handleStart}
              disabled={!canStart || starting}
              className="w-full bg-menti-brand text-white py-4 px-12 rounded-full font-body font-semibold text-lg hover:bg-menti-brand-hover transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none animate-pulse hover:animate-none"
            >
              {starting ? 'Starting…' : 'Start Quiz'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

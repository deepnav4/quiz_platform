import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { getSession, startSession } from '../api/session.js';

export default function WaitingRoomPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { socket, sendMessage, connected } = useSocket();

  const [participants, setParticipants] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const isHost = sessionData?.host === user?._id;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Fetch session info
  useEffect(() => {
    if (!user) return;

    async function fetchSession() {
      try {
        const data = await getSession(sessionId);
        setSessionData(data.session);
        setJoinCode(data.session.joinCode || '');
        setParticipants(data.session.participants || []);
      } catch (err) {
        setError(err.message || 'Failed to load session');
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [sessionId, user]);

  // Join room via WebSocket
  useEffect(() => {
    if (!connected || !sessionId) return;
    sendMessage('join_session', { sessionId });
  }, [connected, sessionId, sendMessage]);

  // Listen for WS events
  const handleMessage = useCallback(
    (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'participant_joined') {
          setParticipants((prev) => {
            const exists = prev.some((p) => p._id === msg.participant._id);
            return exists ? prev : [...prev, msg.participant];
          });
        }

        if (msg.type === 'participant_left') {
          setParticipants((prev) => prev.filter((p) => p._id !== msg.participantId));
        }

        if (msg.type === 'session_started') {
          if (isHost) {
            navigate(`/session/${sessionId}/host`);
          } else {
            navigate(`/session/${sessionId}/live`);
          }
        }
      } catch {
        // ignore non-JSON
      }
    },
    [sessionId, navigate, isHost]
  );

  useEffect(() => {
    if (!socket) return;
    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, handleMessage]);

  async function handleStartQuiz() {
    setStarting(true);
    setError('');
    try {
      await startSession(sessionId);
      navigate(`/session/${sessionId}/host`);
    } catch (err) {
      setError(err.message || 'Failed to start session');
      setStarting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-menti-brand-weakest flex items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-menti-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-menti-brand-weakest flex items-center justify-center p-6">
      <div className="bg-menti-surface rounded-3xl shadow-2xl p-12 text-center max-w-lg w-full">
        {/* Title */}
        <h1 className="font-hero uppercase text-4xl lg:text-5xl mb-6 text-menti-text-primary tracking-wide">
          WAITING ROOM
        </h1>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-menti-coral font-body text-sm">
            {error}
          </div>
        )}

        {/* Join Code */}
        <div className="bg-menti-surface-sunken rounded-2xl px-8 py-4 mb-8">
          <p className="font-mono text-4xl tracking-widest text-menti-brand font-bold select-all">
            {joinCode || '------'}
          </p>
        </div>
        <p className="font-body text-sm text-menti-text-weak mb-6">
          Share this code with participants
        </p>

        {/* Animated loading dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span
            className="w-3 h-3 rounded-full bg-menti-brand animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-3 h-3 rounded-full bg-menti-brand animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-3 h-3 rounded-full bg-menti-brand animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>

        {/* Participants */}
        <div className="mt-8">
          <p className="font-heading font-semibold text-lg mb-4 text-menti-text-primary">
            {participants.length} {participants.length === 1 ? 'Participant' : 'Participants'}
          </p>

          {participants.length > 0 ? (
            <div className="flex flex-wrap gap-2 justify-center">
              {participants.map((p) => (
                <span
                  key={p._id}
                  className="bg-menti-brand-weakest rounded-full px-4 py-2 font-body text-sm font-semibold text-menti-brand"
                >
                  {p.name || p.email || 'Anonymous'}
                </span>
              ))}
            </div>
          ) : (
            <p className="font-body text-sm text-menti-text-weaker">
              Waiting for participants to join...
            </p>
          )}
        </div>

        {/* Host Start Button */}
        {isHost && (
          <button
            onClick={handleStartQuiz}
            disabled={starting || participants.length === 0}
            className="mt-8 bg-menti-brand text-white py-4 px-12 rounded-full font-body font-semibold text-lg hover:bg-menti-brand-hover animate-pulse disabled:opacity-60 disabled:animate-none transition-colors cursor-pointer"
          >
            {starting ? 'Starting...' : 'Start Quiz'}
          </button>
        )}

        {/* Connection status */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-menti-positive' : 'bg-menti-coral'
            }`}
          />
          <span className="font-body text-xs text-menti-text-weaker">
            {connected ? 'Connected' : 'Reconnecting...'}
          </span>
        </div>
      </div>
    </div>
  );
}

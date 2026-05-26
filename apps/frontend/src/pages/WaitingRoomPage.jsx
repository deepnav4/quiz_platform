import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useSession } from '../hooks/useSession.js';
import { onMessage } from '../api/socket.js';

export default function WaitingRoomPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, sendMessage, connected } = useSocket();
  const { session, loading, error } = useSession(sessionId);
  const [participants, setParticipants] = useState([]);
  const [joined, setJoined] = useState(false);

  // Join the WS room
  useEffect(() => {
    if (connected && !joined) {
      sendMessage('join_session', { sessionId });
      setJoined(true);
    }
  }, [connected, sessionId, joined]);

  // Load initial participants
  useEffect(() => {
    if (session?.participants) {
      setParticipants(session.participants);
    }
  }, [session]);

  // Listen for WS events
  useEffect(() => {
    if (!socket) return;
    return onMessage(socket, (msg) => {
      if (msg.type === 'participant_joined') {
        setParticipants(prev => {
          if (prev.find(p => p.user?.id === msg.data.userId || p.userId === msg.data.userId)) return prev;
          return [...prev, { userId: msg.data.userId, user: { name: msg.data.name, id: msg.data.userId }, totalScore: 0, isActive: true }];
        });
      }
      if (msg.type === 'participant_left') {
        setParticipants(prev => prev.filter(p => (p.user?.id || p.userId) !== msg.data.userId));
      }
      if (msg.type === 'quiz_started') {
        const isHost = session?.hostId === user?.id;
        navigate(isHost ? `/session/${sessionId}/host` : `/session/${sessionId}/live`);
      }
    });
  }, [socket, session, user]);

  const isHost = session?.hostId === user?.id;

  function handleStart() {
    sendMessage('start_quiz', { sessionId });
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
      <h1>Waiting Room</h1>
      <h2>{session?.quiz?.title}</h2>
      <p style={{ fontSize: 32, fontFamily: 'monospace', background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
        Join Code: <strong>{session?.joinCode}</strong>
      </p>

      <h3>Participants ({participants.length})</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {participants.map((p, i) => (
          <li key={p.userId || i} style={{ padding: '4px 0' }}>
            {p.user?.name || 'Player'}
          </li>
        ))}
      </ul>

      {isHost && (
        <button onClick={handleStart} style={{ padding: '12px 30px', fontSize: 18, marginTop: 20, background: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Start Quiz
        </button>
      )}
      {!isHost && <p>Waiting for host to start...</p>}
    </div>
  );
}

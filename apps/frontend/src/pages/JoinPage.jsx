import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinSession } from '../api/session.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function JoinPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!user) { navigate('/login'); return; }
    try {
      const data = await joinSession(joinCode);
      navigate(`/session/${data.session.id}/waiting`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', textAlign: 'center' }}>
      <h1>Join a Quiz</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Enter 8-digit join code" required maxLength={8} style={{ padding: 12, fontSize: 24, textAlign: 'center', width: '100%', letterSpacing: 4 }} />
        <br/><br/>
        <button type="submit" style={{ padding: '10px 30px', fontSize: 16 }}>Join</button>
      </form>
    </div>
  );
}

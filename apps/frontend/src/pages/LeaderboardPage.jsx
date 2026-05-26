import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLeaderboard } from '../api/result.js';

export default function LeaderboardPage() {
  const { sessionId } = useParams();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard(sessionId)
      .then(d => setLeaderboard(d.leaderboard || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 500, margin: '20px auto' }}>
      <h1>🏆 Leaderboard</h1>
      <Link to={`/session/${sessionId}/results`}><button style={{ marginBottom: 16, padding: '8px 16px' }}>View Results</button></Link>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #333' }}>
            <th style={{ padding: 8, textAlign: 'left' }}>Rank</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Player</th>
            <th style={{ padding: 8, textAlign: 'right' }}>Score</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, i) => (
            <tr key={entry.userId} style={{ borderBottom: '1px solid #eee', background: i < 3 ? '#fffbea' : 'transparent' }}>
              <td style={{ padding: 8, fontSize: 18 }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : entry.rank}
              </td>
              <td style={{ padding: 8 }}>{entry.name}</td>
              <td style={{ padding: 8, textAlign: 'right', fontWeight: 'bold' }}>{entry.totalScore}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {leaderboard.length === 0 && <p>No participants yet.</p>}

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <Link to="/"><button style={{ padding: '8px 20px' }}>Back to Dashboard</button></Link>
      </div>
    </div>
  );
}

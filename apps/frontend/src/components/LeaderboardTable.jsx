export default function LeaderboardTable({ leaderboard = [] }) {
  return (
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
          <tr key={entry.userId || i} style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: 8 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : entry.rank || i + 1}</td>
            <td style={{ padding: 8 }}>{entry.name}</td>
            <td style={{ padding: 8, textAlign: 'right', fontWeight: 'bold' }}>{entry.totalScore}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

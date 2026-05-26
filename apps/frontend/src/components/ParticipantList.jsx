export default function ParticipantList({ participants = [] }) {
  return (
    <div>
      <h3>Participants ({participants.length})</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {participants.map((p, i) => (
          <li key={p.userId || p.user?.id || i} style={{ padding: '4px 0' }}>
            {p.user?.name || p.name || 'Player'} {p.isActive === false && <small>(disconnected)</small>}
          </li>
        ))}
      </ul>
      {participants.length === 0 && <p>No participants yet.</p>}
    </div>
  );
}

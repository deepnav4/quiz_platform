import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getLeaderboard } from '../api/result.js';

export default function LeaderboardPage() {
  const { sessionId } = useParams();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data for development / fallback
  const mockLeaderboard = [
    { id: '1', name: 'Alice Johnson', score: 2400, accuracy: 95 },
    { id: '2', name: 'Bob Smith', score: 2100, accuracy: 88 },
    { id: '3', name: 'Charlie Brown', score: 1900, accuracy: 82 },
    { id: '4', name: 'Diana Prince', score: 1750, accuracy: 78 },
    { id: '5', name: 'Eve Williams', score: 1600, accuracy: 72 },
    { id: '6', name: 'Frank Castle', score: 1400, accuracy: 65 },
    { id: '7', name: 'Grace Lee', score: 1200, accuracy: 60 },
    { id: '8', name: 'Hank Pym', score: 1000, accuracy: 55 },
  ];

  useEffect(() => {
    getLeaderboard(sessionId)
      .then((data) => {
        setLeaderboard(data.leaderboard ?? data ?? []);
        setLoading(false);
      })
      .catch(() => {
        setLeaderboard(mockLeaderboard);
        setLoading(false);
      });
  }, [sessionId]);

  const data = leaderboard.length > 0 ? leaderboard : mockLeaderboard;
  const top3 = data.slice(0, 3);
  const rest = data.slice(3);

  // Podium order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  const podiumConfig = [
    {
      bg: 'bg-gray-100',
      size: 'w-40 h-48',
      rankSize: 'font-hero text-3xl',
      avatarSize: 'w-14 h-14',
      scoreStyle: 'font-heading text-xl text-menti-text-primary',
      medal: '🥈',
    },
    {
      bg: 'bg-gradient-to-b from-yellow-300 to-yellow-400',
      size: 'w-48 h-60',
      rankSize: 'font-hero text-4xl',
      avatarSize: 'w-16 h-16',
      scoreStyle: 'font-hero text-3xl text-menti-brand',
      medal: '👑',
    },
    {
      bg: 'bg-amber-100',
      size: 'w-40 h-44',
      rankSize: 'font-hero text-3xl',
      avatarSize: 'w-14 h-14',
      scoreStyle: 'font-heading text-xl text-menti-text-primary',
      medal: '🥉',
    },
  ];

  const podiumRanks = [2, 1, 3];

  if (loading) {
    return (
      <div className="min-h-screen bg-menti-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-menti-brand-weakest border-t-menti-brand rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-6 text-center">
      {/* Title */}
      <h1 className="font-hero uppercase text-5xl text-menti-text-primary mb-10 leading-none">
        🏆 LEADERBOARD
      </h1>

      {/* ── Podium ── */}
      {top3.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-12">
          {podiumOrder.map((player, i) => {
            const config = podiumConfig[i];
            const rank = podiumRanks[i];
            return (
              <div
                key={player.id}
                className={`${config.bg} rounded-2xl ${config.size} flex flex-col items-center justify-end p-4 md:p-6 transition-all`}
              >
                <span className="text-2xl mb-1">{config.medal}</span>
                <span className={`${config.rankSize} text-menti-text-primary leading-none mb-2`}>
                  {rank}
                </span>
                {/* Avatar placeholder */}
                <div
                  className={`${config.avatarSize} rounded-full bg-menti-border mx-auto mb-2 flex items-center justify-center text-white font-body font-semibold text-lg`}
                  style={{ backgroundColor: rank === 1 ? '#5769E7' : rank === 2 ? '#888' : '#B87333' }}
                >
                  {player.name?.charAt(0) ?? '?'}
                </div>
                <p className="font-body font-semibold text-sm truncate max-w-full">
                  {player.name}
                </p>
                <p className={config.scoreStyle}>{player.score}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Rest of Leaderboard ── */}
      <div className="space-y-2 mb-10">
        {rest.map((player, i) => (
          <div
            key={player.id}
            className="bg-menti-surface rounded-xl p-4 flex items-center gap-4 border border-menti-border-weak hover:shadow-sm transition-shadow"
          >
            {/* Rank */}
            <span className="font-heading font-semibold text-lg w-8 text-menti-text-weak">
              {i + 4}
            </span>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-menti-border-weak flex items-center justify-center font-body font-semibold text-menti-text-weak flex-shrink-0">
              {player.name?.charAt(0) ?? '?'}
            </div>

            {/* Name */}
            <span className="font-body font-semibold flex-1 text-left text-menti-text-primary truncate">
              {player.name}
            </span>

            {/* Score */}
            <span className="font-body font-semibold text-menti-brand flex-shrink-0">
              {player.score}
            </span>

            {/* Accuracy Bar */}
            <div className="w-24 h-2 bg-menti-border-weak rounded-full overflow-hidden flex-shrink-0">
              <div
                className="bg-menti-brand h-full rounded-full transition-all duration-700"
                style={{ width: `${player.accuracy ?? 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom Actions ── */}
      <div className="flex gap-4 justify-center mt-8 flex-wrap">
        <Link
          to="/dashboard"
          className="border border-menti-border rounded-full px-8 py-3 font-body font-semibold text-menti-text-primary hover:bg-menti-surface-sunken transition-colors"
        >
          Back to Dashboard
        </Link>
        <Link
          to="/dashboard"
          className="bg-menti-brand text-white rounded-full px-8 py-3 font-body font-semibold hover:bg-menti-brand-hover transition-colors"
        >
          Play Again
        </Link>
      </div>
    </div>
  );
}

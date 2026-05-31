import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Alice Johnson', score: 48, accuracy: 96, avatar: 'A' },
  { rank: 2, name: 'Bob Smith', score: 42, accuracy: 84, avatar: 'B' },
  { rank: 3, name: 'Charlie Davis', score: 38, accuracy: 76, avatar: 'C' },
  { rank: 4, name: 'Diana Lee', score: 35, accuracy: 70, avatar: 'D' },
  { rank: 5, name: 'Ethan Brown', score: 30, accuracy: 60, avatar: 'E' },
  { rank: 6, name: 'Fiona Clark', score: 28, accuracy: 56, avatar: 'F' },
  { rank: 7, name: 'George White', score: 25, accuracy: 50, avatar: 'G' },
];

const MEDAL = ['🥇', '🥈', '🥉'];
const PODIUM_STYLES = [
  'bg-gradient-to-b from-yellow-300 to-yellow-400 h-56 sm:h-64 order-2',
  'bg-gray-100 h-44 sm:h-48 order-1',
  'bg-amber-100 h-40 sm:h-44 order-3',
];

export default function LeaderboardPage() {
  const { sessionId } = useParams();
  const top3 = MOCK_LEADERBOARD.slice(0, 3);
  const rest = MOCK_LEADERBOARD.slice(3);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 bg-menti-bg min-h-[80vh]">
      <h1 className="font-hero uppercase text-4xl sm:text-5xl text-menti-text text-center mb-2">🏆 LEADERBOARD</h1>
      <p className="font-body text-sm text-menti-text-weak text-center mb-10">Final standings</p>

      {/* Podium */}
      <div className="flex items-end justify-center gap-3 sm:gap-4 mb-12 px-4">
        {[top3[1], top3[0], top3[2]].map((p, displayIdx) => {
          const actualIdx = [1, 0, 2][displayIdx];
          if (!p) return null;
          return (
            <div key={p.rank} className={`${PODIUM_STYLES[actualIdx]} rounded-2xl p-4 sm:p-6 text-center flex flex-col items-center justify-end w-28 sm:w-40`}>
              <span className="text-2xl sm:text-3xl mb-1">{MEDAL[actualIdx]}</span>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/60 flex items-center justify-center font-heading font-semibold text-lg text-menti-text mb-2">
                {p.avatar}
              </div>
              <p className="font-body font-semibold text-sm text-menti-text truncate w-full">{p.name.split(' ')[0]}</p>
              <p className="font-hero text-xl sm:text-2xl text-menti-brand mt-1">{p.score}</p>
              <p className="font-body text-xs text-menti-text-weak">{p.accuracy}%</p>
            </div>
          );
        })}
      </div>

      {/* Rest of leaderboard */}
      <div className="flex flex-col gap-2">
        {rest.map(p => (
          <div key={p.rank} className="bg-menti-surface rounded-xl p-4 flex items-center gap-4 border border-menti-border-weak hover:shadow-sm transition-shadow duration-200">
            <span className="font-heading font-semibold text-lg text-menti-text-weak w-8 text-center">{p.rank}</span>
            <div className="w-10 h-10 rounded-full bg-menti-brand-weakest flex items-center justify-center font-heading font-semibold text-sm text-menti-brand">{p.avatar}</div>
            <span className="font-body font-semibold text-sm text-menti-text flex-1">{p.name}</span>
            <span className="font-body font-semibold text-sm text-menti-brand">{p.score} pts</span>
            <div className="w-20 hidden sm:block">
              <div className="w-full h-2 bg-menti-border-weak rounded-full overflow-hidden">
                <div className="h-full bg-menti-brand rounded-full transition-all duration-700" style={{ width: `${p.accuracy}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center mt-10">
        <Link to="/dashboard" className="border border-menti-border px-8 py-3 rounded-full font-body font-semibold text-sm text-menti-text-primary hover:bg-menti-surface-sunken transition-colors duration-200">
          Back to Dashboard
        </Link>
        <Link to="/" className="bg-menti-brand text-white px-8 py-3 rounded-full font-body font-semibold text-sm hover:bg-menti-brand-hover transition-colors duration-200">
          Play Again
        </Link>
      </div>
    </div>
  );
}

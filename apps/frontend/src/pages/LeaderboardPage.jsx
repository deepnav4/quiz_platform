import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLeaderboard } from '../api/result.js';

const MEDAL = ['🥇', '🥈', '🥉'];
const PODIUM_STYLES = [
  'bg-gradient-to-b from-yellow-300 to-yellow-400 h-56 sm:h-64 order-2',
  'bg-gray-100 h-44 sm:h-48 order-1',
  'bg-amber-100 h-40 sm:h-44 order-3',
];

export default function LeaderboardPage() {
  const { sessionId } = useParams();

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLeaderboard(sessionId);
      setLeaderboard(data.leaderboard ?? []);
    } catch (err) {
      setError(err.message || 'Failed to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------- Loading state ---------- */
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 bg-menti-bg min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-menti-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-body text-sm text-menti-text-weak">Loading leaderboard…</p>
        </div>
      </div>
    );
  }

  /* ---------- Error state ---------- */
  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 bg-menti-bg min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <p className="font-body text-base text-menti-coral mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="bg-menti-brand text-white px-8 py-3 rounded-full font-body font-semibold text-sm hover:bg-menti-brand-hover transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ---------- Empty state ---------- */
  if (leaderboard.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 bg-menti-bg min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <p className="font-hero text-4xl mb-4">🏆</p>
          <p className="font-body text-sm text-menti-text-weak mb-6">No leaderboard data available yet.</p>
          <Link to="/dashboard" className="border border-menti-border px-8 py-3 rounded-full font-body font-semibold text-sm text-menti-text-primary hover:bg-menti-surface-sunken transition-colors duration-200">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- Derive max score for accuracy bar ---------- */
  const maxScore = leaderboard.length > 0 ? leaderboard[0].totalScore : 1;

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  /** Avatar helper: use provided avatar URL or first letter fallback */
  function renderAvatar(player, sizeClasses, textClasses, bgClasses) {
    if (player.avatar && player.avatar.startsWith('http')) {
      return (
        <img
          src={player.avatar}
          alt={player.name}
          className={`${sizeClasses} rounded-full object-cover`}
        />
      );
    }
    const letter = player.name ? player.name.charAt(0).toUpperCase() : '?';
    return (
      <div className={`${sizeClasses} rounded-full ${bgClasses} flex items-center justify-center ${textClasses}`}>
        {player.avatar || letter}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 bg-menti-bg min-h-[80vh]">
      <h1 className="font-hero uppercase text-4xl sm:text-5xl text-menti-text text-center mb-2">🏆 LEADERBOARD</h1>
      <p className="font-body text-sm text-menti-text-weak text-center mb-10">Final standings</p>

      {/* Podium */}
      <div className="flex items-end justify-center gap-3 sm:gap-4 mb-12 px-4">
        {[top3[1], top3[0], top3[2]].map((p, displayIdx) => {
          const actualIdx = [1, 0, 2][displayIdx];
          if (!p) return null;
          const accuracy = maxScore > 0 ? Math.round((p.totalScore / maxScore) * 100) : 0;
          return (
            <div key={p.rank ?? p.userId} className={`${PODIUM_STYLES[actualIdx]} rounded-2xl p-4 sm:p-6 text-center flex flex-col items-center justify-end w-28 sm:w-40`}>
              <span className="text-2xl sm:text-3xl mb-1">{MEDAL[actualIdx]}</span>
              {renderAvatar(
                p,
                'w-12 h-12 sm:w-14 sm:h-14',
                'font-heading font-semibold text-lg text-menti-text',
                'bg-white/60'
              )}
              <p className="font-body font-semibold text-sm text-menti-text truncate w-full mt-2">{p.name?.split(' ')[0] ?? 'Player'}</p>
              <p className="font-hero text-xl sm:text-2xl text-menti-brand mt-1">{p.totalScore}</p>
              <p className="font-body text-xs text-menti-text-weak">{accuracy}%</p>
            </div>
          );
        })}
      </div>

      {/* Rest of leaderboard */}
      <div className="flex flex-col gap-2">
        {rest.map(p => {
          const accuracy = maxScore > 0 ? Math.round((p.totalScore / maxScore) * 100) : 0;
          const avatarLetter = p.name ? p.name.charAt(0).toUpperCase() : '?';
          return (
            <div key={p.rank ?? p.userId} className="bg-menti-surface rounded-xl p-4 flex items-center gap-4 border border-menti-border-weak hover:shadow-sm transition-shadow duration-200">
              <span className="font-heading font-semibold text-lg text-menti-text-weak w-8 text-center">{p.rank}</span>
              {p.avatar && p.avatar.startsWith('http') ? (
                <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-menti-brand-weakest flex items-center justify-center font-heading font-semibold text-sm text-menti-brand">
                  {p.avatar || avatarLetter}
                </div>
              )}
              <span className="font-body font-semibold text-sm text-menti-text flex-1">{p.name}</span>
              <span className="font-body font-semibold text-sm text-menti-brand">{p.totalScore} pts</span>
              <div className="w-20 hidden sm:block">
                <div className="w-full h-2 bg-menti-border-weak rounded-full overflow-hidden">
                  <div className="h-full bg-menti-brand rounded-full transition-all duration-700" style={{ width: `${accuracy}%` }} />
                </div>
              </div>
            </div>
          );
        })}
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

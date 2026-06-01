import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getResults, getLeaderboard } from '../api/result.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ResultsPage() {
  const { sessionId } = useParams();
  const { user } = useAuth();

  const [results, setResults] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resData, lbData] = await Promise.all([
        getResults(sessionId),
        getLeaderboard(sessionId),
      ]);
      setResults(resData.results ?? []);
      setLeaderboard(lbData.leaderboard ?? []);
    } catch (err) {
      setError(err.message || 'Failed to load results. Please try again.');
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 bg-menti-bg min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-menti-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-body text-sm text-menti-text-weak">Loading results…</p>
        </div>
      </div>
    );
  }

  /* ---------- Error state ---------- */
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 bg-menti-bg min-h-[80vh] flex items-center justify-center">
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

  /* ---------- Derived values ---------- */
  const totalQuestions = results.length;
  const totalCorrect = results.reduce((sum, r) => sum + (r.correctResponses ?? 0), 0);
  const totalResponses = results.reduce((sum, r) => sum + (r.totalResponses ?? 0), 0);
  const overallAccuracy = totalResponses > 0 ? Math.round((totalCorrect / totalResponses) * 100) : 0;

  // Find current user in leaderboard
  const myEntry = leaderboard.find((e) => e.userId === user?.id);

  const summaryCards = [
    { label: 'Questions', value: totalQuestions, bg: 'bg-menti-brand-weakest', color: 'text-menti-brand' },
    { label: 'Correct', value: totalCorrect, bg: 'bg-green-50', color: 'text-menti-positive' },
    {
      label: 'Score',
      value: myEntry ? myEntry.totalScore : `${totalCorrect}/${totalResponses}`,
      bg: 'bg-menti-brand-weakest',
      color: 'text-menti-brand',
    },
    { label: 'Accuracy', value: `${overallAccuracy}%`, bg: 'bg-menti-brand-weakest', color: 'text-menti-brand' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 bg-menti-bg min-h-[80vh]">
      <h1 className="font-heading font-semibold text-2xl sm:text-3xl text-menti-text mb-8">Quiz Results</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {summaryCards.map(c => (
          <div key={c.label} className={`${c.bg} rounded-2xl p-5 sm:p-6 text-center`}>
            <p className={`font-hero text-3xl sm:text-4xl ${c.color}`}>{c.value}</p>
            <p className="font-body text-xs text-menti-text-weak mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* User rank banner */}
      {myEntry && (
        <div className="bg-menti-brand-weakest rounded-2xl p-5 sm:p-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-menti-brand flex items-center justify-center font-heading font-semibold text-sm text-white">
              {myEntry.avatar || (myEntry.name ? myEntry.name.charAt(0).toUpperCase() : '#')}
            </div>
            <div>
              <p className="font-body font-semibold text-sm text-menti-text">{myEntry.name}</p>
              <p className="font-body text-xs text-menti-text-weak">Your ranking</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-hero text-2xl text-menti-brand">#{myEntry.rank}</p>
            <p className="font-body text-xs text-menti-text-weak">{myEntry.totalScore} pts</p>
          </div>
        </div>
      )}

      {/* Per-Question Results */}
      <h2 className="font-heading font-semibold text-lg text-menti-text mb-4">Question Breakdown</h2>

      {results.length === 0 && (
        <p className="font-body text-sm text-menti-text-weak mb-6">No question results available for this session.</p>
      )}

      {results.map((r, i) => {
        const rate = r.correctionRate ?? (r.totalResponses > 0 ? Math.round((r.correctResponses / r.totalResponses) * 100) : 0);
        const isGood = rate >= 50;
        return (
          <div
            key={r.questionId ?? i}
            className={`bg-menti-surface rounded-2xl p-5 sm:p-6 border mb-4 transition-shadow duration-300 hover:shadow-sm
              ${isGood ? 'border-menti-border-weak border-l-4 border-l-menti-positive' : 'border-menti-border-weak border-l-4 border-l-menti-coral'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-body font-semibold text-base text-menti-text mb-3">
                  {r.question?.order != null ? `Q${r.question.order}. ` : `Q${i + 1}. `}
                  {r.question?.text ?? 'Question'}
                </h3>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
                  <div>
                    <span className="font-body text-xs text-menti-text-weaker block">Total responses</span>
                    <span className="font-body text-sm font-semibold text-menti-text">{r.totalResponses ?? 0}</span>
                  </div>
                  <div>
                    <span className="font-body text-xs text-menti-text-weaker block">Correct</span>
                    <span className="font-body text-sm font-semibold text-menti-positive">{r.correctResponses ?? 0}</span>
                  </div>
                  {r.question?.questionType && (
                    <div>
                      <span className="font-body text-xs text-menti-text-weaker block">Type</span>
                      <span className="font-body text-sm font-semibold text-menti-text">{r.question.questionType}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-body font-semibold ${isGood ? 'bg-green-50 text-menti-positive' : 'bg-red-50 text-menti-coral'}`}
                >
                  {rate}% correct
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mt-8">
        <Link to={`/session/${sessionId}/leaderboard`} className="bg-menti-brand text-white px-8 py-3 rounded-full font-body font-semibold text-sm hover:bg-menti-brand-hover transition-colors duration-200">
          View Leaderboard
        </Link>
        <Link to="/dashboard" className="border border-menti-border px-8 py-3 rounded-full font-body font-semibold text-sm text-menti-text-primary hover:bg-menti-surface-sunken transition-colors duration-200">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

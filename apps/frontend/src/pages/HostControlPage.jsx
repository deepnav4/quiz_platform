import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { onMessage } from '../api/socket.js';
import { getSession } from '../api/session.js';
import LiveLeaderboard from '../components/LiveLeaderboard.jsx';
import HostVoteBars from '../components/HostVoteBars.jsx';

export default function HostControlPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, sendMessage, connected } = useSocket();
  const hostIdRef = useRef(null);

  // Session state
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Question state
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Participant & response state
  const [participantCount, setParticipantCount] = useState(0);
  const [responseCount, setResponseCount] = useState(0);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(null);
  const [timeUp, setTimeUp] = useState(false);
  const timerRef = useRef(null);

  // Control state
  const [isPaused, setIsPaused] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // View state: 'question' | 'results' | 'leaderboard'
  const [view, setView] = useState('question');

  // Question result data (from question_result event)
  const [questionResult, setQuestionResult] = useState(null);

  // Leaderboard data (from leaderboard_update event)
  const [leaderboard, setLeaderboard] = useState([]);

  // Live votes: optionId -> [{ userId, name }]
  const [votesByOption, setVotesByOption] = useState({});
  const [voteStats, setVoteStats] = useState(null);

  // ---------- Fetch session on mount ----------
  useEffect(() => {
    let cancelled = false;
    async function fetchSession() {
      try {
        const res = await getSession(sessionId);
        if (!cancelled) {
          setSession(res.session);
          hostIdRef.current = res.session.hostId || res.session.host?.id;
          const nonHost =
            res.session.participants?.filter(
              (p) => String(p.userId) !== String(res.session.hostId)
            ) ?? [];
          setParticipantCount(
            res.session.participantCount ?? nonHost.filter((p) => p.isActive !== false).length
          );
        }
      } catch (err) {
        if (!cancelled) setError('Failed to load session.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSession();
    return () => { cancelled = true; };
  }, [sessionId]);

  // ---------- Join session via WS once connected ----------
  useEffect(() => {
    if (connected) {
      sendMessage('join_session', { sessionId });
    }
  }, [connected, sessionId, sendMessage]);

  // ---------- WebSocket event listeners ----------
  useEffect(() => {
    const cleanup = onMessage(socket, (msg) => {
      const { type, data } = msg;
      const hostId = hostIdRef.current;
      const isHostEvent =
        !data?.hostId || !hostId || String(data.hostId) === String(hostId);
      const isMeHost = hostId && user?.id && String(hostId) === String(user.id);

      switch (type) {
        case 'question_started': {
          setCurrentQuestion(data);
          setQuestionIndex(data.questionIndex ?? 0);
          setTotalQuestions(data.totalQuestions ?? 0);
          setResponseCount(0);
          setVotesByOption({});
          setVoteStats(null);
          setTimeUp(false);
          setQuestionResult(null);
          setLeaderboard([]);
          setView('question');

          // Start local countdown if time-limited
          if (data.hasTimeLimit && data.timeLimitSeconds > 0) {
            setTimeLeft(data.timeLimitSeconds);
          } else {
            setTimeLeft(null);
          }
          break;
        }

        case 'response_count':
        case 'host_response_count': {
          if (!isHostEvent || !isMeHost) break;
          setResponseCount(data.count ?? 0);
          if (data.total != null) setParticipantCount(data.total);
          break;
        }

        case 'host_participant_voted': {
          if (!isHostEvent || !isMeHost) break;
          const { userId, name, optionIds } = data || {};
          if (!optionIds?.length) break;
          setVotesByOption((prev) => {
            const next = { ...prev };
            for (const optId of optionIds) {
              const list = next[optId] ? [...next[optId]] : [];
              if (!list.some((v) => String(v.userId) === String(userId))) {
                list.push({ userId, name: name || 'Player' });
              }
              next[optId] = list;
            }
            return next;
          });
          break;
        }

        case 'vote_stats':
        case 'host_vote_stats': {
          if (!isHostEvent || !isMeHost) break;
          setVoteStats(data);
          if (data?.options) {
            setVotesByOption((prev) => {
              const merged = { ...prev };
              for (const o of data.options) {
                const existing = merged[o.id] || [];
                const ids = new Set(existing.map((v) => String(v.userId)));
                const combined = [...existing];
                for (const v of o.voters || []) {
                  if (!ids.has(String(v.userId))) combined.push(v);
                }
                merged[o.id] = combined;
              }
              return merged;
            });
          }
          if (data?.revealCorrect) setTimeUp(true);
          break;
        }

        case 'session_joined': {
          if (data?.participantCount != null) setParticipantCount(data.participantCount);
          break;
        }

        case 'time_up':
        case 'host_time_up': {
          if (type === 'host_time_up' && (!isHostEvent || !isMeHost)) break;
          setTimeUp(true);
          setTimeLeft(0);
          clearInterval(timerRef.current);
          break;
        }

        case 'participant_joined': {
          if (data?.userId && hostId && String(data.userId) === String(hostId)) break;
          if (data?.participantCount != null) {
            setParticipantCount(data.participantCount);
          } else {
            setParticipantCount((prev) => prev + 1);
          }
          break;
        }

        case 'participant_left': {
          if (data?.userId && hostId && String(data.userId) === String(hostId)) break;
          if (data?.participantCount != null) {
            setParticipantCount(data.participantCount);
          } else {
            setParticipantCount((prev) => Math.max(0, prev - 1));
          }
          break;
        }

        case 'leaderboard_update': {
          setLeaderboard(data.leaderboard || []);
          setView('leaderboard');
          break;
        }

        case 'question_result': {
          setQuestionResult(data);
          setView('results');
          break;
        }

        case 'quiz_ended': {
          navigate(`/session/${sessionId}/results`);
          break;
        }

        default:
          break;
      }
    });

    return cleanup;
  }, [socket, sessionId, navigate, user?.id]);

  // ---------- Local countdown timer ----------
  useEffect(() => {
    clearInterval(timerRef.current);
    if (timeLeft === null || timeLeft <= 0 || isPaused) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft !== null && timeLeft > 0, isPaused]);

  // ---------- Control handlers ----------
  const handleNextQuestion = useCallback(() => {
    sendMessage('next_question', { sessionId });
  }, [sendMessage, sessionId]);

  const handlePause = useCallback(() => {
    sendMessage('pause_quiz', { sessionId });
    setIsPaused(true);
  }, [sendMessage, sessionId]);

  const handleResume = useCallback(() => {
    sendMessage('resume_quiz', { sessionId });
    setIsPaused(false);
  }, [sendMessage, sessionId]);

  const handleEndQuiz = useCallback(() => {
    sendMessage('end_quiz', { sessionId });
    navigate(`/session/${sessionId}/results`);
  }, [sendMessage, sessionId, navigate]);

  const handleShowResults = useCallback(() => {
    if (currentQuestion) {
      sendMessage('get_question_result', { sessionId, questionId: currentQuestion.questionId });
    }
  }, [sendMessage, sessionId, currentQuestion]);

  const handleShowLeaderboard = useCallback(() => {
    sendMessage('get_leaderboard', { sessionId });
  }, [sendMessage, sessionId]);

  const handleRevealAnswers = useCallback(() => {
    if (currentQuestion?.questionId) {
      sendMessage('reveal_answers', { sessionId, questionId: currentQuestion.questionId });
    }
  }, [sendMessage, sessionId, currentQuestion]);

  const isMcqOrTf =
    currentQuestion &&
    ['MULTIPLE_CHOICE_SINGLE', 'MULTIPLE_CHOICE_MULTI', 'TRUE_FALSE'].includes(
      currentQuestion.questionType
    );

  const barOptions = useMemo(() => {
    if (!currentQuestion?.options?.length) return [];
    if (voteStats?.options?.length) {
      return voteStats.options.map((o) => ({
        ...o,
        voters: votesByOption[o.id] || o.voters || [],
      }));
    }
    return currentQuestion.options.map((o) => {
      const count = (votesByOption[o.id] || []).length;
      return {
        ...o,
        count,
        percent: responseCount > 0 ? Math.round((count / responseCount) * 100) : 0,
        voters: votesByOption[o.id] || [],
      };
    });
  }, [currentQuestion, voteStats, votesByOption, responseCount]);

  const handleBackToQuestion = useCallback(() => {
    setView('question');
  }, []);

  // ---------- Derived values ----------
  const joinCode = session?.joinCode || '—';

  // Format timer display
  const formatTime = (s) => {
    if (s === null) return null;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ---------- Loading / Error ----------
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-menti-bg">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-menti-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-body text-menti-text-weak">Loading session…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-menti-bg">
        <div className="bg-menti-surface rounded-2xl p-8 text-center border border-menti-border-weak max-w-md">
          <p className="font-body text-menti-coral mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2 rounded-full bg-menti-brand text-white font-body font-semibold text-sm hover:bg-menti-brand-hover transition-colors cursor-pointer">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ---------- Build response distribution bars from questionResult ----------
  const renderResponseBars = () => {
    if (!questionResult || !questionResult.optionCounts) return null;
    const entries = Object.entries(questionResult.optionCounts);
    const total = questionResult.totalResponses || entries.reduce((sum, [, v]) => sum + v.count, 0);

    // Build options array compatible with HostVoteBars
    const resultBarOptions = entries.map(([optionId, opt], i) => ({
      id: optionId,
      text: opt.text,
      count: opt.count,
      isCorrect: opt.isCorrect,
      percent: total > 0 ? Math.round((opt.count / total) * 100) : 0,
      voters: votesByOption[optionId] || opt.voters || [],
    }));

    return (
      <div className="bg-menti-surface rounded-2xl p-6 border border-menti-border-weak">
        <h3 className="font-heading font-semibold text-base text-menti-text mb-4">Response Distribution</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-menti-surface-sunken rounded-xl p-3 text-center">
            <p className="font-hero text-2xl text-menti-text">{questionResult.totalResponses ?? 0}</p>
            <p className="font-body text-xs text-menti-text-weak mt-1">Responses</p>
          </div>
          <div className="bg-menti-surface-sunken rounded-xl p-3 text-center">
            <p className="font-hero text-2xl text-menti-text">{questionResult.correctResponses ?? 0}</p>
            <p className="font-body text-xs text-menti-text-weak mt-1">Correct</p>
          </div>
          <div className="bg-menti-surface-sunken rounded-xl p-3 text-center">
            <p className="font-hero text-2xl text-menti-text">{questionResult.correctionRate != null ? `${Math.round(questionResult.correctionRate)}%` : '—'}</p>
            <p className="font-body text-xs text-menti-text-weak mt-1">Accuracy</p>
          </div>
          <div className="bg-menti-surface-sunken rounded-xl p-3 text-center">
            <p className="font-hero text-2xl text-menti-text">{participantCount}</p>
            <p className="font-body text-xs text-menti-text-weak mt-1">Participants</p>
          </div>
        </div>
        <HostVoteBars
          options={resultBarOptions}
          totalVotes={total}
          revealed={true}
          votesByOption={votesByOption}
        />
      </div>
    );
  };

  const renderLeaderboard = () => (
    <div className="bg-menti-surface rounded-2xl p-6 sm:p-8 border border-menti-border-weak">
      <LiveLeaderboard
        leaderboard={leaderboard}
        title="Live Leaderboard"
        subtitle="Visible to everyone until you click Next Question"
      />
    </div>
  );

  // ---------- Main render ----------
  return (
    <div className="flex min-h-screen bg-menti-bg">
      {/* Sidebar */}
      <aside className={`fixed lg:static top-0 left-0 h-screen w-72 sm:w-80 bg-menti-surface border-r border-menti-border-weak z-40 transform transition-transform duration-300 overflow-y-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 pt-8">
          {/* Session Info */}
          <div className="bg-menti-brand-weakest rounded-2xl p-4 mb-6">
            <p className="font-body text-xs text-menti-text-weak mb-1">Join Code</p>
            <p className="font-mono text-xl font-bold text-menti-brand tracking-wider">{joinCode}</p>
            <p className="font-body text-sm font-semibold text-menti-text mt-2">{participantCount} participants</p>
            {!connected && (
              <p className="font-body text-xs text-menti-coral mt-1">● Disconnected</p>
            )}
          </div>

          {/* Current question indicator */}
          <h3 className="font-heading font-semibold text-xs text-menti-text-weaker uppercase tracking-wider mb-3">PROGRESS</h3>
          <nav className="flex flex-col gap-1 mb-6">
            {totalQuestions > 0 ? (
              Array.from({ length: totalQuestions }, (_, i) => (
                <div key={i}
                  className={`text-left py-3 px-4 rounded-lg font-body text-sm transition-all duration-200
                    ${i === questionIndex ? 'bg-menti-brand-weakest border-l-4 border-menti-brand text-menti-brand font-semibold' : 'text-menti-text-primary'}`}>
                  Q{i + 1}{i === questionIndex && currentQuestion ? `. ${currentQuestion.text?.substring(0, 25)}…` : ''}
                </div>
              ))
            ) : (
              <p className="font-body text-sm text-menti-text-weak px-4">Waiting for quiz to start…</p>
            )}
          </nav>

          {/* Controls */}
          <div className="border-t border-menti-border-weak pt-6 flex flex-col gap-2">
            <button onClick={handleNextQuestion}
              className="w-full py-3 rounded-full bg-menti-brand text-white font-body font-semibold text-sm hover:bg-menti-brand-hover transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!connected}>
              {view === 'leaderboard'
                ? 'Next Question →'
                : currentQuestion
                  ? 'Next Question'
                  : 'Start Quiz'}
            </button>

            {view === 'question' && currentQuestion && !timeUp && !currentQuestion.hasTimeLimit && (
              <button onClick={handleRevealAnswers}
                className="w-full py-3 rounded-full border border-menti-border font-body font-semibold text-sm text-menti-text-primary hover:bg-menti-surface-sunken transition-colors duration-200 cursor-pointer">
                End & Reveal Answers
              </button>
            )}

            {view === 'question' && currentQuestion && timeUp && (
              <>
                <button onClick={handleShowLeaderboard}
                  className="w-full py-3 rounded-full border border-menti-border font-body font-semibold text-sm text-menti-text-primary hover:bg-menti-surface-sunken transition-colors duration-200 cursor-pointer">
                  Show Leaderboard
                </button>
                <button onClick={handleShowResults}
                  className="w-full py-3 rounded-full border border-menti-border font-body font-semibold text-sm text-menti-text-weak hover:bg-menti-surface-sunken transition-colors duration-200 cursor-pointer">
                  Show Results
                </button>
              </>
            )}

            {view === 'question' && currentQuestion && !timeUp && currentQuestion.hasTimeLimit && (
              <button onClick={handleRevealAnswers}
                className="w-full py-3 rounded-full border border-menti-coral/40 font-body font-semibold text-sm text-menti-coral hover:bg-red-50 transition-colors duration-200 cursor-pointer">
                End Question Early
              </button>
            )}

            {view === 'results' && (
              <button onClick={handleBackToQuestion}
                className="w-full py-3 rounded-full border border-menti-border font-body font-semibold text-sm text-menti-text-primary hover:bg-menti-surface-sunken transition-colors duration-200 cursor-pointer">
                ← Back to Question
              </button>
            )}

            {view === 'leaderboard' && (
              <p className="font-body text-xs text-menti-text-weak text-center px-2">
                Participants see this leaderboard until you advance.
              </p>
            )}

            <button onClick={isPaused ? handleResume : handlePause}
              className="w-full py-3 rounded-full border border-menti-border font-body font-semibold text-sm text-menti-text-primary hover:bg-menti-surface-sunken transition-colors duration-200 cursor-pointer">
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>

            <button onClick={handleEndQuiz}
              className="w-full py-3 rounded-full bg-menti-coral text-white font-body font-semibold text-sm hover:bg-red-600 transition-colors duration-200 cursor-pointer">
              End Quiz
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile Top Bar */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-menti-surface border-b border-menti-border-weak">
          <button onClick={() => setSidebarOpen(true)} className="p-2 cursor-pointer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#101010"><path d="M3 6h18v1.5H3V6zm0 5.25h18v1.5H3v-1.5zm0 5.25h18V18H3v-1.5z"/></svg>
          </button>
          <span className="font-body font-semibold text-sm">Q{questionIndex + 1} / {totalQuestions || '?'}</span>
          <span className="font-body text-sm text-menti-text-weak">{participantCount} joined</span>
        </div>

        <div className="p-6 sm:p-8 max-w-4xl mx-auto">
          {/* --- QUESTION VIEW --- */}
          {view === 'question' && (
            <>
              {/* Waiting state */}
              {!currentQuestion && (
                <div className="bg-menti-surface rounded-2xl p-8 sm:p-12 shadow-sm border border-menti-border-weak text-center">
                  <div className="w-12 h-12 border-4 border-menti-brand border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                  <h2 className="font-heading font-semibold text-xl text-menti-text mb-2">Waiting to start</h2>
                  <p className="font-body text-menti-text-weak">Press "Start Quiz" to send the first question, or wait for participants to join.</p>
                  <p className="font-mono text-3xl font-bold text-menti-brand mt-6 tracking-wider">{joinCode}</p>
                  <p className="font-body text-sm text-menti-text-weak mt-1">{participantCount} participant{participantCount !== 1 && 's'} joined</p>
                </div>
              )}

              {/* Active question */}
              {currentQuestion && (
                <>
                  {/* Current Question Card */}
                  <div className="bg-menti-surface rounded-2xl p-6 sm:p-8 shadow-sm border border-menti-border-weak mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-block rounded-full px-3 py-1 text-xs font-body font-semibold bg-menti-brand-weakest text-menti-brand">
                        Question {questionIndex + 1} of {totalQuestions}
                      </span>
                      {timeLeft !== null && (
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-body font-semibold ${timeUp || timeLeft === 0 ? 'bg-red-100 text-menti-coral' : timeLeft <= 5 ? 'bg-red-100 text-menti-coral animate-pulse' : 'bg-menti-surface-sunken text-menti-text'}`}>
                          {timeUp ? '⏰ Time Up' : `⏱ ${formatTime(timeLeft)}`}
                        </span>
                      )}
                    </div>
                    {currentQuestion.imageUrl && (
                      <div className="mb-4 flex justify-center">
                        <img src={currentQuestion.imageUrl} alt="" className="max-h-48 rounded-xl object-contain" />
                      </div>
                    )}
                    <h2 className="font-heading font-semibold text-xl sm:text-2xl text-menti-text text-center">{currentQuestion.text}</h2>
                    {currentQuestion.questionType && (
                      <p className="text-center mt-2 font-body text-xs text-menti-text-weaker uppercase tracking-wider">{currentQuestion.questionType.replace('_', ' ')}</p>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="bg-menti-surface rounded-xl p-4 text-center border border-menti-border-weak">
                      <p className="font-hero text-2xl sm:text-3xl text-menti-text">{responseCount}</p>
                      <p className="font-body text-xs text-menti-text-weak mt-1">Responses</p>
                    </div>
                    <div className="bg-menti-surface rounded-xl p-4 text-center border border-menti-border-weak">
                      <p className="font-hero text-2xl sm:text-3xl text-menti-text">{participantCount}</p>
                      <p className="font-body text-xs text-menti-text-weak mt-1">Participants</p>
                    </div>
                    <div className="bg-menti-surface rounded-xl p-4 text-center border border-menti-border-weak">
                      <p className="font-hero text-2xl sm:text-3xl text-menti-text">{currentQuestion.points ?? '—'}</p>
                      <p className="font-body text-xs text-menti-text-weak mt-1">Points</p>
                    </div>
                    <div className="bg-menti-surface rounded-xl p-4 text-center border border-menti-border-weak">
                      <p className="font-hero text-2xl sm:text-3xl text-menti-text">
                        {timeLeft !== null ? formatTime(timeLeft) : '∞'}
                      </p>
                      <p className="font-body text-xs text-menti-text-weak mt-1">Time Left</p>
                    </div>
                  </div>

                  {timeUp && (
                    <div className="mb-6 rounded-2xl bg-menti-brand-weakest border border-menti-brand-weakest px-4 py-3 text-center animate-fade-in-up">
                      <p className="font-body text-sm font-semibold text-menti-brand">
                        Time&apos;s up — correct answers are highlighted below
                      </p>
                      <p className="font-body text-xs text-menti-text-weak mt-1">
                        Use Next Question or Show Leaderboard in the sidebar
                      </p>
                    </div>
                  )}

                  {isMcqOrTf && currentQuestion.options?.length > 0 && (
                    <div className="bg-menti-surface rounded-2xl p-6 border border-menti-border-weak">
                      <h3 className="font-heading font-semibold text-base text-menti-text mb-1">
                        {timeUp ? 'Results' : 'Live votes'}
                      </h3>
                      <p className="font-body text-xs text-menti-text-weak mb-4">
                        {responseCount} of {participantCount} answered
                        {!timeUp && ' · correct answer hidden until time is up'}
                      </p>
                      <HostVoteBars
                        options={barOptions}
                        totalVotes={voteStats?.totalVotes ?? responseCount}
                        revealed={timeUp}
                        votesByOption={votesByOption}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* --- RESULTS VIEW --- */}
          {view === 'results' && renderResponseBars()}

          {/* --- LEADERBOARD VIEW --- */}
          {view === 'leaderboard' && renderLeaderboard()}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';
import { onMessage } from '../api/socket.js';
import { getSession } from '../api/session.js';

export default function HostControlPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { socket, sendMessage, connected } = useSocket();

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

  // ---------- Fetch session on mount ----------
  useEffect(() => {
    let cancelled = false;
    async function fetchSession() {
      try {
        const res = await getSession(sessionId);
        if (!cancelled) {
          setSession(res.session);
          setParticipantCount(res.session.participantCount || 0);
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

      switch (type) {
        case 'question_started': {
          setCurrentQuestion(data);
          setQuestionIndex(data.questionIndex ?? 0);
          setTotalQuestions(data.totalQuestions ?? 0);
          setResponseCount(0);
          setTimeUp(false);
          setQuestionResult(null);
          setView('question');

          // Start local countdown if time-limited
          if (data.hasTimeLimit && data.timeLimitSeconds > 0) {
            setTimeLeft(data.timeLimitSeconds);
          } else {
            setTimeLeft(null);
          }
          break;
        }

        case 'response_count': {
          setResponseCount(data.count ?? 0);
          break;
        }

        case 'time_up': {
          setTimeUp(true);
          setTimeLeft(0);
          clearInterval(timerRef.current);
          break;
        }

        case 'participant_joined': {
          setParticipantCount((prev) => prev + 1);
          break;
        }

        case 'participant_left': {
          setParticipantCount((prev) => Math.max(0, prev - 1));
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
  }, [socket, sessionId, navigate]);

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
        {entries.map(([optionId, opt]) => {
          const pct = total > 0 ? Math.round((opt.count / total) * 100) : 0;
          return (
            <div key={optionId} className="mb-3">
              <div className="flex justify-between mb-1">
                <span className={`font-body text-sm ${opt.isCorrect ? 'font-semibold text-menti-positive' : 'text-menti-text-primary'}`}>
                  {opt.isCorrect && '✓ '}{opt.text}
                </span>
                <span className="font-body text-sm text-menti-text-weak">{pct}%</span>
              </div>
              <div className="h-7 bg-menti-surface-sunken rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ease-out ${opt.isCorrect ? 'bg-menti-brand' : 'bg-menti-border'}`}
                  style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ---------- Render leaderboard ----------
  const renderLeaderboard = () => (
    <div className="bg-menti-surface rounded-2xl p-6 border border-menti-border-weak">
      <h3 className="font-heading font-semibold text-base text-menti-text mb-4">Leaderboard</h3>
      {leaderboard.length === 0 ? (
        <p className="font-body text-sm text-menti-text-weak text-center py-6">No leaderboard data yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {leaderboard.map((entry) => (
            <div key={entry.userId} className={`flex items-center gap-4 p-3 rounded-xl ${entry.rank <= 3 ? 'bg-menti-brand-weakest' : 'bg-menti-surface-sunken'}`}>
              <span className={`font-hero text-xl w-8 text-center ${entry.rank === 1 ? 'text-yellow-500' : entry.rank === 2 ? 'text-gray-400' : entry.rank === 3 ? 'text-amber-600' : 'text-menti-text-weak'}`}>
                #{entry.rank}
              </span>
              {entry.avatar ? (
                <img src={entry.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-menti-brand-weakest flex items-center justify-center">
                  <span className="font-body text-sm font-semibold text-menti-brand">{entry.name?.charAt(0)?.toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-semibold text-menti-text truncate">{entry.name}</p>
              </div>
              <span className="font-hero text-lg text-menti-brand">{entry.totalScore}</span>
              {!entry.isActive && <span className="text-xs text-menti-text-weaker">(left)</span>}
            </div>
          ))}
        </div>
      )}
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
              {currentQuestion ? 'Next Question' : 'Start Quiz'}
            </button>

            {view === 'question' && currentQuestion && (
              <>
                <button onClick={handleShowResults}
                  className="w-full py-3 rounded-full border border-menti-border font-body font-semibold text-sm text-menti-text-primary hover:bg-menti-surface-sunken transition-colors duration-200 cursor-pointer">
                  Show Results
                </button>
                <button onClick={handleShowLeaderboard}
                  className="w-full py-3 rounded-full border border-menti-border font-body font-semibold text-sm text-menti-text-primary hover:bg-menti-surface-sunken transition-colors duration-200 cursor-pointer">
                  Show Leaderboard
                </button>
              </>
            )}

            {(view === 'results' || view === 'leaderboard') && (
              <button onClick={handleBackToQuestion}
                className="w-full py-3 rounded-full border border-menti-border font-body font-semibold text-sm text-menti-text-primary hover:bg-menti-surface-sunken transition-colors duration-200 cursor-pointer">
                ← Back to Question
              </button>
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

                  {/* Options preview (if MCQ) */}
                  {currentQuestion.options && currentQuestion.options.length > 0 && (
                    <div className="bg-menti-surface rounded-2xl p-6 border border-menti-border-weak">
                      <h3 className="font-heading font-semibold text-base text-menti-text mb-4">Answer Options</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentQuestion.options.map((opt, i) => (
                          <div key={opt.id || i} className="p-3 rounded-xl bg-menti-surface-sunken font-body text-sm text-menti-text-primary">
                            {typeof opt === 'string' ? opt : opt.text}
                          </div>
                        ))}
                      </div>
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

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { onMessage } from '../api/socket.js';
import { getSession } from '../api/session.js';
import LiveLeaderboard from '../components/LiveLeaderboard.jsx';
import HostVoteBars, { truncateQuestion } from '../components/HostVoteBars.jsx';

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
  const [questionList, setQuestionList] = useState([]);

  useEffect(() => {
    document.documentElement.classList.add('overflow-hidden');
    document.body.classList.add('overflow-hidden');
    return () => {
      document.documentElement.classList.remove('overflow-hidden');
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  // ---------- Fetch session on mount ----------
  useEffect(() => {
    let cancelled = false;
    async function fetchSession() {
      try {
        const res = await getSession(sessionId);
        if (!cancelled) {
          setSession(res.session);
          hostIdRef.current = res.session.hostId || res.session.host?.id;
          const qs = res.session.quiz?.questions ?? [];
          setQuestionList(qs.length ? qs : []);
          if (qs.length) setTotalQuestions((n) => Math.max(n, qs.length));
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
          if (data.text && data.questionIndex != null) {
            setQuestionList((prev) => {
              const next = [...prev];
              const idx = data.questionIndex;
              while (next.length <= idx) next.push({ id: `q-${next.length}`, text: '' });
              next[idx] = { ...next[idx], id: data.questionId, text: data.text };
              return next;
            });
          }
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

        case 'quiz_paused': {
          setIsPaused(true);
          break;
        }

        case 'quiz_resumed': {
          setIsPaused(false);
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
  const progressItems = useMemo(() => {
    const n = Math.max(totalQuestions, questionList.length);
    if (n === 0) return [];
    return Array.from({ length: n }, (_, i) => ({
      index: i,
      text: questionList[i]?.text ?? '',
    }));
  }, [totalQuestions, questionList]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-menti-bg">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-menti-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-body text-menti-text-weak">Loading session…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-menti-bg">
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
      <div className="bg-menti-surface rounded-2xl p-5 border border-menti-border-weak flex-1 min-h-0 flex flex-col overflow-hidden shadow-sm">
        <h3 className="font-heading text-base font-semibold text-menti-text mb-3 shrink-0">Response distribution</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 shrink-0">
          {[
            [questionResult.totalResponses ?? 0, 'Resp.'],
            [questionResult.correctResponses ?? 0, 'OK'],
            [questionResult.correctionRate != null ? `${Math.round(questionResult.correctionRate)}%` : '—', 'Acc.'],
            [participantCount, 'Ppl.'],
          ].map(([val, label]) => (
            <div key={label} className="bg-menti-surface-sunken rounded-lg p-2 text-center">
              <p className="font-hero text-lg text-menti-text">{val}</p>
              <p className="font-body text-[10px] text-menti-text-weak">{label}</p>
            </div>
          ))}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <HostVoteBars
            options={resultBarOptions}
            totalVotes={total}
            revealed={true}
            votesByOption={votesByOption}
          />
        </div>
      </div>
    );
  };

  const renderLeaderboard = () => (
    <div className="bg-menti-surface rounded-2xl p-5 border border-menti-border-weak flex-1 min-h-0 flex flex-col shadow-sm">
      <LiveLeaderboard
        leaderboard={leaderboard}
        title="Live Leaderboard"
        subtitle="Visible to everyone until you click Next Question"
      />
    </div>
  );

  // ---------- Main render — 100vw × 100vh, left scroll only ----------
  return (
    <div className="fixed inset-0 w-screen h-screen flex bg-menti-bg overflow-hidden">
      {/* Sidebar: join + scrollable progress + fixed controls */}
      <aside
        className={`flex flex-col w-64 sm:w-72 shrink-0 h-full bg-menti-surface border-r border-menti-border-weak z-40 transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        fixed lg:relative inset-y-0 left-0`}
      >
        <div className="shrink-0 p-4 border-b border-menti-border-weak">
          <div className="bg-menti-brand-weakest rounded-xl p-4">
            <p className="font-body text-xs text-menti-text-weak uppercase tracking-wide">Join code</p>
            <p className="font-mono text-xl font-bold text-menti-brand tracking-wider mt-0.5">{joinCode}</p>
            <p className="font-body text-sm font-semibold text-menti-text mt-2">{participantCount} players</p>
            {!connected && <p className="font-body text-xs text-menti-coral mt-1">Reconnecting…</p>}
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <h3 className="shrink-0 px-4 pt-3 pb-2 font-heading text-xs font-semibold text-menti-text-weak uppercase tracking-wider">
            All questions
          </h3>
          <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 pb-2 space-y-0.5">
            {progressItems.length > 0 ? (
              progressItems.map(({ index, text }) => (
                <div
                  key={index}
                  className={`flex gap-2 items-start py-2 px-2.5 rounded-lg text-left transition-colors ${
                    index === questionIndex
                      ? 'bg-menti-brand-weakest border-l-[3px] border-menti-brand'
                      : index < questionIndex
                        ? 'opacity-60'
                        : ''
                  }`}
                >
                  <span
                    className={`shrink-0 font-body text-xs font-bold ${
                      index === questionIndex ? 'text-menti-brand' : 'text-menti-text-weak'
                    }`}
                  >
                    Q{index + 1}
                  </span>
                  <span
                    className="font-body text-xs text-menti-text-primary leading-snug line-clamp-2 min-w-0 flex-1"
                    title={text || undefined}
                  >
                    {text ? truncateQuestion(text, 52) : 'Question preview loading…'}
                  </span>
                </div>
              ))
            ) : (
              <p className="font-body text-xs text-menti-text-weak px-2 py-4">Waiting to start…</p>
            )}
          </nav>
        </div>

        <div className="shrink-0 p-3 border-t border-menti-border-weak flex flex-col gap-1.5 max-h-[42vh] overflow-y-auto">
            <button onClick={handleNextQuestion}
              className="w-full py-2.5 rounded-full bg-menti-brand text-white font-body font-semibold text-xs hover:bg-menti-brand-hover transition-colors cursor-pointer disabled:opacity-50"
              disabled={!connected}>
              {view === 'leaderboard'
                ? 'Next Question →'
                : currentQuestion
                  ? 'Next Question'
                  : 'Start Quiz'}
            </button>

            {view === 'question' && currentQuestion && !timeUp && !currentQuestion.hasTimeLimit && (
              <button onClick={handleRevealAnswers}
                className="w-full py-2 rounded-full border border-menti-border font-body font-semibold text-xs text-menti-text-primary hover:bg-menti-surface-sunken transition-colors cursor-pointer">
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

            <button
              onClick={isPaused ? handleResume : handlePause}
              className="w-full py-3 rounded-full border border-menti-border font-body font-semibold text-sm text-menti-text-primary hover:bg-menti-surface-sunken transition-colors duration-200 cursor-pointer"
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>

            <button onClick={handleEndQuiz}
              className="w-full py-2.5 rounded-full bg-menti-coral text-white font-body font-semibold text-xs hover:bg-red-600 transition-colors cursor-pointer">
              End Quiz
            </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main stage — fixed viewport; inner vote list scrolls only if needed */}
      <main className="relative flex-1 min-w-0 h-full flex flex-col overflow-hidden bg-menti-bg">
        {isPaused && currentQuestion && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className="bg-menti-surface rounded-2xl shadow-xl px-8 py-6 text-center max-w-sm mx-4">
              <p className="font-heading text-lg font-semibold text-menti-text mb-1">Quiz paused</p>
              <p className="font-body text-sm text-menti-text-weak mb-4">
                Participants cannot answer until you resume.
              </p>
              <button
                type="button"
                onClick={handleResume}
                className="bg-menti-brand text-white rounded-full px-6 py-2.5 font-body text-sm font-semibold hover:bg-menti-brand-hover cursor-pointer"
              >
                Resume quiz
              </button>
            </div>
          </div>
        )}

        <header className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-menti-surface border-b border-menti-border-weak">
          <div className="lg:hidden">
            <button type="button" onClick={() => setSidebarOpen(true)} className="p-2 cursor-pointer" aria-label="Open menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#101010"><path d="M3 6h18v1.5H3V6zm0 5.25h18v1.5H3v-1.5zm0 5.25h18V18H3v-1.5z"/></svg>
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-body text-xs text-menti-text-weak uppercase tracking-wide">Host control</p>
            <p className="font-heading text-base font-semibold text-menti-text truncate">
              {session?.quiz?.title || 'Live session'}
            </p>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col px-4 sm:px-6 py-4">
          <div className="mx-auto w-full max-w-3xl flex-1 min-h-0 flex flex-col">
            {view === 'question' && !currentQuestion && (
              <div className="flex-1 flex items-center justify-center rounded-2xl bg-menti-surface border border-menti-border-weak p-10 text-center">
                <div>
                  <div className="w-11 h-11 border-4 border-menti-brand/30 border-t-menti-brand rounded-full animate-spin mx-auto mb-4" />
                  <h2 className="font-heading text-xl font-semibold text-menti-text mb-2">Ready to start</h2>
                  <p className="font-body text-sm text-menti-text-weak">
                    Use <strong>Start Quiz</strong> in the sidebar when players have joined.
                  </p>
                </div>
              </div>
            )}

            {view === 'question' && currentQuestion && (
              <div className="flex-1 min-h-0 flex flex-col gap-4">
                <section className="shrink-0 rounded-2xl bg-menti-surface border border-menti-border-weak p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="rounded-full bg-menti-brand-weakest px-3 py-1 font-body text-xs font-semibold text-menti-brand">
                      Question {questionIndex + 1} of {totalQuestions}
                    </span>
                    {timeLeft !== null && (
                      <span
                        className={`font-mono text-sm font-semibold tabular-nums px-3 py-1 rounded-full ${
                          timeUp || timeLeft === 0
                            ? 'bg-red-50 text-menti-coral'
                            : timeLeft <= 5
                              ? 'bg-red-50 text-menti-coral animate-pulse'
                              : 'bg-menti-surface-sunken text-menti-text'
                        }`}
                      >
                        {timeUp ? "Time's up" : formatTime(timeLeft)}
                      </span>
                    )}
                  </div>
                  <h2 className="font-heading text-lg sm:text-xl text-menti-text leading-relaxed">
                    {currentQuestion.text}
                  </h2>
                </section>

                <section className="shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { val: responseCount, label: 'Answers', sub: `of ${participantCount}` },
                    { val: participantCount, label: 'Players', sub: 'in session' },
                    { val: currentQuestion.points ?? '—', label: 'Points', sub: 'this question' },
                    { val: timeLeft !== null ? formatTime(timeLeft) : '—', label: 'Time left', sub: timeUp ? 'ended' : 'remaining' },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl bg-menti-surface border border-menti-border-weak px-4 py-3 text-center"
                    >
                      <p className="font-hero text-2xl text-menti-brand leading-none">{s.val}</p>
                      <p className="font-body text-sm font-semibold text-menti-text mt-1">{s.label}</p>
                      <p className="font-body text-xs text-menti-text-weak">{s.sub}</p>
                    </div>
                  ))}
                </section>

                {timeUp && (
                  <p className="shrink-0 text-center font-body text-sm text-menti-brand bg-menti-brand-weakest rounded-xl py-2 px-3">
                    Time is up — correct answers are shown below. Use the sidebar for leaderboard or next question.
                  </p>
                )}

                {isMcqOrTf && currentQuestion.options?.length > 0 && (
                  <section className="flex-1 min-h-0 flex flex-col rounded-2xl bg-menti-surface border border-menti-border-weak shadow-sm overflow-hidden">
                    <div className="shrink-0 px-5 py-3 border-b border-menti-border-weak">
                      <h3 className="font-heading text-base font-semibold text-menti-text">
                        {timeUp ? 'Answer breakdown' : 'Live responses'}
                      </h3>
                      <p className="font-body text-sm text-menti-text-weak mt-0.5">
                        {responseCount} of {participantCount} participants answered
                        {!timeUp && ' · correct answer hidden until time ends'}
                      </p>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
                      <HostVoteBars
                        options={barOptions}
                        totalVotes={voteStats?.totalVotes ?? responseCount}
                        revealed={timeUp}
                        votesByOption={votesByOption}
                      />
                    </div>
                  </section>
                )}
              </div>
            )}

            {view === 'results' && (
              <div className="flex-1 min-h-0 flex flex-col">{renderResponseBars()}</div>
            )}

            {view === 'leaderboard' && (
              <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">{renderLeaderboard()}</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

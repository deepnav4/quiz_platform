import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getSession } from '../api/session.js';

export default function HostControlPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { socket, sendMessage, connected } = useSocket();
  const { user } = useAuth();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [isPaused, setIsPaused] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch session data
  useEffect(() => {
    getSession(sessionId)
      .then((data) => {
        setSession(data.session ?? data);
        setQuestions(data.questions ?? data.session?.questions ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sessionId]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    function onMessage(event) {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'participant:joined':
          setParticipantCount((c) => c + 1);
          break;
        case 'participant:left':
          setParticipantCount((c) => Math.max(0, c - 1));
          break;
        case 'answer:received':
          setResponses((prev) => {
            const qId = msg.data.questionId;
            const existing = prev[qId] ?? [];
            return { ...prev, [qId]: [...existing, msg.data] };
          });
          break;
        case 'session:participants':
          setParticipantCount(msg.data.count ?? 0);
          break;
        default:
          break;
      }
    }

    socket.addEventListener('message', onMessage);
    return () => socket.removeEventListener('message', onMessage);
  }, [socket]);

  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const currentResponses = currentQuestion
    ? responses[currentQuestion.id] ?? []
    : [];
  const totalResponses = currentResponses.length;

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      sendMessage('question:next', {
        sessionId,
        questionIndex: nextIdx,
      });
    }
  }, [currentQuestionIndex, questions.length, sendMessage, sessionId]);

  const handleTogglePause = useCallback(() => {
    setIsPaused((p) => !p);
    sendMessage(isPaused ? 'session:resume' : 'session:pause', { sessionId });
  }, [isPaused, sendMessage, sessionId]);

  const handleEndQuiz = useCallback(() => {
    sendMessage('session:end', { sessionId });
    navigate(`/results/${sessionId}`);
  }, [sendMessage, sessionId, navigate]);

  // Response distribution for options
  const getOptionStats = () => {
    if (!currentQuestion?.options) return [];
    return currentQuestion.options.map((opt) => {
      const count = currentResponses.filter((r) =>
        r.optionIds?.includes(opt.id)
      ).length;
      const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
      return { ...opt, count, pct };
    });
  };

  const optionStats = getOptionStats();
  const maxPct = Math.max(...optionStats.map((o) => o.pct), 1);

  // Mock data for dev
  const mockQuestions = questions.length > 0 ? questions : [
    { id: '1', text: 'What is React?', type: 'MULTIPLE_CHOICE', options: [
      { id: 'a', text: 'A library', isCorrect: true },
      { id: 'b', text: 'A framework', isCorrect: false },
      { id: 'c', text: 'A language', isCorrect: false },
      { id: 'd', text: 'An OS', isCorrect: false },
    ]},
    { id: '2', text: 'Is JavaScript typed?', type: 'TRUE_FALSE', options: [] },
    { id: '3', text: 'Explain closures.', type: 'OPEN_ENDED', options: [] },
  ];

  const displayQuestions = questions.length > 0 ? questions : mockQuestions;
  const displayQuestion = displayQuestions[currentQuestionIndex] ?? displayQuestions[0];
  const joinCode = session?.joinCode ?? 'ABCD12';

  // Stat cards data
  const stats = [
    { label: 'Participants', value: participantCount },
    { label: 'Responses', value: totalResponses },
    { label: 'Avg. Time', value: '12s' },
    { label: 'Accuracy', value: '76%' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-menti-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-menti-brand-weakest border-t-menti-brand rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-menti-bg">
      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 w-80 bg-menti-surface border-r border-menti-border-weak pt-20 overflow-y-auto z-30 transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="p-6 flex flex-col h-[calc(100%-5rem)]">
          {/* Session Info Card */}
          <div className="bg-menti-brand-weakest rounded-2xl p-4 mb-6">
            <p className="font-body text-xs text-menti-text-weak uppercase tracking-wider mb-1">Join Code</p>
            <p className="font-mono text-2xl font-bold text-menti-brand tracking-widest">{joinCode}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="w-2 h-2 rounded-full bg-menti-positive animate-pulse" />
              <span className="font-body font-semibold text-sm text-menti-text-primary">
                {participantCount} participant{participantCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Questions Nav */}
          <h3 className="font-heading font-semibold text-sm text-menti-text-weak uppercase tracking-wider mb-3">
            Questions
          </h3>
          <nav className="flex-1 overflow-y-auto -mx-2 mb-4">
            {displayQuestions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(i)}
                className={`w-full text-left py-3 px-4 cursor-pointer font-body text-sm transition-colors rounded-r-lg mb-1
                  ${
                    i === currentQuestionIndex
                      ? 'bg-menti-brand-weakest border-l-4 border-menti-brand text-menti-brand font-semibold'
                      : 'hover:bg-menti-surface-sunken text-menti-text-primary border-l-4 border-transparent'
                  }`}
              >
                <span className="text-menti-text-weak mr-2">{i + 1}.</span>
                <span className="line-clamp-1">{q.text}</span>
              </button>
            ))}
          </nav>

          {/* Controls */}
          <div className="mt-auto pt-6 border-t border-menti-border-weak space-y-2">
            <button
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex >= displayQuestions.length - 1}
              className="bg-menti-brand text-white w-full py-3 rounded-full font-body font-semibold hover:bg-menti-brand-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next Question →
            </button>
            <button
              onClick={handleTogglePause}
              className="border border-menti-border w-full py-3 rounded-full font-body font-semibold text-menti-text-primary hover:bg-menti-surface-sunken transition-colors"
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button
              onClick={handleEndQuiz}
              className="bg-menti-coral text-white w-full py-3 rounded-full font-body font-semibold hover:opacity-90 transition-colors"
            >
              End Quiz
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 lg:ml-80 p-6 md:p-8 pt-20 min-h-screen">
        {/* Mobile Top Bar */}
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-menti-surface/90 backdrop-blur-sm border-b border-menti-border-weak px-4 py-3 flex items-center justify-between z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-menti-surface-sunken transition-colors"
          >
            <svg className="w-6 h-6 text-menti-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-menti-brand bg-menti-brand-weakest rounded-full px-3 py-1">
              {joinCode}
            </span>
            <span className="font-body text-sm font-semibold text-menti-text-weak">
              {participantCount} joined
            </span>
          </div>
        </div>

        {/* Current Question */}
        {displayQuestion && (
          <div className="bg-menti-surface rounded-2xl p-8 shadow-sm border border-menti-border-weak mb-8">
            <span className="inline-block rounded-full px-3 py-1 text-xs font-body font-semibold bg-menti-brand-weakest text-menti-brand mb-4">
              {displayQuestion.type?.replace('_', ' ') ?? 'QUESTION'}
            </span>
            <h2 className="font-heading font-semibold text-2xl text-center text-menti-text-primary">
              {displayQuestion.text}
            </h2>
          </div>
        )}

        {/* Response Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-menti-surface rounded-xl p-4 text-center border border-menti-border-weak"
            >
              <p className="font-hero text-3xl text-menti-brand leading-none mb-1">
                {s.value}
              </p>
              <p className="font-body text-sm text-menti-text-weak">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Response Bars */}
        {displayQuestion?.options && displayQuestion.options.length > 0 && (
          <div className="bg-menti-surface rounded-2xl p-6 border border-menti-border-weak">
            <h3 className="font-heading font-semibold text-lg text-menti-text-primary mb-6">
              Response Distribution
            </h3>
            <div className="space-y-4">
              {(optionStats.length > 0 ? optionStats : displayQuestion.options.map((o) => ({ ...o, count: 0, pct: 0 }))).map((opt) => (
                <div key={opt.id} className="flex items-center gap-4">
                  <span className="font-body text-sm text-menti-text-primary w-32 flex-shrink-0 truncate">
                    {opt.text}
                  </span>
                  <div className="flex-1 bg-menti-border-weak h-8 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        opt.isCorrect ? 'bg-menti-brand' : 'bg-menti-border'
                      }`}
                      style={{ width: `${opt.pct}%` }}
                    />
                  </div>
                  <span className="font-body font-semibold text-sm text-menti-text-weak w-12 text-right">
                    {opt.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

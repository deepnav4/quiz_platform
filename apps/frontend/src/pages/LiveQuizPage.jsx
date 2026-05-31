import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext.jsx';

const OPTION_COLORS = [
  'bg-blue-50 hover:bg-blue-100',
  'bg-purple-50 hover:bg-purple-100',
  'bg-amber-50 hover:bg-amber-100',
  'bg-emerald-50 hover:bg-emerald-100',
];

export default function LiveQuizPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { socket, sendMessage, connected } = useSocket();

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [openAnswer, setOpenAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [questionType, setQuestionType] = useState('MULTIPLE_CHOICE');
  const [waiting, setWaiting] = useState(false);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    function onMessage(event) {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case 'question:start': {
          const q = msg.data;
          setCurrentQuestion(q);
          setQuestionIndex(q.index ?? 0);
          setTotalQuestions(q.total ?? 0);
          setQuestionType(q.type ?? 'MULTIPLE_CHOICE');
          setTimeLeft(q.timeLimit ?? 30);
          setSelectedOptions([]);
          setOpenAnswer('');
          setSubmitted(false);
          setWaiting(false);
          break;
        }
        case 'question:result': {
          const r = msg.data;
          setPointsEarned((prev) => prev + (r.points ?? 0));
          setWaiting(false);
          break;
        }
        case 'session:end': {
          navigate(`/results/${sessionId}`);
          break;
        }
        default:
          break;
      }
    }

    socket.addEventListener('message', onMessage);
    return () => socket.removeEventListener('message', onMessage);
  }, [socket, sessionId, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || submitted) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, submitted]);

  // Auto-submit on timer expiry
  useEffect(() => {
    if (timeLeft === 0 && !submitted && currentQuestion) {
      handleSubmit();
    }
  }, [timeLeft]);

  const toggleOption = useCallback((optionId) => {
    if (submitted) return;
    setSelectedOptions((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  }, [submitted]);

  const selectTrueFalse = useCallback((value) => {
    if (submitted) return;
    setSelectedOptions([value]);
  }, [submitted]);

  const handleSubmit = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);
    setWaiting(true);

    const answer =
      questionType === 'OPEN_ENDED'
        ? { text: openAnswer }
        : { optionIds: selectedOptions };

    sendMessage('answer:submit', {
      sessionId,
      questionId: currentQuestion?.id,
      ...answer,
    });
  }, [submitted, questionType, openAnswer, selectedOptions, sendMessage, sessionId, currentQuestion]);

  const isSubmitDisabled =
    submitted ||
    (questionType === 'OPEN_ENDED'
      ? openAnswer.trim() === ''
      : selectedOptions.length === 0);

  // Mock question for initial render / dev
  const question = currentQuestion || {
    id: 'mock-1',
    text: 'What is the capital of France?',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'a', text: 'London' },
      { id: 'b', text: 'Paris' },
      { id: 'c', text: 'Berlin' },
      { id: 'd', text: 'Madrid' },
    ],
  };

  const displayType = currentQuestion ? questionType : question.type;
  const displayIndex = currentQuestion ? questionIndex + 1 : 1;
  const displayTotal = currentQuestion ? totalQuestions : 5;

  return (
    <div className="min-h-screen bg-gradient-to-b from-menti-brand-weakest to-menti-bg">
      {/* ── Top Bar ── */}
      <header className="fixed top-0 w-full bg-menti-surface/90 backdrop-blur-sm border-b border-menti-border-weak px-6 py-3 flex justify-between items-center z-10">
        <span className="font-body font-semibold text-menti-text-primary">
          Question {displayIndex} of {displayTotal}
        </span>

        <span className="font-hero text-4xl text-menti-brand leading-none">
          {timeLeft}
        </span>

        <span className="bg-menti-brand-weakest rounded-full px-4 py-1 font-body font-semibold text-menti-brand">
          {pointsEarned} pts
        </span>
      </header>

      {/* ── Main Content ── */}
      <main className="pt-20 pb-24 max-w-3xl mx-auto px-6">
        <div className="bg-menti-surface rounded-3xl shadow-2xl p-8 lg:p-12 animate-fade-in-up">
          {submitted && waiting ? (
            /* Waiting state */
            <div className="flex flex-col items-center justify-center py-16 gap-6">
              <div className="w-16 h-16 border-4 border-menti-brand-weakest border-t-menti-brand rounded-full animate-spin" />
              <p className="font-heading font-semibold text-xl text-menti-text-weak">
                Waiting for results…
              </p>
            </div>
          ) : (
            <>
              {/* Type Badge */}
              <span className="inline-block rounded-full px-3 py-1 text-xs font-body font-semibold bg-menti-brand-weakest text-menti-brand mb-4">
                {displayType.replace('_', ' ')}
              </span>

              {/* Question Text */}
              <h2 className="font-heading font-semibold text-xl lg:text-2xl text-center mb-8 text-menti-text-primary">
                {question.text}
              </h2>

              {/* ── MULTIPLE_CHOICE ── */}
              {displayType === 'MULTIPLE_CHOICE' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {question.options?.map((opt, i) => {
                    const isSelected = selectedOptions.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleOption(opt.id)}
                        disabled={submitted}
                        className={`w-full text-left p-5 rounded-2xl border-2 transition-all font-body text-base
                          ${
                            isSelected
                              ? 'bg-menti-brand text-white border-menti-brand scale-[1.02] shadow-lg'
                              : `bg-menti-surface-sunken border-transparent hover:bg-menti-brand-weakest hover:border-menti-brand ${OPTION_COLORS[i % OPTION_COLORS.length]}`
                          }
                          disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm
                              ${isSelected ? 'bg-white/20 text-white' : 'bg-menti-brand-weakest text-menti-brand'}`}
                          >
                            {String.fromCharCode(65 + i)}
                          </span>
                          {opt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── TRUE_FALSE ── */}
              {displayType === 'TRUE_FALSE' && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => selectTrueFalse('true')}
                    disabled={submitted}
                    className={`w-full p-8 rounded-2xl border-2 transition-all font-body font-semibold text-lg text-center
                      ${
                        selectedOptions.includes('true')
                          ? 'bg-menti-positive text-white border-menti-positive scale-[1.02] shadow-lg'
                          : 'bg-menti-surface-sunken border-transparent hover:bg-green-50 hover:border-menti-positive'
                      }
                      disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    ✓ True
                  </button>
                  <button
                    onClick={() => selectTrueFalse('false')}
                    disabled={submitted}
                    className={`w-full p-8 rounded-2xl border-2 transition-all font-body font-semibold text-lg text-center
                      ${
                        selectedOptions.includes('false')
                          ? 'bg-menti-coral text-white border-menti-coral scale-[1.02] shadow-lg'
                          : 'bg-menti-surface-sunken border-transparent hover:bg-red-50 hover:border-menti-coral'
                      }
                      disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    ✗ False
                  </button>
                </div>
              )}

              {/* ── OPEN_ENDED ── */}
              {displayType === 'OPEN_ENDED' && (
                <textarea
                  value={openAnswer}
                  onChange={(e) => setOpenAnswer(e.target.value)}
                  disabled={submitted}
                  placeholder="Type your answer here…"
                  className="w-full h-32 rounded-2xl bg-menti-surface-sunken p-4 border-2 border-menti-border-weak focus:border-menti-brand focus:outline-none font-body text-base resize-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* ── Submit Button ── */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-menti-brand text-white py-4 px-12 rounded-full font-body font-semibold text-lg shadow-xl hover:bg-menti-brand-hover transition-colors z-10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit Answer
        </button>
      )}
    </div>
  );
}

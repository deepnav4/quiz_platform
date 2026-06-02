import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';
import { onMessage } from '../api/socket.js';
import LiveLeaderboard from '../components/LiveLeaderboard.jsx';

export default function LiveQuizPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { socket, sendMessage, connected } = useSocket();

  const [question, setQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selected, setSelected] = useState(null);
  const [openAnswer, setOpenAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  const timerRef = useRef(null);
  const pausedTimeRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (seconds) => {
      clearTimer();
      setTimeLeft(seconds);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimer]
  );

  useEffect(() => {
    if (connected) sendMessage('join_session', { sessionId });
  }, [connected, sessionId, sendMessage]);

  useEffect(() => {
    const cleanup = onMessage(socket, (msg) => {
      const { type, data } = msg;

      switch (type) {
        case 'question_started': {
          setQuestion(data);
          setQuestionIndex(data.questionIndex ?? 0);
          setTotalQuestions(data.totalQuestions ?? 0);
          setSelected(data.questionType === 'MULTIPLE_CHOICE_MULTI' ? new Set() : null);
          setOpenAnswer('');
          setSubmitted(false);
          setFeedback(null);
          setRevealed(false);
          setTimedOut(false);
          setPaused(false);
          setShowLeaderboard(false);
          setLeaderboard([]);
          if (data.hasTimeLimit && data.timeLimitSeconds) {
            startTimer(data.timeLimitSeconds);
          } else {
            clearTimer();
            setTimeLeft(null);
          }
          break;
        }

        case 'time_up': {
          clearTimer();
          setTimeLeft(0);
          setTimedOut(true);
          break;
        }

        case 'response_ack': {
          setSubmitted(true);
          break;
        }

        case 'answers_revealed': {
          setFeedback(data);
          setRevealed(true);
          setTimedOut(true);
          setTotalPoints(data.totalScore ?? 0);
          clearTimer();
          setTimeLeft(0);
          break;
        }

        case 'quiz_ended': {
          clearTimer();
          navigate(`/session/${data.sessionId ?? sessionId}/results`);
          break;
        }

        case 'quiz_paused': {
          setPaused(true);
          clearTimer();
          pausedTimeRef.current = timeLeft;
          break;
        }

        case 'quiz_resumed': {
          setPaused(false);
          if (pausedTimeRef.current != null && pausedTimeRef.current > 0) {
            startTimer(pausedTimeRef.current);
            pausedTimeRef.current = null;
          }
          break;
        }

        case 'leaderboard_update': {
          setLeaderboard(data.leaderboard || []);
          setShowLeaderboard(true);
          break;
        }

        default:
          break;
      }
    });

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, sessionId, navigate, startTimer, clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const handleSubmit = () => {
    if (submitted || timedOut) return;

    const payload = { sessionId, questionId: question.questionId };

    if (question.questionType === 'OPEN_ENDED') {
      payload.responseData = openAnswer.trim();
    } else if (question.questionType === 'MULTIPLE_CHOICE_MULTI') {
      payload.selectedOptionIds = [...selected];
    } else {
      payload.selectedOptionIds = [question.options[selected].id];
    }

    sendMessage('submit_response', payload);
  };

  const canSubmit = (() => {
    if (!question || submitted || timedOut) return false;
    if (question.questionType === 'OPEN_ENDED') return openAnswer.trim().length > 0;
    if (question.questionType === 'MULTIPLE_CHOICE_MULTI')
      return selected instanceof Set && selected.size > 0;
    return selected !== null;
  })();

  const toggleMulti = (optionId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
      return next;
    });
  };

  const isCorrectOption = (optId) => revealed && feedback?.correctOptionIds?.includes(optId);
  const isWrongSelection = (optId) => {
    if (!revealed || !feedback) return false;
    const wasSelected =
      question.questionType === 'MULTIPLE_CHOICE_MULTI'
        ? selected instanceof Set && selected.has(optId)
        : question.options[selected]?.id === optId;
    return wasSelected && !isCorrectOption(optId);
  };

  if (!question) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-menti-brand-weakest to-menti-bg flex items-center justify-center px-4">
        <div className="bg-menti-surface rounded-3xl shadow-2xl p-10 text-center max-w-md w-full">
          <span className="inline-block w-10 h-10 border-4 border-menti-brand/30 border-t-menti-brand rounded-full animate-spin mb-6" />
          <h2 className="font-heading font-semibold text-xl text-menti-text mb-2">
            Waiting for the host to start…
          </h2>
          <p className="font-body text-sm text-menti-text-weak">Session&nbsp;{sessionId}</p>
        </div>
      </div>
    );
  }

  const showFeedback = revealed && feedback;
  const disabled = submitted || timedOut;
  const waitingForReveal = submitted && !revealed;

  if (showLeaderboard) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-menti-brand-weakest to-menti-bg flex items-center justify-center p-4 sm:p-6">
        <div className="bg-menti-surface rounded-3xl shadow-2xl p-6 sm:p-10 max-w-lg w-full animate-fade-in-up">
          <LiveLeaderboard
            leaderboard={leaderboard}
            title="Leaderboard"
            subtitle="Waiting for the host to continue…"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-menti-brand-weakest to-menti-bg">
      <div className="fixed top-0 w-full bg-white/90 backdrop-blur-sm border-b border-menti-border-weak px-4 sm:px-6 py-3 flex items-center justify-between z-10">
        <span className="font-body font-semibold text-sm text-menti-text-primary">
          Question {questionIndex + 1} of {totalQuestions}
        </span>
        {timeLeft !== null && !revealed && (
          <span
            className={`font-hero text-3xl sm:text-4xl transition-colors duration-300 ${timeLeft <= 5 ? 'text-menti-coral' : 'text-menti-brand'}`}
          >
            {timeLeft}
          </span>
        )}
        {revealed && (
          <span className="font-body text-xs font-semibold text-menti-coral uppercase tracking-wide">
            Time&apos;s up
          </span>
        )}
        <span className="bg-menti-brand-weakest rounded-full px-4 py-1 font-body font-semibold text-sm text-menti-brand">
          {totalPoints} pts
        </span>
      </div>

      {paused && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-menti-surface rounded-3xl shadow-2xl p-10 text-center max-w-sm">
            <span className="text-4xl mb-4 block">⏸️</span>
            <h2 className="font-heading font-semibold text-xl text-menti-text">Quiz Paused</h2>
            <p className="font-body text-sm text-menti-text-weak mt-2">Waiting for the host to resume…</p>
          </div>
        </div>
      )}

      <main className="pt-24 pb-28 max-w-3xl mx-auto px-4 sm:px-6">
        <div className="bg-menti-surface rounded-3xl shadow-2xl p-6 sm:p-10 lg:p-12">
          <span className="inline-block rounded-full px-3 py-1 text-xs font-body font-semibold bg-menti-brand-weakest text-menti-brand mb-5">
            {question.questionType.replace(/_/g, ' ')}
          </span>

          {question.imageUrl && (
            <div className="mb-6 flex justify-center">
              <img src={question.imageUrl} alt="" className="rounded-2xl max-h-56 object-contain" />
            </div>
          )}

          <h2 className="font-heading font-semibold text-xl sm:text-2xl text-menti-text text-center mb-8 leading-snug">
            {question.text}
          </h2>

          {question.questionType === 'MULTIPLE_CHOICE_SINGLE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {question.options.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = showFeedback && isCorrectOption(opt.id);
                const isWrong = showFeedback && isWrongSelection(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => !disabled && setSelected(i)}
                    disabled={disabled}
                    className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 font-body text-sm sm:text-base cursor-pointer
                      ${isCorrect ? 'bg-green-50 border-menti-positive text-menti-positive font-semibold' : ''}
                      ${isWrong ? 'bg-red-50 border-menti-coral text-menti-coral' : ''}
                      ${!disabled && isSelected ? 'bg-menti-brand text-white border-menti-brand' : ''}
                      ${!disabled && !isSelected ? 'bg-menti-surface-sunken border-transparent hover:bg-menti-brand-weakest hover:border-menti-brand' : ''}
                      ${disabled && !showFeedback && isSelected ? 'bg-menti-brand/80 text-white border-menti-brand opacity-90' : ''}
                      ${showFeedback && !isCorrect && !isWrong ? 'opacity-50' : ''}
                    `}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold mr-3 ${isSelected && !showFeedback ? 'bg-white/30 text-white' : 'bg-menti-border-weak text-menti-text-weak'}`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt.text}
                  </button>
                );
              })}
            </div>
          )}

          {question.questionType === 'MULTIPLE_CHOICE_MULTI' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {question.options.map((opt, i) => {
                const isSelected = selected instanceof Set && selected.has(opt.id);
                const isCorrect = showFeedback && isCorrectOption(opt.id);
                const isWrong = showFeedback && isSelected && !isCorrectOption(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => !disabled && toggleMulti(opt.id)}
                    disabled={disabled}
                    className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 font-body text-sm sm:text-base cursor-pointer
                      ${isCorrect ? 'bg-green-50 border-menti-positive text-menti-positive font-semibold' : ''}
                      ${isWrong ? 'bg-red-50 border-menti-coral text-menti-coral' : ''}
                      ${!disabled && isSelected ? 'bg-menti-brand text-white border-menti-brand' : ''}
                      ${!disabled && !isSelected ? 'bg-menti-surface-sunken border-transparent hover:bg-menti-brand-weakest hover:border-menti-brand' : ''}
                      ${showFeedback && !isCorrect && !isWrong ? 'opacity-50' : ''}
                    `}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold mr-3 ${isSelected && !showFeedback ? 'bg-white/30 text-white' : 'bg-menti-border-weak text-menti-text-weak'}`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt.text}
                  </button>
                );
              })}
            </div>
          )}

          {question.questionType === 'TRUE_FALSE' && (
            <div className="grid grid-cols-2 gap-4">
              {question.options.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = showFeedback && isCorrectOption(opt.id);
                const isWrong = showFeedback && isWrongSelection(opt.id);
                const isTrue = opt.text.toLowerCase() === 'true';
                return (
                  <button
                    key={opt.id}
                    onClick={() => !disabled && setSelected(i)}
                    disabled={disabled}
                    className={`py-8 rounded-2xl border-2 font-heading font-semibold text-xl transition-all duration-300 cursor-pointer
                      ${isCorrect ? 'bg-green-50 border-menti-positive text-menti-positive' : ''}
                      ${isWrong ? 'bg-red-50 border-menti-coral text-menti-coral' : ''}
                      ${!disabled && isSelected ? (isTrue ? 'bg-menti-positive text-white border-menti-positive' : 'bg-menti-coral text-white border-menti-coral') : ''}
                      ${!disabled && !isSelected ? 'bg-menti-surface-sunken border-transparent hover:border-menti-brand' : ''}
                      ${disabled && !showFeedback && isSelected ? 'opacity-90' : ''}
                    `}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>
          )}

          {question.questionType === 'OPEN_ENDED' && (
            <textarea
              value={openAnswer}
              onChange={(e) => setOpenAnswer(e.target.value)}
              disabled={disabled}
              placeholder="Type your answer here..."
              rows={4}
              className="w-full rounded-2xl bg-menti-surface-sunken p-4 sm:p-5 border-2 border-menti-border-weak focus:border-menti-brand outline-none transition-colors duration-200 font-body text-sm resize-none disabled:opacity-60"
            />
          )}

          {waitingForReveal && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 bg-menti-brand-weakest rounded-full px-5 py-2">
                <span className="font-body font-semibold text-sm text-menti-brand">
                  Answer locked in — waiting for time to end…
                </span>
              </div>
            </div>
          )}

          {timedOut && !revealed && submitted && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 bg-amber-50 rounded-full px-5 py-2">
                <span className="font-body font-semibold text-sm text-amber-700">
                  Time&apos;s up — revealing your result…
                </span>
              </div>
            </div>
          )}

          {showFeedback && (
            <div className="mt-6 text-center space-y-2 animate-fade-in-up">
              <div
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 ${feedback.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}
              >
                <span className="text-lg">{feedback.isCorrect ? '✅' : '❌'}</span>
                <span
                  className={`font-body font-semibold text-sm ${feedback.isCorrect ? 'text-menti-positive' : 'text-menti-coral'}`}
                >
                  {feedback.isCorrect ? 'Correct!' : 'Wrong answer'}
                  {feedback.pointsEarned > 0 && ` — +${feedback.pointsEarned} pts`}
                </span>
              </div>
              <p className="font-body text-xs text-menti-text-weak">
                Waiting for the host (next question or leaderboard)…
              </p>
            </div>
          )}
        </div>
      </main>

      {!disabled && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-10 px-4">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-menti-brand text-white py-4 px-12 rounded-full font-body font-semibold text-lg shadow-xl hover:bg-menti-brand-hover transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit Answer
          </button>
        </div>
      )}
    </div>
  );
}

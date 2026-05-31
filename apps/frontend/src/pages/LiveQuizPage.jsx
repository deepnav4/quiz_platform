import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const MOCK_QUESTIONS = [
  { id: 1, text: 'What is the capital of France?', type: 'MULTIPLE_CHOICE', options: ['London', 'Paris', 'Berlin', 'Madrid'], correctIndex: 1, timeLimit: 30, points: 10 },
  { id: 2, text: 'JavaScript is a compiled language.', type: 'TRUE_FALSE', options: ['True', 'False'], correctIndex: 1, timeLimit: 20, points: 10 },
  { id: 3, text: 'Explain the concept of closures in JavaScript.', type: 'OPEN_ENDED', options: [], timeLimit: 60, points: 15 },
];

export default function LiveQuizPage() {
  const { sessionId } = useParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [openAnswer, setOpenAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [totalPoints, setTotalPoints] = useState(0);

  const question = MOCK_QUESTIONS[currentIndex];
  const total = MOCK_QUESTIONS.length;

  /* Timer countdown */
  useEffect(() => {
    if (submitted) return;
    setTimeLeft(question.timeLimit);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentIndex, submitted, question.timeLimit]);

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    if (selected === question.correctIndex) setTotalPoints(prev => prev + question.points);
    /* Auto-advance after 2s */
    setTimeout(() => {
      if (currentIndex < total - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelected(null);
        setOpenAnswer('');
        setSubmitted(false);
      }
    }, 2000);
  };

  const canSubmit = question.type === 'OPEN_ENDED' ? openAnswer.trim().length > 0 : selected !== null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-menti-brand-weakest to-menti-bg">
      {/* Top Bar */}
      <div className="fixed top-0 w-full bg-white/90 backdrop-blur-sm border-b border-menti-border-weak px-4 sm:px-6 py-3 flex items-center justify-between z-10">
        <span className="font-body font-semibold text-sm text-menti-text-primary">
          Question {currentIndex + 1} of {total}
        </span>
        <span className={`font-hero text-3xl sm:text-4xl transition-colors duration-300 ${timeLeft <= 5 ? 'text-menti-coral' : 'text-menti-brand'}`}>
          {timeLeft}
        </span>
        <span className="bg-menti-brand-weakest rounded-full px-4 py-1 font-body font-semibold text-sm text-menti-brand">
          {totalPoints} pts
        </span>
      </div>

      {/* Main */}
      <main className="pt-24 pb-28 max-w-3xl mx-auto px-4 sm:px-6">
        <div className="bg-menti-surface rounded-3xl shadow-2xl p-6 sm:p-10 lg:p-12">
          {/* Type badge */}
          <span className="inline-block rounded-full px-3 py-1 text-xs font-body font-semibold bg-menti-brand-weakest text-menti-brand mb-5">
            {question.type.replace('_', ' ')}
          </span>

          {/* Question */}
          <h2 className="font-heading font-semibold text-xl sm:text-2xl text-menti-text text-center mb-8 leading-snug">
            {question.text}
          </h2>

          {/* Multiple Choice Options */}
          {question.type === 'MULTIPLE_CHOICE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {question.options.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = submitted && i === question.correctIndex;
                const isWrong = submitted && isSelected && i !== question.correctIndex;
                return (
                  <button key={i} onClick={() => !submitted && setSelected(i)} disabled={submitted}
                    className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 font-body text-sm sm:text-base cursor-pointer
                      ${isCorrect ? 'bg-green-50 border-menti-positive text-menti-positive font-semibold' : ''}
                      ${isWrong ? 'bg-red-50 border-menti-coral text-menti-coral' : ''}
                      ${!submitted && isSelected ? 'bg-menti-brand text-white border-menti-brand' : ''}
                      ${!submitted && !isSelected ? 'bg-menti-surface-sunken border-transparent hover:bg-menti-brand-weakest hover:border-menti-brand' : ''}
                      ${submitted && !isCorrect && !isWrong ? 'opacity-50' : ''}
                    `}>
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold mr-3 ${isSelected && !submitted ? 'bg-white/30 text-white' : 'bg-menti-border-weak text-menti-text-weak'}`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* True/False */}
          {question.type === 'TRUE_FALSE' && (
            <div className="grid grid-cols-2 gap-4">
              {['True', 'False'].map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = submitted && i === question.correctIndex;
                return (
                  <button key={opt} onClick={() => !submitted && setSelected(i)} disabled={submitted}
                    className={`py-8 rounded-2xl border-2 font-heading font-semibold text-xl transition-all duration-300 cursor-pointer
                      ${isCorrect ? (i === 0 ? 'bg-green-50 border-menti-positive text-menti-positive' : 'bg-red-50 border-menti-coral text-menti-coral') : ''}
                      ${!submitted && isSelected ? (i === 0 ? 'bg-menti-positive text-white border-menti-positive' : 'bg-menti-coral text-white border-menti-coral') : ''}
                      ${!submitted && !isSelected ? 'bg-menti-surface-sunken border-transparent hover:border-menti-brand' : ''}
                    `}>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* Open Ended */}
          {question.type === 'OPEN_ENDED' && (
            <textarea value={openAnswer} onChange={e => setOpenAnswer(e.target.value)} disabled={submitted}
              placeholder="Type your answer here..." rows={4}
              className="w-full rounded-2xl bg-menti-surface-sunken p-4 sm:p-5 border-2 border-menti-border-weak focus:border-menti-brand outline-none transition-colors duration-200 font-body text-sm resize-none disabled:opacity-60" />
          )}

          {/* Submitted state */}
          {submitted && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 bg-menti-brand-weakest rounded-full px-5 py-2">
                <span className="w-4 h-4 border-2 border-menti-brand/40 border-t-menti-brand rounded-full animate-spin" />
                <span className="font-body font-semibold text-sm text-menti-brand">
                  {currentIndex < total - 1 ? 'Next question loading...' : 'Quiz complete!'}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Submit Button */}
      {!submitted && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-10 px-4">
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="bg-menti-brand text-white py-4 px-12 rounded-full font-body font-semibold text-lg shadow-xl hover:bg-menti-brand-hover transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">
            Submit Answer
          </button>
        </div>
      )}
    </div>
  );
}

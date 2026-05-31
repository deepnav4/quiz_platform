import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const MOCK_RESULTS = {
  totalQuestions: 5,
  correctAnswers: 3,
  score: 35,
  maxScore: 50,
  questions: [
    { text: 'What is the capital of France?', yourAnswer: 'Paris', correctAnswer: 'Paris', correct: true, points: 10, time: '5.2s' },
    { text: 'JavaScript is compiled.', yourAnswer: 'True', correctAnswer: 'False', correct: false, points: 0, time: '3.1s' },
    { text: 'What does CSS stand for?', yourAnswer: 'Cascading Style Sheets', correctAnswer: 'Cascading Style Sheets', correct: true, points: 10, time: '8.4s' },
    { text: 'React is a framework.', yourAnswer: 'True', correctAnswer: 'False', correct: false, points: 0, time: '2.8s' },
    { text: 'What is 2 + 2?', yourAnswer: '4', correctAnswer: '4', correct: true, points: 15, time: '1.5s' },
  ],
};

export default function ResultsPage() {
  const { sessionId } = useParams();
  const r = MOCK_RESULTS;
  const accuracy = Math.round((r.correctAnswers / r.totalQuestions) * 100);

  const summaryCards = [
    { label: 'Questions', value: r.totalQuestions, bg: 'bg-menti-brand-weakest', color: 'text-menti-brand' },
    { label: 'Correct', value: r.correctAnswers, bg: 'bg-green-50', color: 'text-menti-positive' },
    { label: 'Score', value: `${r.score}/${r.maxScore}`, bg: 'bg-menti-brand-weakest', color: 'text-menti-brand' },
    { label: 'Accuracy', value: `${accuracy}%`, bg: 'bg-menti-brand-weakest', color: 'text-menti-brand' },
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

      {/* Per-Question Results */}
      <h2 className="font-heading font-semibold text-lg text-menti-text mb-4">Question Breakdown</h2>
      {r.questions.map((q, i) => (
        <div key={i} className={`bg-menti-surface rounded-2xl p-5 sm:p-6 border mb-4 transition-shadow duration-300 hover:shadow-sm
          ${q.correct ? 'border-menti-border-weak border-l-4 border-l-menti-positive' : 'border-menti-border-weak border-l-4 border-l-menti-coral'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-body font-semibold text-base text-menti-text mb-3">{q.text}</h3>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
                <div>
                  <span className="font-body text-xs text-menti-text-weaker block">Your answer</span>
                  <span className={`font-body text-sm font-semibold ${q.correct ? 'text-menti-positive' : 'text-menti-coral'}`}>{q.yourAnswer}</span>
                </div>
                {!q.correct && (
                  <div>
                    <span className="font-body text-xs text-menti-text-weaker block">Correct answer</span>
                    <span className="font-body text-sm font-semibold text-menti-positive">{q.correctAnswer}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-body font-semibold ${q.correct ? 'bg-green-50 text-menti-positive' : 'bg-red-50 text-menti-coral'}`}>
                {q.correct ? `+${q.points} pts` : '0 pts'}
              </span>
              <p className="font-body text-xs text-menti-text-weaker mt-1">⏱ {q.time}</p>
            </div>
          </div>
        </div>
      ))}

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

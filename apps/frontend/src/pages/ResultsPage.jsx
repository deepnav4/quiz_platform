import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getResults } from '../api/result.js';

export default function ResultsPage() {
  const { sessionId } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getResults(sessionId)
      .then((data) => {
        setResults(data);
        setLoading(false);
      })
      .catch(() => {
        // Use mock data on error
        setResults(mockResults);
        setLoading(false);
      });
  }, [sessionId]);

  // Mock data for development / fallback
  const mockResults = {
    totalQuestions: 10,
    correctAnswers: 7,
    totalScore: 1400,
    accuracy: 70,
    questions: [
      {
        id: '1',
        text: 'What is the capital of France?',
        yourAnswer: 'Paris',
        correctAnswer: 'Paris',
        isCorrect: true,
        points: 200,
      },
      {
        id: '2',
        text: 'Which planet is known as the Red Planet?',
        yourAnswer: 'Venus',
        correctAnswer: 'Mars',
        isCorrect: false,
        points: 0,
      },
      {
        id: '3',
        text: 'What does HTML stand for?',
        yourAnswer: 'HyperText Markup Language',
        correctAnswer: 'HyperText Markup Language',
        isCorrect: true,
        points: 200,
      },
      {
        id: '4',
        text: 'Is JavaScript a compiled language?',
        yourAnswer: 'True',
        correctAnswer: 'False',
        isCorrect: false,
        points: 0,
      },
      {
        id: '5',
        text: 'What year was React released?',
        yourAnswer: '2013',
        correctAnswer: '2013',
        isCorrect: true,
        points: 200,
      },
    ],
  };

  const data = results ?? mockResults;

  const summaryCards = [
    {
      label: 'Total Questions',
      value: data.totalQuestions,
      bg: 'bg-menti-brand-weakest',
      textColor: 'text-menti-brand',
    },
    {
      label: 'Correct',
      value: data.correctAnswers,
      bg: 'bg-green-50',
      textColor: 'text-menti-positive',
    },
    {
      label: 'Score',
      value: data.totalScore,
      bg: 'bg-menti-brand-weakest',
      textColor: 'text-menti-brand',
    },
    {
      label: 'Accuracy',
      value: `${data.accuracy}%`,
      bg: 'bg-menti-brand-weakest',
      textColor: 'text-menti-brand',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-menti-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-menti-brand-weakest border-t-menti-brand rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      {/* Page Title */}
      <h1 className="font-heading font-semibold text-3xl text-menti-text-primary mb-8">
        Quiz Results
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} rounded-2xl p-6 text-center`}
          >
            <p className={`font-hero text-4xl ${card.textColor} leading-none mb-2`}>
              {card.value}
            </p>
            <p className="font-body text-sm text-menti-text-weak">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Per-Question Results */}
      <div className="space-y-4 mb-10">
        {data.questions?.map((q, i) => (
          <div
            key={q.id}
            className={`bg-menti-surface rounded-2xl p-6 border border-menti-border-weak
              border-l-4 ${q.isCorrect ? 'border-l-menti-positive' : 'border-l-menti-coral'}`}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <h3 className="font-heading font-semibold text-menti-text-primary flex-1">
                <span className="text-menti-text-weak mr-2">{i + 1}.</span>
                {q.text}
              </h3>
              <span
                className={`flex-shrink-0 font-body font-semibold text-sm rounded-full px-3 py-1
                  ${q.isCorrect ? 'bg-green-50 text-menti-positive' : 'bg-red-50 text-menti-coral'}`}
              >
                {q.isCorrect ? `+${q.points} pts` : '0 pts'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-2">
                <span className="font-body text-sm text-menti-text-weak">Your answer:</span>
                <span
                  className={`font-body font-semibold text-sm ${
                    q.isCorrect ? 'text-menti-positive' : 'text-menti-coral'
                  }`}
                >
                  {q.yourAnswer}
                </span>
              </div>
              {!q.isCorrect && (
                <div className="flex items-center gap-2">
                  <span className="font-body text-sm text-menti-text-weak">Correct answer:</span>
                  <span className="font-body font-semibold text-sm text-menti-positive">
                    {q.correctAnswer}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-wrap gap-4">
        <Link
          to={`/leaderboard/${sessionId}`}
          className="bg-menti-brand text-white rounded-full px-8 py-3 font-body font-semibold hover:bg-menti-brand-hover transition-colors text-center"
        >
          View Leaderboard
        </Link>
        <Link
          to="/dashboard"
          className="border border-menti-border rounded-full px-8 py-3 font-body font-semibold text-menti-text-primary hover:bg-menti-surface-sunken transition-colors text-center"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { getQuiz } from '../api/quiz.js';

export function useQuiz(quizId) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!quizId) return;
    setLoading(true);
    getQuiz(quizId)
      .then((data) => setQuiz(data.quiz))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [quizId]);

  function refetch() {
    setLoading(true);
    getQuiz(quizId)
      .then((data) => setQuiz(data.quiz))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  return { quiz, loading, error, refetch };
}

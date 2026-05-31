import { apiRequest } from './client.js';

/* ——————————————————————————————————
   Mock quiz data for demo mode
   —————————————————————————————————— */
let mockQuizzes = [
  {
    id: 'quiz-1',
    title: 'JavaScript Fundamentals',
    description: 'Test your knowledge of JavaScript basics including variables, functions, and data types.',
    isAIGenerated: false,
    questions: [
      { id: 'q1', text: 'What is the typeof null?', type: 'MULTIPLE_CHOICE', options: ['null', 'undefined', 'object', 'string'], correctOptionIndex: 2, timeLimit: 30, points: 10 },
      { id: 'q2', text: 'let and const are block-scoped.', type: 'TRUE_FALSE', options: ['True', 'False'], correctOptionIndex: 0, timeLimit: 20, points: 10 },
      { id: 'q3', text: 'What is a closure?', type: 'OPEN_ENDED', options: [], timeLimit: 60, points: 15 },
    ],
  },
  {
    id: 'quiz-2',
    title: 'World Geography',
    description: 'Explore capitals, landmarks, and physical features from around the globe.',
    isAIGenerated: true,
    questions: [
      { id: 'q4', text: 'What is the capital of Japan?', type: 'MULTIPLE_CHOICE', options: ['Seoul', 'Tokyo', 'Beijing', 'Bangkok'], correctOptionIndex: 1, timeLimit: 30, points: 10 },
      { id: 'q5', text: 'The Amazon River is in Africa.', type: 'TRUE_FALSE', options: ['True', 'False'], correctOptionIndex: 1, timeLimit: 15, points: 10 },
    ],
  },
  {
    id: 'quiz-3',
    title: 'Science Trivia',
    description: 'A fun quiz covering biology, chemistry, and physics concepts.',
    isAIGenerated: false,
    questions: [
      { id: 'q6', text: 'What planet is known as the Red Planet?', type: 'MULTIPLE_CHOICE', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correctOptionIndex: 1, timeLimit: 25, points: 10 },
    ],
  },
];

/* Try real API, fallback to mock */
async function tryApi(fn, mockFn) {
  try { return await fn(); } catch { return mockFn(); }
}

export function createQuiz(data) {
  return tryApi(
    () => apiRequest('/quizzes', { method: 'POST', body: JSON.stringify(data) }),
    () => {
      const quiz = { id: 'quiz-' + Date.now(), ...data, questions: [] };
      mockQuizzes.push(quiz);
      return { quiz };
    }
  );
}

export function getQuizzes() {
  return tryApi(
    () => apiRequest('/quizzes'),
    () => ({ quizzes: mockQuizzes })
  );
}

export function getQuiz(quizId) {
  return tryApi(
    () => apiRequest(`/quizzes/${quizId}`),
    () => {
      const quiz = mockQuizzes.find(q => q.id === quizId) || mockQuizzes[0];
      return { quiz };
    }
  );
}

export function updateQuiz(quizId, data) {
  return tryApi(
    () => apiRequest(`/quizzes/${quizId}`, { method: 'PUT', body: JSON.stringify(data) }),
    () => {
      const idx = mockQuizzes.findIndex(q => q.id === quizId);
      if (idx >= 0) mockQuizzes[idx] = { ...mockQuizzes[idx], ...data };
      return { quiz: mockQuizzes[idx] || data };
    }
  );
}

export function deleteQuiz(quizId) {
  return tryApi(
    () => apiRequest(`/quizzes/${quizId}`, { method: 'DELETE' }),
    () => { mockQuizzes = mockQuizzes.filter(q => q.id !== quizId); return { success: true }; }
  );
}

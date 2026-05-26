export async function generateQuizFromPrompt(prompt) {
  // Placeholder: returns mock quiz data until AI API is configured
  return {
    title: `Quiz about: ${prompt}`,
    description: `Auto-generated quiz based on prompt: ${prompt}`,
    questions: [
      {
        text: "Sample question 1?",
        questionType: "MULTIPLE_CHOICE_SINGLE",
        difficulty: 5,
        points: 100,
        options: [
          { text: "Option A", isCorrect: true, order: 0 },
          { text: "Option B", isCorrect: false, order: 1 },
          { text: "Option C", isCorrect: false, order: 2 },
          { text: "Option D", isCorrect: false, order: 3 },
        ],
      },
    ],
  };
}

export async function generateQuestionsFromTopic(topic, count = 5) {
  // Placeholder: returns mock questions until AI API is configured
  const questions = [];
  for (let i = 1; i <= count; i++) {
    questions.push({
      text: `Sample question ${i} about ${topic}?`,
      questionType: "MULTIPLE_CHOICE_SINGLE",
      difficulty: 5,
      points: 100,
      options: [
        { text: "Option A", isCorrect: i === 1, order: 0 },
        { text: "Option B", isCorrect: i !== 1, order: 1 },
        { text: "Option C", isCorrect: false, order: 2 },
        { text: "Option D", isCorrect: false, order: 3 },
      ],
    });
  }
  return questions;
}

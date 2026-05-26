export function pickNextQuestion(questions, questionResults) {
  const answeredIds = new Set(questionResults.map((r) => r.questionId));
  const unanswered = questions.filter((q) => !answeredIds.has(q.id));
  if (unanswered.length === 0) return null;

  const lastResult = questionResults[questionResults.length - 1];
  if (!lastResult) return unanswered[0];

  const targetDifficulty = adjustDifficulty(
    questions.find((q) => q.id === lastResult.questionId)?.difficulty || 5,
    lastResult.correctionRate
  );

  unanswered.sort(
    (a, b) =>
      Math.abs(a.difficulty - targetDifficulty) -
      Math.abs(b.difficulty - targetDifficulty)
  );
  return unanswered[0];
}

export function adjustDifficulty(currentDifficulty, correctionRate) {
  if (correctionRate > 80) return Math.min(10, currentDifficulty + 2);
  if (correctionRate > 60) return Math.min(10, currentDifficulty + 1);
  if (correctionRate < 30) return Math.max(1, currentDifficulty - 2);
  if (correctionRate < 50) return Math.max(1, currentDifficulty - 1);
  return currentDifficulty;
}

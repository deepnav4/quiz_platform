export function calculatePoints(isCorrect, questionPoints, responseTimeMs, timeLimitMs) {
  if (!isCorrect) return 0;
  if (!timeLimitMs || !responseTimeMs) return questionPoints;
  // Bonus for speed: up to 50% extra if answered in first 25% of time
  const ratio = Math.max(0, 1 - responseTimeMs / timeLimitMs);
  return Math.round(questionPoints * (1 + ratio * 0.5));
}

export function calculateLeaderboard(participants) {
  const sorted = [...participants].sort((a, b) => b.totalScore - a.totalScore);
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].totalScore < sorted[i - 1].totalScore) {
      rank = i + 1;
    }
    sorted[i].rank = rank;
  }
  return sorted;
}

import prisma from "@repo/db";

/**
 * Aggregate votes for a question (excludes host).
 * @param {boolean} revealCorrect - include isCorrect on options (after time up)
 */
export async function buildVoteStats(sessionId, questionId, hostId, revealCorrect = false) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { options: { orderBy: { order: "asc" } } },
  });
  if (!question) return null;

  const responses = await prisma.response.findMany({
    where: { sessionId, questionId, participantId: { not: hostId } },
    include: {
      selectedOptions: true,
      participant: { select: { id: true, name: true } },
    },
  });

  const totalVotes = responses.length;
  const options = question.options.map((opt) => {
    const stat = {
      id: opt.id,
      text: opt.text,
      order: opt.order,
      count: 0,
      percent: 0,
      voters: [],
    };
    if (revealCorrect) stat.isCorrect = opt.isCorrect;
    return stat;
  });

  const byId = Object.fromEntries(options.map((o) => [o.id, o]));

  for (const resp of responses) {
    for (const so of resp.selectedOptions) {
      if (!byId[so.optionId]) continue;
      byId[so.optionId].count++;
      const already = byId[so.optionId].voters.some(
        (v) => String(v.userId) === String(resp.participantId)
      );
      if (!already) {
        byId[so.optionId].voters.push({
          userId: resp.participant.id,
          name: resp.participant.name,
        });
      }
    }
  }

  for (const opt of options) {
    opt.percent = totalVotes > 0 ? Math.round((opt.count / totalVotes) * 100) : 0;
  }

  const correctOptionIds = revealCorrect
    ? question.options.filter((o) => o.isCorrect).map((o) => o.id)
    : undefined;

  return {
    questionId,
    totalVotes,
    options,
    correctOptionIds,
    revealCorrect,
  };
}

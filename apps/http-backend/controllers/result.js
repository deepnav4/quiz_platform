import prisma from "@repo/db";

export async function getSessionResults(req, res, next) {
  try {
    const { sessionId } = req.params;
    const results = await prisma.questionResult.findMany({
      where: { sessionId },
      include: {
        question: { select: { id: true, text: true, questionType: true, order: true } },
      },
      orderBy: { question: { order: "asc" } },
    });
    res.json({ results });
  } catch (err) {
    next(err);
  }
}

export async function getLeaderboard(req, res, next) {
  try {
    const { sessionId } = req.params;
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ message: "Session not found" });

    const participants = await prisma.sessionParticipant.findMany({
      where: { sessionId, userId: { not: session.hostId } },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      orderBy: { totalScore: "desc" },
    });

    // Assign ranks
    const leaderboard = participants.map((p, i) => ({
      rank: i > 0 && p.totalScore === participants[i - 1].totalScore
        ? participants[i - 1].rank || i
        : i + 1,
      userId: p.userId,
      name: p.user.name,
      avatar: p.user.avatar,
      totalScore: p.totalScore,
    }));

    res.json({ leaderboard });
  } catch (err) {
    next(err);
  }
}

export async function getQuestionResult(req, res, next) {
  try {
    const { sessionId, questionId } = req.params;
    const result = await prisma.questionResult.findUnique({
      where: { sessionId_questionId: { sessionId, questionId } },
      include: {
        question: {
          include: { options: { orderBy: { order: "asc" } } },
        },
      },
    });

    if (!result) {
      // Calculate on the fly if not yet computed
      const responses = await prisma.response.findMany({
        where: { sessionId, questionId },
        include: { selectedOptions: { include: { option: true } } },
      });

      const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: { options: { orderBy: { order: "asc" } } },
      });

      if (!question) return res.status(404).json({ message: "Question not found" });

      const totalResponses = responses.length;
      const correctResponses = responses.filter((r) => r.isCorrect).length;
      const correctionRate = totalResponses > 0 ? (correctResponses / totalResponses) * 100 : 0;

      // Option distribution
      const optionCounts = {};
      for (const opt of question.options) {
        optionCounts[opt.id] = { text: opt.text, count: 0, isCorrect: opt.isCorrect };
      }
      for (const resp of responses) {
        for (const so of resp.selectedOptions) {
          if (optionCounts[so.optionId]) optionCounts[so.optionId].count++;
        }
      }

      return res.json({
        result: {
          questionId,
          sessionId,
          totalResponses,
          correctResponses,
          correctionRate: Math.round(correctionRate * 100) / 100,
          resultData: optionCounts,
          question,
        },
      });
    }

    res.json({ result });
  } catch (err) {
    next(err);
  }
}

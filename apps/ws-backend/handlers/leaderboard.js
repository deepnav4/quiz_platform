import { broadcastToRoom, sendToOne } from "../utils/broadcast.js";
import prisma from "@repo/db";

export async function handleBroadcastLeaderboard(ws, data) {
  try {
    const { sessionId } = data;
    const participants = await prisma.sessionParticipant.findMany({
      where: { sessionId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { totalScore: "desc" },
    });

    const leaderboard = participants.map((p, i) => ({
      rank: i + 1,
      userId: p.userId,
      name: p.user.name,
      avatar: p.user.avatar,
      totalScore: p.totalScore,
      isActive: p.isActive,
    }));

    broadcastToRoom(sessionId, {
      type: "leaderboard_update",
      data: { leaderboard },
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    sendToOne(ws, { type: "error", data: { message: "Failed to get leaderboard" } });
  }
}

export async function handleBroadcastQuestionResult(ws, data) {
  try {
    const { sessionId, questionId } = data;

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { options: { orderBy: { order: "asc" } } },
    });
    if (!question) return sendToOne(ws, { type: "error", data: { message: "Question not found" } });

    const responses = await prisma.response.findMany({
      where: { sessionId, questionId },
      include: { selectedOptions: true },
    });

    const totalResponses = responses.length;
    const correctResponses = responses.filter((r) => r.isCorrect).length;
    const correctionRate = totalResponses > 0 ? Math.round((correctResponses / totalResponses) * 100) : 0;

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

    // Upsert question result
    await prisma.questionResult.upsert({
      where: { sessionId_questionId: { sessionId, questionId } },
      create: {
        sessionId,
        questionId,
        totalResponses,
        correctResponses,
        correctionRate,
        resultData: optionCounts,
      },
      update: {
        totalResponses,
        correctResponses,
        correctionRate,
        resultData: optionCounts,
      },
    });

    broadcastToRoom(sessionId, {
      type: "question_result",
      data: {
        questionId,
        totalResponses,
        correctResponses,
        correctionRate,
        optionCounts,
      },
    });
  } catch (err) {
    console.error("Question result error:", err);
    sendToOne(ws, { type: "error", data: { message: "Failed to get question result" } });
  }
}

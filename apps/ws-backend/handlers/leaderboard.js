import { broadcastToRoom, sendToOne } from "../utils/broadcast.js";
import { revealQuestionAnswers } from "../utils/revealAnswers.js";
import { stopTimer } from "../utils/timer.js";
import prisma from "@repo/db";

async function buildLeaderboard(sessionId, hostId) {
  const participants = await prisma.sessionParticipant.findMany({
    where: {
      sessionId,
      userId: hostId ? { not: hostId } : undefined,
    },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { totalScore: "desc" },
  });

  return participants.map((p, i) => ({
    rank: i + 1,
    userId: p.userId,
    name: p.user.name,
    avatar: p.user.avatar,
    totalScore: p.totalScore,
    isActive: p.isActive,
  }));
}

export async function handleBroadcastLeaderboard(ws, data) {
  try {
    const { sessionId } = data;
    if (!ws.user) {
      return sendToOne(ws, { type: "error", data: { message: "Not authenticated" } });
    }

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      return sendToOne(ws, { type: "error", data: { message: "Session not found" } });
    }

    if (String(session.hostId) !== String(ws.user.id)) {
      return sendToOne(ws, { type: "error", data: { message: "Only the host can show the leaderboard" } });
    }

    const leaderboard = await buildLeaderboard(sessionId, session.hostId);

    broadcastToRoom(sessionId, {
      type: "leaderboard_update",
      data: { leaderboard, sessionId },
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    sendToOne(ws, { type: "error", data: { message: "Failed to get leaderboard" } });
  }
}

export async function handleBroadcastQuestionResult(ws, data) {
  try {
    const { sessionId, questionId } = data;

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || String(session.hostId) !== String(ws.user?.id)) {
      return sendToOne(ws, { type: "error", data: { message: "Not authorized" } });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { options: { orderBy: { order: "asc" } } },
    });
    if (!question) return sendToOne(ws, { type: "error", data: { message: "Question not found" } });

    const responses = await prisma.response.findMany({
      where: {
        sessionId,
        questionId,
        participantId: { not: session.hostId },
      },
      include: {
        selectedOptions: true,
        participant: { select: { id: true, name: true } },
      },
    });

    const totalResponses = responses.length;
    const correctResponses = responses.filter((r) => r.isCorrect).length;
    const correctionRate = totalResponses > 0 ? Math.round((correctResponses / totalResponses) * 100) : 0;

    const optionCounts = {};
    for (const opt of question.options) {
      optionCounts[opt.id] = { text: opt.text, count: 0, isCorrect: opt.isCorrect, voters: [] };
    }
    for (const resp of responses) {
      for (const so of resp.selectedOptions) {
        if (optionCounts[so.optionId]) {
          optionCounts[so.optionId].count++;
          optionCounts[so.optionId].voters.push({
            userId: resp.participant.id,
            name: resp.participant.name,
          });
        }
      }
    }

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

    if (session) {
      stopTimer(sessionId);
      await prisma.sessionState.update({
        where: { sessionId },
        data: { isAcceptingResponses: false },
      });
      await revealQuestionAnswers(sessionId, questionId, session.hostId);
    }
  } catch (err) {
    console.error("Question result error:", err);
    sendToOne(ws, { type: "error", data: { message: "Failed to get question result" } });
  }
}

import { broadcastToRoom, sendToOne } from "../utils/broadcast.js";
import { startTimer, stopTimer } from "../utils/timer.js";
import prisma from "@repo/db";

export async function handleStartQuiz(ws, data) {
  try {
    const { sessionId } = data;
    if (!ws.user) return sendToOne(ws, { type: "error", data: { message: "Not authenticated" } });

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || String(session.hostId) !== String(ws.user.id)) {
      return sendToOne(ws, { type: "error", data: { message: "Not authorized" } });
    }

    // Host is not a quiz participant — remove if they were added in the waiting room
    await prisma.sessionParticipant.deleteMany({
      where: { sessionId, userId: session.hostId },
    });

    const participantCount = await prisma.sessionParticipant.count({
      where: { sessionId, isActive: true, userId: { not: session.hostId } },
    });
    await prisma.sessionState.update({
      where: { sessionId },
      data: { participantCount },
    });

    await prisma.session.update({
      where: { id: sessionId },
      data: { status: "LIVE", startedAt: new Date() },
    });

    broadcastToRoom(sessionId, {
      type: "quiz_started",
      data: { sessionId },
    });
  } catch (err) {
    console.error("Start quiz error:", err);
    sendToOne(ws, { type: "error", data: { message: "Failed to start quiz" } });
  }
}

export async function handlePauseQuiz(ws, data) {
  try {
    const { sessionId } = data;
    if (!ws.user) return;

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || String(session.hostId) !== String(ws.user.id)) return;

    stopTimer(sessionId);

    await prisma.session.update({
      where: { id: sessionId },
      data: { status: "PAUSED" },
    });
    await prisma.sessionState.update({
      where: { sessionId },
      data: { isAcceptingResponses: false },
    });

    broadcastToRoom(sessionId, { type: "quiz_paused", data: { sessionId } });
  } catch (err) {
    console.error("Pause quiz error:", err);
  }
}

export async function handleResumeQuiz(ws, data) {
  try {
    const { sessionId } = data;
    if (!ws.user) return;

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || String(session.hostId) !== String(ws.user.id)) return;

    await prisma.session.update({
      where: { id: sessionId },
      data: { status: "LIVE" },
    });
    await prisma.sessionState.update({
      where: { sessionId },
      data: { isAcceptingResponses: true },
    });

    broadcastToRoom(sessionId, { type: "quiz_resumed", data: { sessionId } });
  } catch (err) {
    console.error("Resume quiz error:", err);
  }
}

export async function handleEndQuiz(ws, data) {
  try {
    const { sessionId } = data;
    if (!ws.user) return;

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || String(session.hostId) !== String(ws.user.id)) return;

    stopTimer(sessionId);

    await prisma.session.update({
      where: { id: sessionId },
      data: { status: "COMPLETED", endedAt: new Date() },
    });
    await prisma.sessionState.update({
      where: { sessionId },
      data: { isAcceptingResponses: false },
    });

    // Calculate final ranks
    const participants = await prisma.sessionParticipant.findMany({
      where: { sessionId },
      orderBy: { totalScore: "desc" },
    });
    let rank = 1;
    for (let i = 0; i < participants.length; i++) {
      if (i > 0 && participants[i].totalScore < participants[i - 1].totalScore) rank = i + 1;
      await prisma.sessionParticipant.update({
        where: { id: participants[i].id },
        data: { rank },
      });
    }

    broadcastToRoom(sessionId, { type: "quiz_ended", data: { sessionId } });
  } catch (err) {
    console.error("End quiz error:", err);
  }
}

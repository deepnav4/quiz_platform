import prisma from "@repo/db";
import { broadcastToRoom, sendToUserInRoom, broadcastToParticipants } from "./broadcast.js";
import { buildVoteStats } from "./voteStats.js";

/** After time up or host reveals: send personal results to students + full stats to host. */
export async function revealQuestionAnswers(sessionId, questionId, hostId) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { options: true },
  });
  if (!question) return;

  const correctOptionIds = question.options.filter((o) => o.isCorrect).map((o) => o.id);

  const responses = await prisma.response.findMany({
    where: { sessionId, questionId, participantId: { not: hostId } },
  });

  for (const resp of responses) {
    const participant = await prisma.sessionParticipant.findUnique({
      where: { sessionId_userId: { sessionId, userId: resp.participantId } },
    });

    sendToUserInRoom(sessionId, resp.participantId, {
      type: "answers_revealed",
      data: {
        questionId,
        isCorrect: resp.isCorrect,
        pointsEarned: resp.pointsEarned,
        totalScore: participant?.totalScore ?? 0,
        correctOptionIds,
      },
    });
  }

  // Students who didn't answer still get time_up state; no personal reveal

  const stats = await buildVoteStats(sessionId, questionId, hostId, true);
  broadcastToRoom(sessionId, { type: "host_vote_stats", data: { ...stats, hostId } });
  broadcastToRoom(sessionId, { type: "host_time_up", data: { questionId, hostId } });

  broadcastToParticipants(sessionId, hostId, {
    type: "time_up",
    data: { questionId },
  });
}

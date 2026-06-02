import { broadcastToRoom, sendToOne } from "../utils/broadcast.js";
import { startTimer, stopTimer } from "../utils/timer.js";
import { isSessionHost } from "../utils/sessionHelpers.js";
import { buildVoteStats } from "../utils/voteStats.js";
import { revealQuestionAnswers } from "../utils/revealAnswers.js";
import prisma from "@repo/db";

async function pushHostVoteStats(sessionId, hostId, questionId, revealCorrect = false) {
  const stats = await buildVoteStats(sessionId, questionId, hostId, revealCorrect);
  if (stats) {
    broadcastToRoom(sessionId, {
      type: "host_vote_stats",
      data: { ...stats, hostId },
    });
  }
}

export async function handleNextQuestion(ws, data) {
  try {
    const { sessionId } = data;
    if (!ws.user) return sendToOne(ws, { type: "error", data: { message: "Not authenticated" } });

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        sessionState: true,
        quiz: {
          include: {
            questions: {
              include: { options: { orderBy: { order: "asc" } } },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!session || !isSessionHost(session, ws.user.id)) {
      return sendToOne(ws, { type: "error", data: { message: "Not authorized" } });
    }

    stopTimer(sessionId);

    const questions = session.quiz.questions;
    const currentIndex = session.sessionState.currentQuestionIndex;

    if (currentIndex >= questions.length) {
      return sendToOne(ws, { type: "error", data: { message: "No more questions" } });
    }

    const question = questions[currentIndex];

    await prisma.sessionState.update({
      where: { sessionId },
      data: {
        currentQuestionIndex: currentIndex + 1,
        questionStartedAt: new Date(),
        isAcceptingResponses: true,
      },
    });

    await prisma.session.update({
      where: { id: sessionId },
      data: { currentQuestionId: question.id },
    });

    const safeOptions = question.options.map(({ id, text, imageUrl, order }) => ({
      id,
      text,
      imageUrl,
      order,
    }));

    broadcastToRoom(sessionId, {
      type: "question_started",
      data: {
        questionId: question.id,
        questionType: question.questionType,
        text: question.text,
        imageUrl: question.imageUrl,
        options: safeOptions,
        points: question.points,
        hasTimeLimit: question.hasTimeLimit,
        timeLimitSeconds: question.timeLimitSeconds,
        questionIndex: currentIndex,
        totalQuestions: questions.length,
        hostId: session.hostId,
      },
    });

    await pushHostVoteStats(sessionId, session.hostId, question.id, false);

    if (question.hasTimeLimit && question.timeLimitSeconds) {
      startTimer(sessionId, question.timeLimitSeconds * 1000, async () => {
        await prisma.sessionState.update({
          where: { sessionId },
          data: { isAcceptingResponses: false },
        });
        await revealQuestionAnswers(sessionId, question.id, session.hostId);
      });
    }
  } catch (err) {
    console.error("Next question error:", err);
    sendToOne(ws, { type: "error", data: { message: "Failed to advance question" } });
  }
}

export async function handleSubmitResponse(ws, data) {
  try {
    if (!ws.user) return sendToOne(ws, { type: "error", data: { message: "Not authenticated" } });
    const { sessionId, questionId, selectedOptionIds } = data;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { sessionState: true },
    });

    if (!session || session.status !== "LIVE") {
      return sendToOne(ws, { type: "error", data: { message: "Session not live" } });
    }

    if (isSessionHost(session, ws.user.id)) {
      return sendToOne(ws, { type: "error", data: { message: "Host cannot submit answers" } });
    }

    if (!session.sessionState.isAcceptingResponses) {
      return sendToOne(ws, { type: "error", data: { message: "Not accepting responses" } });
    }

    const existing = await prisma.response.findUnique({
      where: {
        sessionId_questionId_participantId: {
          sessionId,
          questionId,
          participantId: ws.user.id,
        },
      },
    });
    if (existing) {
      return sendToOne(ws, { type: "error", data: { message: "Already answered" } });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { options: true },
    });
    if (!question) return sendToOne(ws, { type: "error", data: { message: "Question not found" } });

    const correctOptionIds = question.options.filter((o) => o.isCorrect).map((o) => o.id);
    const selected = selectedOptionIds || [];
    const isCorrect =
      correctOptionIds.length === selected.length &&
      correctOptionIds.every((id) => selected.includes(id));

    const pointsEarned = isCorrect ? question.points : 0;

    const questionStartedAt = session.sessionState.questionStartedAt;
    const responseTimeMs = questionStartedAt
      ? Date.now() - new Date(questionStartedAt).getTime()
      : null;

    await prisma.response.create({
      data: {
        sessionId,
        questionId,
        participantId: ws.user.id,
        responseData: { selectedOptionIds: selected },
        isCorrect,
        pointsEarned,
        responseTimeMs,
        selectedOptions: {
          create: selected.map((optionId) => ({ optionId })),
        },
      },
    });

    await prisma.sessionParticipant.update({
      where: { sessionId_userId: { sessionId, userId: ws.user.id } },
      data: { totalScore: { increment: pointsEarned } },
    });

    // Acknowledge only — no right/wrong until time is up (or host reveals)
    sendToOne(ws, {
      type: "response_ack",
      data: { questionId, locked: true },
    });

    broadcastToRoom(sessionId, {
      type: "host_participant_voted",
      data: {
        hostId: session.hostId,
        questionId,
        userId: ws.user.id,
        name: ws.user.name,
        optionIds: selected,
      },
    });

    await pushHostVoteStats(sessionId, session.hostId, questionId, false);

    const responseCount = await prisma.response.count({
      where: { sessionId, questionId, participantId: { not: session.hostId } },
    });

    const participantCount = await prisma.sessionParticipant.count({
      where: { sessionId, isActive: true, userId: { not: session.hostId } },
    });

    broadcastToRoom(sessionId, {
      type: "host_response_count",
      data: { hostId: session.hostId, questionId, count: responseCount, total: participantCount },
    });
  } catch (err) {
    console.error("Submit response error:", err);
    sendToOne(ws, { type: "error", data: { message: "Failed to submit response" } });
  }
}

/** Host ends accepting answers early (untimed or manual reveal). */
export async function handleRevealAnswers(ws, data) {
  try {
    const { sessionId, questionId } = data;
    if (!ws.user) return;

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || !isSessionHost(session, ws.user.id)) {
      return sendToOne(ws, { type: "error", data: { message: "Not authorized" } });
    }

    const qId = questionId || session.currentQuestionId;
    if (!qId) return;

    stopTimer(sessionId);
    await prisma.sessionState.update({
      where: { sessionId },
      data: { isAcceptingResponses: false },
    });

    await revealQuestionAnswers(sessionId, qId, session.hostId);
  } catch (err) {
    console.error("Reveal answers error:", err);
  }
}

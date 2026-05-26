import { broadcastToRoom, sendToOne } from "../utils/broadcast.js";
import { startTimer, stopTimer } from "../utils/timer.js";
import prisma from "@repo/db";

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

    if (!session || session.hostId !== ws.user.id) {
      return sendToOne(ws, { type: "error", data: { message: "Not authorized" } });
    }

    const questions = session.quiz.questions;
    const currentIndex = session.sessionState.currentQuestionIndex;

    if (currentIndex >= questions.length) {
      return sendToOne(ws, { type: "error", data: { message: "No more questions" } });
    }

    const question = questions[currentIndex];

    // Update session state
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

    // Strip isCorrect from options before broadcasting
    const safeOptions = question.options.map(({ id, text, imageUrl, order }) => ({
      id, text, imageUrl, order,
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
      },
    });

    // Start timer if timed
    if (question.hasTimeLimit && question.timeLimitSeconds) {
      startTimer(sessionId, question.timeLimitSeconds * 1000, async () => {
        // Time expired - stop accepting responses
        await prisma.sessionState.update({
          where: { sessionId },
          data: { isAcceptingResponses: false },
        });
        broadcastToRoom(sessionId, {
          type: "time_up",
          data: { questionId: question.id },
        });
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
    if (!session.sessionState.isAcceptingResponses) {
      return sendToOne(ws, { type: "error", data: { message: "Not accepting responses" } });
    }

    // Check if already answered
    const existing = await prisma.response.findUnique({
      where: {
        sessionId_questionId_participantId: {
          sessionId, questionId, participantId: ws.user.id,
        },
      },
    });
    if (existing) {
      return sendToOne(ws, { type: "error", data: { message: "Already answered" } });
    }

    // Get question with correct options
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { options: true },
    });
    if (!question) return sendToOne(ws, { type: "error", data: { message: "Question not found" } });

    // Check correctness
    const correctOptionIds = question.options.filter((o) => o.isCorrect).map((o) => o.id);
    const selected = selectedOptionIds || [];
    const isCorrect =
      correctOptionIds.length === selected.length &&
      correctOptionIds.every((id) => selected.includes(id));

    const pointsEarned = isCorrect ? question.points : 0;

    // Calculate response time
    const questionStartedAt = session.sessionState.questionStartedAt;
    const responseTimeMs = questionStartedAt ? Date.now() - new Date(questionStartedAt).getTime() : null;

    // Create response
    const response = await prisma.response.create({
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

    // Update participant score
    await prisma.sessionParticipant.update({
      where: { sessionId_userId: { sessionId, userId: ws.user.id } },
      data: { totalScore: { increment: pointsEarned } },
    });

    const participant = await prisma.sessionParticipant.findUnique({
      where: { sessionId_userId: { sessionId, userId: ws.user.id } },
    });

    sendToOne(ws, {
      type: "response_received",
      data: {
        isCorrect,
        pointsEarned,
        totalScore: participant.totalScore,
        correctOptionIds,
      },
    });

    // Notify host of response count
    const responseCount = await prisma.response.count({
      where: { sessionId, questionId },
    });
    broadcastToRoom(sessionId, {
      type: "response_count",
      data: { questionId, count: responseCount },
    });
  } catch (err) {
    console.error("Submit response error:", err);
    sendToOne(ws, { type: "error", data: { message: "Failed to submit response" } });
  }
}

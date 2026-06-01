import { prisma } from "@repo/db";
import {
  COMPUTER_NETWORKS_QUIZ_META,
  COMPUTER_NETWORKS_QUESTIONS,
} from "../data/computerNetworksQuiz.js";

const PROFESSOR_EMAIL = "professor@university.edu";

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Create (or replace) the Advanced Computer Networks quiz for the professor.
 * @param {string} hostId - Professor user UUID
 * @param {Date} [now]
 * @param {{ createWaitingSession?: boolean }} [opts]
 */
export async function seedComputerNetworksQuiz(hostId, now = new Date(), opts = {}) {
  const { createWaitingSession = true } = opts;

  const existing = await prisma.quiz.findFirst({
    where: { title: COMPUTER_NETWORKS_QUIZ_META.title, creatorId: hostId },
    include: { sessions: true, questions: true },
  });

  if (existing) {
    await prisma.session.deleteMany({ where: { quizId: existing.id } });
    await prisma.question.deleteMany({ where: { quizId: existing.id } });
    await prisma.quiz.delete({ where: { id: existing.id } });
    console.log(`[CN] Removed previous "${COMPUTER_NETWORKS_QUIZ_META.title}" quiz`);
  }

  const quiz = await prisma.quiz.create({
    data: {
      title: COMPUTER_NETWORKS_QUIZ_META.title,
      description: COMPUTER_NETWORKS_QUIZ_META.description,
      creatorId: hostId,
      isAIGenerated: COMPUTER_NETWORKS_QUIZ_META.isAIGenerated,
      enableAdaptiveDifficulty: COMPUTER_NETWORKS_QUIZ_META.enableAdaptiveDifficulty,
      expiresAt: addDays(now, 14),
    },
  });

  for (const q of COMPUTER_NETWORKS_QUESTIONS) {
    const { options, ...questionData } = q;
    await prisma.question.create({
      data: {
        quizId: quiz.id,
        ...questionData,
        options: options ? { create: options } : undefined,
      },
    });
  }

  console.log(
    `[CN] Quiz "${quiz.title}" — ${COMPUTER_NETWORKS_QUESTIONS.length} questions (creatorId: ${hostId})`
  );

  let session = null;
  if (createWaitingSession) {
    const firstQuestion = await prisma.question.findFirst({
      where: { quizId: quiz.id },
      orderBy: { order: "asc" },
    });

    session = await prisma.session.create({
      data: {
        quizId: quiz.id,
        hostId,
        joinCode: COMPUTER_NETWORKS_QUIZ_META.joinCode,
        status: "WAITING_ROOM",
        currentQuestionId: firstQuestion?.id ?? null,
        allowLateJoiners: true,
        allowRejoin: true,
        expiresAt: addDays(now, 7),
      },
    });

    await prisma.sessionState.create({
      data: {
        sessionId: session.id,
        currentQuestionIndex: 0,
        isAcceptingResponses: false,
        participantCount: 0,
      },
    });

    console.log(`[CN] Waiting room session — join code: ${session.joinCode}`);
  }

  return { quiz, session };
}

/** Standalone: find professor by email and seed quiz only (no full DB wipe). */
export async function seedComputerNetworksForProfessor() {
  const host = await prisma.user.findUnique({ where: { email: PROFESSOR_EMAIL } });
  if (!host) {
    throw new Error(
      `User ${PROFESSOR_EMAIL} not found. Run the full ws-backend seed first: npm run seed --workspace=ws-backend`
    );
  }
  console.log(`[CN] Seeding for ${host.name} (${host.id})\n`);
  return seedComputerNetworksQuiz(host.id);
}

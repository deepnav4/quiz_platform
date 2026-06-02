import prisma from "@repo/db";
import { generateJoinCode } from "../utils/joinCode.js";
import { verifyToken } from "../utils/token.js";

export async function createSession(req, res, next) {
  try {
    const { quizId, allowLateJoiners, allowRejoin } = req.body;
    if (!quizId) return res.status(400).json({ message: "quizId is required" });

    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    if (quiz.creatorId !== req.user.id) return res.status(403).json({ message: "Forbidden" });

    // Generate unique join code
    let joinCode;
    let exists = true;
    while (exists) {
      joinCode = generateJoinCode();
      exists = !!(await prisma.session.findUnique({ where: { joinCode } }));
    }

    const session = await prisma.session.create({
      data: {
        quizId,
        hostId: req.user.id,
        joinCode,
        status: "WAITING_ROOM",
        allowLateJoiners: allowLateJoiners ?? true,
        allowRejoin: allowRejoin ?? true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        sessionState: {
          create: {
            currentQuestionIndex: 0,
            isAcceptingResponses: false,
            participantCount: 0,
          },
        },
      },
      include: { sessionState: true, quiz: { select: { title: true } } },
    });

    res.status(201).json({ session });
  } catch (err) {
    next(err);
  }
}

export async function getSession(req, res, next) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
      include: {
        quiz: { select: { title: true, id: true } },
        sessionState: true,
        participants: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { totalScore: "desc" },
        },
        _count: { select: { responses: true } },
      },
    });
    if (!session) return res.status(404).json({ message: "Session not found" });

    const participants = (session.participants || []).filter(
      (p) => String(p.userId) !== String(session.hostId)
    );
    const participantCount = participants.filter((p) => p.isActive).length;

    res.json({
      session: {
        ...session,
        participants,
        participantCount,
        sessionState: session.sessionState
          ? { ...session.sessionState, participantCount }
          : session.sessionState,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function joinSession(req, res, next) {
  try {
    const { joinCode } = req.body;
    if (!joinCode) return res.status(400).json({ message: "joinCode is required" });

    // Try to get user from token if present
    let userId = null;
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      try {
        const decoded = verifyToken(header.split(" ")[1]);
        userId = decoded.id;
      } catch (e) {
        // ignore invalid token
      }
    }
    if (!userId) return res.status(401).json({ message: "Authentication required to join" });

    const session = await prisma.session.findUnique({
      where: { joinCode },
      include: { sessionState: true },
    });
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.status === "COMPLETED") {
      return res.status(400).json({ message: "Session has ended" });
    }
    if (session.status === "LIVE" && !session.allowLateJoiners) {
      return res.status(400).json({ message: "Session does not allow late joiners" });
    }
    if (!["WAITING_ROOM", "LIVE"].includes(session.status)) {
      return res.status(400).json({ message: "Session is not accepting participants" });
    }

    if (String(session.hostId) === String(userId)) {
      await prisma.sessionParticipant.deleteMany({
        where: { sessionId: session.id, userId },
      });
      const count = await prisma.sessionParticipant.count({
        where: { sessionId: session.id, isActive: true, userId: { not: session.hostId } },
      });
      await prisma.sessionState.update({
        where: { sessionId: session.id },
        data: { participantCount: count },
      });
      return res.json({
        session: {
          id: session.id,
          quizId: session.quizId,
          status: session.status,
          joinCode: session.joinCode,
          hostId: session.hostId,
        },
        role: "host",
        participantCount: count,
      });
    }

    // Upsert participant
    const participant = await prisma.sessionParticipant.upsert({
      where: { sessionId_userId: { sessionId: session.id, userId } },
      create: { sessionId: session.id, userId, isActive: true },
      update: { isActive: true, lastSeenAt: new Date() },
    });

    const count = await prisma.sessionParticipant.count({
      where: { sessionId: session.id, isActive: true, userId: { not: session.hostId } },
    });
    await prisma.sessionState.update({
      where: { sessionId: session.id },
      data: { participantCount: count },
    });

    res.json({
      session: { id: session.id, quizId: session.quizId, status: session.status, joinCode: session.joinCode },
      participantId: participant.id,
    });
  } catch (err) {
    next(err);
  }
}

export async function startSession(req, res, next) {
  try {
    const session = await prisma.session.findUnique({ where: { id: req.params.sessionId } });
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.hostId !== req.user.id) return res.status(403).json({ message: "Only host can start" });
    if (session.status !== "WAITING_ROOM") {
      return res.status(400).json({ message: "Session can only be started from waiting room" });
    }

    await prisma.sessionParticipant.deleteMany({
      where: { sessionId: session.id, userId: session.hostId },
    });
    const participantCount = await prisma.sessionParticipant.count({
      where: { sessionId: session.id, isActive: true, userId: { not: session.hostId } },
    });
    await prisma.sessionState.update({
      where: { sessionId: session.id },
      data: { participantCount },
    });

    const updated = await prisma.session.update({
      where: { id: req.params.sessionId },
      data: { status: "LIVE", startedAt: new Date() },
      include: { sessionState: true },
    });

    res.json({ session: { ...updated, participantCount } });
  } catch (err) {
    next(err);
  }
}

export async function endSession(req, res, next) {
  try {
    const session = await prisma.session.findUnique({ where: { id: req.params.sessionId } });
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.hostId !== req.user.id) return res.status(403).json({ message: "Only host can end" });

    const updated = await prisma.session.update({
      where: { id: req.params.sessionId },
      data: { status: "COMPLETED", endedAt: new Date() },
    });

    // Set accepting responses to false
    await prisma.sessionState.update({
      where: { sessionId: session.id },
      data: { isAcceptingResponses: false },
    });

    // Calculate final ranks
    const participants = await prisma.sessionParticipant.findMany({
      where: { sessionId: session.id },
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

    res.json({ session: updated });
  } catch (err) {
    next(err);
  }
}

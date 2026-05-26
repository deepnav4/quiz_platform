import prisma from "@repo/db";

export async function createQuiz(req, res, next) {
  try {
    const { title, description, enableAdaptiveDifficulty } = req.body;
    if (!title) return res.status(400).json({ message: "title is required" });

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description: description || null,
        creatorId: req.user.id,
        enableAdaptiveDifficulty: enableAdaptiveDifficulty || false,
      },
      include: { questions: { include: { options: true }, orderBy: { order: "asc" } } },
    });
    res.status(201).json({ quiz });
  } catch (err) {
    next(err);
  }
}

export async function getMyQuizzes(req, res, next) {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: { creatorId: req.user.id },
      include: { _count: { select: { questions: true, sessions: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ quizzes });
  } catch (err) {
    next(err);
  }
}

export async function getQuiz(req, res, next) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.quizId },
      include: {
        questions: {
          include: { options: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
        _count: { select: { sessions: true } },
      },
    });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json({ quiz });
  } catch (err) {
    next(err);
  }
}

export async function updateQuiz(req, res, next) {
  try {
    const quiz = await prisma.quiz.findUnique({ where: { id: req.params.quizId } });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    if (quiz.creatorId !== req.user.id) return res.status(403).json({ message: "Forbidden" });

    const { title, description, enableAdaptiveDifficulty } = req.body;
    const updated = await prisma.quiz.update({
      where: { id: req.params.quizId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(enableAdaptiveDifficulty !== undefined && { enableAdaptiveDifficulty }),
      },
      include: { questions: { include: { options: true }, orderBy: { order: "asc" } } },
    });
    res.json({ quiz: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteQuiz(req, res, next) {
  try {
    const quiz = await prisma.quiz.findUnique({ where: { id: req.params.quizId } });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    if (quiz.creatorId !== req.user.id) return res.status(403).json({ message: "Forbidden" });

    await prisma.quiz.delete({ where: { id: req.params.quizId } });
    res.json({ message: "Quiz deleted" });
  } catch (err) {
    next(err);
  }
}

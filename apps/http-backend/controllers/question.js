import prisma from "@repo/db";

function normalizeDifficulty(value) {
  if (value === undefined || value === null || value === "") {
    return 5;
  }

  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim().toUpperCase();

    if (trimmed === "EASY") return 3;
    if (trimmed === "MEDIUM") return 5;
    if (trimmed === "HARD") return 8;

    const parsed = Number.parseInt(trimmed, 10);
    if (Number.isInteger(parsed)) {
      return parsed;
    }
  }

  return 5;
}

export async function addQuestion(req, res, next) {
  try {
    const { quizId } = req.params;
    const { questionType, text, imageUrl, difficulty, hasTimeLimit, timeLimitSeconds, points, options } = req.body;

    if (!questionType || !text) {
      return res.status(400).json({ message: "questionType and text are required" });
    }

    // Get max order for this quiz
    const maxOrder = await prisma.question.aggregate({
      where: { quizId },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    const question = await prisma.question.create({
      data: {
        quizId,
        questionType,
        text,
        imageUrl: imageUrl || null,
        order: nextOrder,
        difficulty: normalizeDifficulty(difficulty),
        hasTimeLimit: hasTimeLimit || false,
        timeLimitSeconds: timeLimitSeconds || null,
        points: points || 100,
        options: options
          ? {
              create: options.map((opt, i) => ({
                text: opt.text,
                isCorrect: opt.isCorrect || false,
                order: i,
                imageUrl: opt.imageUrl || null,
              })),
            }
          : undefined,
      },
      include: { options: { orderBy: { order: "asc" } } },
    });

    res.status(201).json({ question });
  } catch (err) {
    next(err);
  }
}

export async function updateQuestion(req, res, next) {
  try {
    const { questionId } = req.params;
    const { text, questionType, imageUrl, difficulty, hasTimeLimit, timeLimitSeconds, points, options } = req.body;

    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) return res.status(404).json({ message: "Question not found" });

    // If options provided, delete existing and create new
    if (options) {
      await prisma.option.deleteMany({ where: { questionId } });
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        ...(text !== undefined && { text }),
        ...(questionType !== undefined && { questionType }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(difficulty !== undefined && { difficulty: normalizeDifficulty(difficulty) }),
        ...(hasTimeLimit !== undefined && { hasTimeLimit }),
        ...(timeLimitSeconds !== undefined && { timeLimitSeconds }),
        ...(points !== undefined && { points }),
        ...(options && {
          options: {
            create: options.map((opt, i) => ({
              text: opt.text,
              isCorrect: opt.isCorrect || false,
              order: i,
              imageUrl: opt.imageUrl || null,
            })),
          },
        }),
      },
      include: { options: { orderBy: { order: "asc" } } },
    });

    res.json({ question: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteQuestion(req, res, next) {
  try {
    const { questionId } = req.params;
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) return res.status(404).json({ message: "Question not found" });

    await prisma.question.delete({ where: { id: questionId } });
    res.json({ message: "Question deleted" });
  } catch (err) {
    next(err);
  }
}

export async function reorderQuestions(req, res, next) {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ message: "orderedIds must be an array" });
    }

    const updates = orderedIds.map((id, index) =>
      prisma.question.update({ where: { id }, data: { order: index } })
    );
    await prisma.$transaction(updates);

    res.json({ message: "Questions reordered" });
  } catch (err) {
    next(err);
  }
}

import { prisma } from "@repo/db";

// ── Helper ──────────────────────────────────────────────────────────────────
function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log("🌱 Seeding database…\n");

  // ── Clean up (reverse dependency order) ────────────────────────────────
  await prisma.responseOption.deleteMany();
  await prisma.response.deleteMany();
  await prisma.questionResult.deleteMany();
  await prisma.sessionParticipant.deleteMany();
  await prisma.sessionState.deleteMany();
  await prisma.session.deleteMany();
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.user.deleteMany();
  console.log("🗑️  Cleaned existing data\n");

  // ──────────────────────────────────────────────────────────────────────
  // 1. USERS  (1 creator + 3 participants)
  // ──────────────────────────────────────────────────────────────────────
  const creator = await prisma.user.create({
    data: {
      email: "creator@quizapp.com",
      passwordHash: "$2b$10$fakehashforcreator1234567890abcdef",
      name: "Quiz Master",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=QM",
      role: "USER",
    },
  });
  console.log(`✅ Creator: ${creator.name} (${creator.email})`);

  const participants = await Promise.all([
    prisma.user.create({
      data: {
        email: "alice@example.com",
        passwordHash: "$2b$10$fakehashforalice1234567890abcdef",
        name: "Alice",
        avatar: "https://api.dicebear.com/7.x/initials/svg?seed=A",
      },
    }),
    prisma.user.create({
      data: {
        email: "bob@example.com",
        passwordHash: "$2b$10$fakehashforbob1234567890abcdefgh",
        name: "Bob",
        avatar: "https://api.dicebear.com/7.x/initials/svg?seed=B",
      },
    }),
    prisma.user.create({
      data: {
        email: "charlie@example.com",
        passwordHash: "$2b$10$fakehashforcharlie1234567890abcd",
        name: "Charlie",
        avatar: "https://api.dicebear.com/7.x/initials/svg?seed=C",
      },
    }),
  ]);
  console.log(`✅ Participants: ${participants.map((p) => p.name).join(", ")}`);

  // ──────────────────────────────────────────────────────────────────────
  // 2. QUIZ  (JavaScript Fundamentals — 5 questions, all types)
  // ──────────────────────────────────────────────────────────────────────
  const quiz = await prisma.quiz.create({
    data: {
      title: "JavaScript Fundamentals",
      description: "Test your knowledge of core JavaScript concepts.",
      creatorId: creator.id,
      isAIGenerated: false,
      enableAdaptiveDifficulty: true,
      expiresAt: addDays(new Date(), 7),
    },
  });
  console.log(`✅ Quiz: "${quiz.title}"`);

  // ── Q1: Single-select MCQ (Easy) ─────────────────────────────────────
  const q1 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      questionType: "MULTIPLE_CHOICE_SINGLE",
      text: "Which keyword is used to declare a constant in JavaScript?",
      order: 0,
      difficulty: 2,
      hasTimeLimit: true,
      timeLimitSeconds: 15,
      points: 100,
      options: {
        create: [
          { text: "var", isCorrect: false, order: 0 },
          { text: "let", isCorrect: false, order: 1 },
          { text: "const", isCorrect: true, order: 2 },
          { text: "define", isCorrect: false, order: 3 },
        ],
      },
    },
    include: { options: true },
  });
  console.log(`   📝 Q1 [MCQ-Single] "${q1.text}" (4 options)`);

  // ── Q2: Multi-select MCQ (Medium) ────────────────────────────────────
  const q2 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      questionType: "MULTIPLE_CHOICE_MULTI",
      text: "Which of the following are falsy values in JavaScript? (select all)",
      order: 1,
      difficulty: 5,
      hasTimeLimit: true,
      timeLimitSeconds: 20,
      points: 150,
      options: {
        create: [
          { text: "0", isCorrect: true, order: 0 },
          { text: '""', isCorrect: true, order: 1 },
          { text: "null", isCorrect: true, order: 2 },
          { text: '"false"', isCorrect: false, order: 3 },
          { text: "[]", isCorrect: false, order: 4 },
        ],
      },
    },
    include: { options: true },
  });
  console.log(`   📝 Q2 [MCQ-Multi]  "${q2.text}" (5 options)`);

  // ── Q3: True/False (Easy) ────────────────────────────────────────────
  const q3 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      questionType: "TRUE_FALSE",
      text: "JavaScript is a statically typed language.",
      order: 2,
      difficulty: 1,
      hasTimeLimit: true,
      timeLimitSeconds: 10,
      points: 50,
      options: {
        create: [
          { text: "True", isCorrect: false, order: 0 },
          { text: "False", isCorrect: true, order: 1 },
        ],
      },
    },
    include: { options: true },
  });
  console.log(`   📝 Q3 [True/False] "${q3.text}" (2 options)`);

  // ── Q4: Rating Scale (Medium) ────────────────────────────────────────
  const q4 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      questionType: "RATING_SCALE",
      text: "On a scale of 1–10, how confident are you with closures in JS?",
      order: 3,
      difficulty: 5,
      hasTimeLimit: false,
      points: 0,
    },
  });
  console.log(`   📝 Q4 [Rating]     "${q4.text}"`);

  // ── Q5: Open-Ended (Hard) ────────────────────────────────────────────
  const q5 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      questionType: "OPEN_ENDED",
      text: "Explain the difference between == and === in JavaScript.",
      order: 4,
      difficulty: 7,
      hasTimeLimit: false,
      points: 200,
    },
  });
  console.log(`   📝 Q5 [Open-Ended] "${q5.text}"\n`);

  // ──────────────────────────────────────────────────────────────────────
  // 3. SESSION  (COMPLETED session with join code)
  // ──────────────────────────────────────────────────────────────────────
  const session = await prisma.session.create({
    data: {
      quizId: quiz.id,
      hostId: creator.id,
      joinCode: "98765432",
      status: "COMPLETED",
      currentQuestionId: q5.id,
      allowLateJoiners: true,
      allowRejoin: true,
      startedAt: new Date(),
      endedAt: new Date(),
      expiresAt: addDays(new Date(), 7),
    },
  });
  console.log(`✅ Session: ${session.joinCode} (${session.status})`);

  // ── Session State ────────────────────────────────────────────────────
  await prisma.sessionState.create({
    data: {
      sessionId: session.id,
      currentQuestionIndex: 4,
      questionStartedAt: new Date(),
      isAcceptingResponses: false,
      participantCount: 3,
    },
  });
  console.log("✅ Session state created");

  // ──────────────────────────────────────────────────────────────────────
  // 4. SESSION PARTICIPANTS  (all 3 joined)
  // ──────────────────────────────────────────────────────────────────────
  const sessionParticipants = await Promise.all(
    participants.map((p, i) =>
      prisma.sessionParticipant.create({
        data: {
          sessionId: session.id,
          userId: p.id,
          isActive: false,
          totalScore: [350, 250, 300][i],
          rank: [1, 3, 2][i],
        },
      })
    )
  );
  console.log(
    `✅ Participants joined: ${participants.map((p, i) => `${p.name} (#${sessionParticipants[i].rank}, ${sessionParticipants[i].totalScore}pts)`).join(", ")}`
  );

  // ──────────────────────────────────────────────────────────────────────
  // 5. RESPONSES  (all 3 participants × all 5 questions = 15 responses)
  // ──────────────────────────────────────────────────────────────────────

  // --- Q1 Responses (Single-select MCQ) ---
  const q1Correct = q1.options.find((o) => o.isCorrect);
  const q1Wrong = q1.options.find((o) => o.text === "let");

  // Alice: correct
  await prisma.response.create({
    data: {
      sessionId: session.id,
      questionId: q1.id,
      participantId: participants[0].id,
      responseData: { optionIds: [q1Correct.id] },
      responseTimeMs: 4200,
      isCorrect: true,
      pointsEarned: 100,
      selectedOptions: { create: [{ optionId: q1Correct.id }] },
    },
  });

  // Bob: wrong
  await prisma.response.create({
    data: {
      sessionId: session.id,
      questionId: q1.id,
      participantId: participants[1].id,
      responseData: { optionIds: [q1Wrong.id] },
      responseTimeMs: 8100,
      isCorrect: false,
      pointsEarned: 0,
      selectedOptions: { create: [{ optionId: q1Wrong.id }] },
    },
  });

  // Charlie: correct
  await prisma.response.create({
    data: {
      sessionId: session.id,
      questionId: q1.id,
      participantId: participants[2].id,
      responseData: { optionIds: [q1Correct.id] },
      responseTimeMs: 6300,
      isCorrect: true,
      pointsEarned: 100,
      selectedOptions: { create: [{ optionId: q1Correct.id }] },
    },
  });
  console.log("✅ Q1 responses: Alice ✓, Bob ✗, Charlie ✓");

  // --- Q2 Responses (Multi-select MCQ) ---
  const q2Opt0 = q2.options.find((o) => o.text === "0");
  const q2OptEmpty = q2.options.find((o) => o.text === '""');
  const q2OptNull = q2.options.find((o) => o.text === "null");
  const q2OptFalseStr = q2.options.find((o) => o.text === '"false"');

  // Alice: all 3 correct
  await prisma.response.create({
    data: {
      sessionId: session.id,
      questionId: q2.id,
      participantId: participants[0].id,
      responseData: { optionIds: [q2Opt0.id, q2OptEmpty.id, q2OptNull.id] },
      responseTimeMs: 12400,
      isCorrect: true,
      pointsEarned: 150,
      selectedOptions: {
        create: [
          { optionId: q2Opt0.id },
          { optionId: q2OptEmpty.id },
          { optionId: q2OptNull.id },
        ],
      },
    },
  });

  // Bob: 2 correct + 1 wrong = incorrect
  await prisma.response.create({
    data: {
      sessionId: session.id,
      questionId: q2.id,
      participantId: participants[1].id,
      responseData: { optionIds: [q2Opt0.id, q2OptNull.id, q2OptFalseStr.id] },
      responseTimeMs: 15600,
      isCorrect: false,
      pointsEarned: 0,
      selectedOptions: {
        create: [
          { optionId: q2Opt0.id },
          { optionId: q2OptNull.id },
          { optionId: q2OptFalseStr.id },
        ],
      },
    },
  });

  // Charlie: all 3 correct
  await prisma.response.create({
    data: {
      sessionId: session.id,
      questionId: q2.id,
      participantId: participants[2].id,
      responseData: { optionIds: [q2Opt0.id, q2OptEmpty.id, q2OptNull.id] },
      responseTimeMs: 11800,
      isCorrect: true,
      pointsEarned: 150,
      selectedOptions: {
        create: [
          { optionId: q2Opt0.id },
          { optionId: q2OptEmpty.id },
          { optionId: q2OptNull.id },
        ],
      },
    },
  });
  console.log("✅ Q2 responses: Alice ✓, Bob ✗, Charlie ✓");

  // --- Q3 Responses (True/False) ---
  const q3Correct = q3.options.find((o) => o.isCorrect);
  const q3Wrong = q3.options.find((o) => !o.isCorrect);

  // Alice: correct
  await prisma.response.create({
    data: {
      sessionId: session.id,
      questionId: q3.id,
      participantId: participants[0].id,
      responseData: { optionIds: [q3Correct.id] },
      responseTimeMs: 3100,
      isCorrect: true,
      pointsEarned: 50,
      selectedOptions: { create: [{ optionId: q3Correct.id }] },
    },
  });

  // Bob: correct
  await prisma.response.create({
    data: {
      sessionId: session.id,
      questionId: q3.id,
      participantId: participants[1].id,
      responseData: { optionIds: [q3Correct.id] },
      responseTimeMs: 5200,
      isCorrect: true,
      pointsEarned: 50,
      selectedOptions: { create: [{ optionId: q3Correct.id }] },
    },
  });

  // Charlie: wrong
  await prisma.response.create({
    data: {
      sessionId: session.id,
      questionId: q3.id,
      participantId: participants[2].id,
      responseData: { optionIds: [q3Wrong.id] },
      responseTimeMs: 2800,
      isCorrect: false,
      pointsEarned: 0,
      selectedOptions: { create: [{ optionId: q3Wrong.id }] },
    },
  });
  console.log("✅ Q3 responses: Alice ✓, Bob ✓, Charlie ✗");

  // --- Q4 Responses (Rating Scale — no scoring) ---
  await Promise.all([
    prisma.response.create({
      data: {
        sessionId: session.id,
        questionId: q4.id,
        participantId: participants[0].id,
        responseData: { rating: 8 },
        responseTimeMs: 2000,
        isCorrect: false,
        pointsEarned: 0,
      },
    }),
    prisma.response.create({
      data: {
        sessionId: session.id,
        questionId: q4.id,
        participantId: participants[1].id,
        responseData: { rating: 5 },
        responseTimeMs: 3500,
        isCorrect: false,
        pointsEarned: 0,
      },
    }),
    prisma.response.create({
      data: {
        sessionId: session.id,
        questionId: q4.id,
        participantId: participants[2].id,
        responseData: { rating: 7 },
        responseTimeMs: 1800,
        isCorrect: false,
        pointsEarned: 0,
      },
    }),
  ]);
  console.log("✅ Q4 responses: Alice→8, Bob→5, Charlie→7");

  // --- Q5 Responses (Open-Ended) ---
  await Promise.all([
    prisma.response.create({
      data: {
        sessionId: session.id,
        questionId: q5.id,
        participantId: participants[0].id,
        responseData: {
          text: "== checks value with type coercion, === checks both value and type without coercion.",
        },
        responseTimeMs: 25000,
        isCorrect: true,
        pointsEarned: 200,
      },
    }),
    prisma.response.create({
      data: {
        sessionId: session.id,
        questionId: q5.id,
        participantId: participants[1].id,
        responseData: {
          text: "=== is strict comparison and == is loose comparison.",
        },
        responseTimeMs: 18000,
        isCorrect: true,
        pointsEarned: 200,
      },
    }),
    prisma.response.create({
      data: {
        sessionId: session.id,
        questionId: q5.id,
        participantId: participants[2].id,
        responseData: {
          text: "They are both for comparing but === also checks the type.",
        },
        responseTimeMs: 22000,
        isCorrect: true,
        pointsEarned: 200,
      },
    }),
  ]);
  console.log("✅ Q5 responses: All answered (open-ended)\n");

  // ──────────────────────────────────────────────────────────────────────
  // 6. QUESTION RESULTS  (aggregated analytics per question)
  // ──────────────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.questionResult.create({
      data: {
        sessionId: session.id,
        questionId: q1.id,
        totalResponses: 3,
        correctResponses: 2,
        correctionRate: 66.67,
        averageResponseTimeMs: 6200,
        resultData: {
          [q1.options[0].id]: 0,
          [q1.options[1].id]: 1,
          [q1.options[2].id]: 2,
          [q1.options[3].id]: 0,
        },
      },
    }),
    prisma.questionResult.create({
      data: {
        sessionId: session.id,
        questionId: q2.id,
        totalResponses: 3,
        correctResponses: 2,
        correctionRate: 66.67,
        averageResponseTimeMs: 13267,
        resultData: {
          [q2.options[0].id]: 3,
          [q2.options[1].id]: 2,
          [q2.options[2].id]: 3,
          [q2.options[3].id]: 1,
          [q2.options[4].id]: 0,
        },
      },
    }),
    prisma.questionResult.create({
      data: {
        sessionId: session.id,
        questionId: q3.id,
        totalResponses: 3,
        correctResponses: 2,
        correctionRate: 66.67,
        averageResponseTimeMs: 3700,
        resultData: {
          [q3.options[0].id]: 1,
          [q3.options[1].id]: 2,
        },
      },
    }),
    prisma.questionResult.create({
      data: {
        sessionId: session.id,
        questionId: q4.id,
        totalResponses: 3,
        correctResponses: 0,
        correctionRate: 0,
        averageResponseTimeMs: 2433,
        resultData: { "8": 1, "5": 1, "7": 1, average: 6.67 },
      },
    }),
    prisma.questionResult.create({
      data: {
        sessionId: session.id,
        questionId: q5.id,
        totalResponses: 3,
        correctResponses: 3,
        correctionRate: 100,
        averageResponseTimeMs: 21667,
        resultData: { answers: 3 },
      },
    }),
  ]);
  console.log("✅ Question results aggregated for all 5 questions");

  // ──────────────────────────────────────────────────────────────────────
  // DONE
  // ──────────────────────────────────────────────────────────────────────
  console.log("\n🎉 Seed complete! Summary:");
  console.log("   👤 Users: 1 creator + 3 participants");
  console.log("   📋 Quiz: 1 quiz with 5 questions (all 5 types)");
  console.log("   🎮 Session: 1 completed session (code: 98765432)");
  console.log("   📊 Responses: 15 total (3 participants × 5 questions)");
  console.log("   📈 QuestionResults: 5 aggregated results");
  console.log(
    "   🏆 Leaderboard: Alice #1 (350pts), Charlie #2 (300pts), Bob #3 (250pts)"
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
import { prisma } from "@repo/db";
import { seedComputerNetworksQuiz } from "./lib/seedComputerNetworksQuiz.js";

// ── Helpers ─────────────────────────────────────────────────────────────────
function addMinutes(date, mins) {
  return new Date(date.getTime() + mins * 60 * 1000);
}
function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log("[WS] Seeding real-time session data...\n");

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
  console.log("Cleaned existing data\n");

  const now = new Date();

  // ──────────────────────────────────────────────────────────────────────
  // 1. USERS  (1 host + 5 participants — simulates a real classroom)
  // ──────────────────────────────────────────────────────────────────────
  const host = await prisma.user.create({
    data: {
      email: "professor@university.edu",
      passwordHash: "$2b$10$fakehashforprofessor1234567890ab",
      name: "Prof. Davis",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=PD",
      role: "USER",
    },
  });
  console.log(`Host: ${host.name} (${host.email})`);

  const participantData = [
    { email: "emma@student.edu", name: "Emma", seed: "E" },
    { email: "liam@student.edu", name: "Liam", seed: "L" },
    { email: "sophia@student.edu", name: "Sophia", seed: "S" },
    { email: "noah@student.edu", name: "Noah", seed: "N" },
    { email: "olivia@student.edu", name: "Olivia", seed: "O" },
  ];

  const participants = await Promise.all(
    participantData.map((p) =>
      prisma.user.create({
        data: {
          email: p.email,
          passwordHash: `$2b$10$fakehashfor${p.name.toLowerCase()}1234567890`,
          name: p.name,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${p.seed}`,
        },
      })
    )
  );
  console.log(
    `Participants: ${participants.map((p) => p.name).join(", ")}\n`
  );

  // ──────────────────────────────────────────────────────────────────────
  // 2. QUIZ  (Web Development Pop Quiz — 4 questions)
  //    Only 4 questions so we can simulate being mid-quiz at Q2
  // ──────────────────────────────────────────────────────────────────────
  const quiz = await prisma.quiz.create({
    data: {
      title: "Web Development Pop Quiz",
      description:
        "Quick-fire questions on HTML, CSS, and JavaScript fundamentals.",
      creatorId: host.id,
      isAIGenerated: false,
      enableAdaptiveDifficulty: false,
      expiresAt: addDays(now, 1),
    },
  });
  console.log(`Quiz: "${quiz.title}"`);

  // ── Q1: Single-select MCQ ────────────────────────────────────────────
  const q1 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      questionType: "MULTIPLE_CHOICE_SINGLE",
      text: "What does HTML stand for?",
      order: 0,
      difficulty: 1,
      hasTimeLimit: true,
      timeLimitSeconds: 15,
      points: 100,
      options: {
        create: [
          { text: "Hyper Text Markup Language", isCorrect: true, order: 0 },
          { text: "High Tech Modern Language", isCorrect: false, order: 1 },
          { text: "Hyper Transfer Markup Language", isCorrect: false, order: 2 },
          { text: "Home Tool Markup Language", isCorrect: false, order: 3 },
        ],
      },
    },
    include: { options: true },
  });
  console.log(`   Q1 [MCQ-Single] "${q1.text}"`);

  // ── Q2: True/False (CURRENT — session is on this question) ───────────
  const q2 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      questionType: "TRUE_FALSE",
      text: "CSS Grid and Flexbox can be used together in the same layout.",
      order: 1,
      difficulty: 3,
      hasTimeLimit: true,
      timeLimitSeconds: 10,
      points: 75,
      options: {
        create: [
          { text: "True", isCorrect: true, order: 0 },
          { text: "False", isCorrect: false, order: 1 },
        ],
      },
    },
    include: { options: true },
  });
  console.log(`   Q2 [True/False] "${q2.text}" <- LIVE NOW`);

  // ── Q3: Multi-select MCQ (upcoming) ──────────────────────────────────
  const q3 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      questionType: "MULTIPLE_CHOICE_MULTI",
      text: "Which of the following are valid JavaScript data types? (select all)",
      order: 2,
      difficulty: 4,
      hasTimeLimit: true,
      timeLimitSeconds: 20,
      points: 150,
      options: {
        create: [
          { text: "String", isCorrect: true, order: 0 },
          { text: "Boolean", isCorrect: true, order: 1 },
          { text: "Character", isCorrect: false, order: 2 },
          { text: "Symbol", isCorrect: true, order: 3 },
          { text: "Float", isCorrect: false, order: 4 },
        ],
      },
    },
    include: { options: true },
  });
  console.log(`   Q3 [MCQ-Multi]  "${q3.text}" (upcoming)`);

  // ── Q4: Open-Ended (upcoming) ────────────────────────────────────────
  const q4 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      questionType: "OPEN_ENDED",
      text: "Explain what the DOM is and why it matters for web development.",
      order: 3,
      difficulty: 6,
      hasTimeLimit: false,
      points: 200,
    },
  });
  console.log(`   Q4 [Open-Ended] "${q4.text}" (upcoming)\n`);

  // ──────────────────────────────────────────────────────────────────────
  // 3. SESSION  (🔴 LIVE — currently on Q2)
  //    This is the core WS scenario: a session mid-flight
  // ──────────────────────────────────────────────────────────────────────
  const liveSession = await prisma.session.create({
    data: {
      quizId: quiz.id,
      hostId: host.id,
      joinCode: "55551234",
      status: "LIVE",
      currentQuestionId: q2.id,
      allowLateJoiners: true,
      allowRejoin: true,
      startedAt: addMinutes(now, -5), // started 5 min ago
      expiresAt: addDays(now, 1),
    },
  });
  console.log(
    `LIVE Session: ${liveSession.joinCode} (started ${5} min ago)`
  );

  // ── Session State: mid-quiz, accepting responses for Q2 ─────────────
  await prisma.sessionState.create({
    data: {
      sessionId: liveSession.id,
      currentQuestionIndex: 1, // Q2 (0-indexed)
      questionStartedAt: addMinutes(now, -1), // Q2 started 1 min ago
      isAcceptingResponses: true, // still accepting answers!
      participantCount: 4, // Olivia disconnected
    },
  });
  console.log("Session state: Q2 active, accepting responses");

  // ──────────────────────────────────────────────────────────────────────
  // 4. SESSION PARTICIPANTS
  //    - Emma, Liam, Sophia, Noah: active
  //    - Olivia: disconnected (isActive: false) — tests rejoin flow
  // ──────────────────────────────────────────────────────────────────────
  const sessionParticipants = await Promise.all(
    participants.map((p, i) =>
      prisma.sessionParticipant.create({
        data: {
          sessionId: liveSession.id,
          userId: p.id,
          joinedAt: addMinutes(now, -4 + i * 0.5), // staggered joins
          lastSeenAt: p.name === "Olivia" ? addMinutes(now, -3) : now,
          isActive: p.name !== "Olivia", // Olivia dropped off
          totalScore: [100, 100, 0, 100, 0][i], // scores after Q1
          rank: [1, 1, 4, 1, 4][i], // tied ranks after Q1
        },
      })
    )
  );
  console.log(
    `Participants: ${participants.map((p) => `${p.name}${p.name === "Olivia" ? " (disconnected)" : ""}`).join(", ")}`
  );

  // ──────────────────────────────────────────────────────────────────────
  // 5. Q1 RESPONSES  (completed — all 5 answered before Q2 started)
  // ──────────────────────────────────────────────────────────────────────
  const q1Correct = q1.options.find((o) => o.isCorrect); // "Hyper Text Markup Language"
  const q1Wrong1 = q1.options.find(
    (o) => o.text === "Hyper Transfer Markup Language"
  );
  const q1Wrong2 = q1.options.find(
    (o) => o.text === "High Tech Modern Language"
  );

  // Emma ✓, Liam ✓, Sophia ✗, Noah ✓, Olivia ✗
  const q1Answers = [
    { pIdx: 0, optionId: q1Correct.id, correct: true, time: 3200 },
    { pIdx: 1, optionId: q1Correct.id, correct: true, time: 5100 },
    { pIdx: 2, optionId: q1Wrong1.id, correct: false, time: 9800 },
    { pIdx: 3, optionId: q1Correct.id, correct: true, time: 7400 },
    { pIdx: 4, optionId: q1Wrong2.id, correct: false, time: 11200 },
  ];

  for (const ans of q1Answers) {
    await prisma.response.create({
      data: {
        sessionId: liveSession.id,
        questionId: q1.id,
        participantId: participants[ans.pIdx].id,
        responseData: { optionIds: [ans.optionId] },
        responseTimeMs: ans.time,
        isCorrect: ans.correct,
        pointsEarned: ans.correct ? 100 : 0,
        selectedOptions: { create: [{ optionId: ans.optionId }] },
      },
    });
  }
  console.log("Q1 responses: Emma ✓, Liam ✓, Sophia ✗, Noah ✓, Olivia ✗");

  // ── Q1 QuestionResult (already computed) ─────────────────────────────
  await prisma.questionResult.create({
    data: {
      sessionId: liveSession.id,
      questionId: q1.id,
      totalResponses: 5,
      correctResponses: 3,
      correctionRate: 60.0,
      averageResponseTimeMs: 7340,
      resultData: {
        [q1.options[0].id]: 3, // Correct
        [q1.options[1].id]: 1, // High Tech
        [q1.options[2].id]: 1, // Hyper Transfer
        [q1.options[3].id]: 0, // Home Tool
      },
    },
  });
  console.log("Q1 results aggregated (60% correct)");

  // ──────────────────────────────────────────────────────────────────────
  // 6. Q2 RESPONSES  (🔴 IN PROGRESS — partial responses)
  //    - Emma & Liam have answered
  //    - Sophia & Noah haven't answered yet (still thinking)
  //    - Olivia disconnected (no response)
  //    This is the key WS test scenario: live partial state
  // ──────────────────────────────────────────────────────────────────────
  const q2True = q2.options.find((o) => o.text === "True");
  const q2False = q2.options.find((o) => o.text === "False");

  // Emma: answered True ✓ (fast!)
  await prisma.response.create({
    data: {
      sessionId: liveSession.id,
      questionId: q2.id,
      participantId: participants[0].id,
      responseData: { optionIds: [q2True.id] },
      responseTimeMs: 2800,
      isCorrect: true,
      pointsEarned: 75,
      selectedOptions: { create: [{ optionId: q2True.id }] },
    },
  });

  // Liam: answered False ✗
  await prisma.response.create({
    data: {
      sessionId: liveSession.id,
      questionId: q2.id,
      participantId: participants[1].id,
      responseData: { optionIds: [q2False.id] },
      responseTimeMs: 6500,
      isCorrect: false,
      pointsEarned: 0,
      selectedOptions: { create: [{ optionId: q2False.id }] },
    },
  });

  console.log(
    "Q2 responses: Emma correct, Liam wrong | Sophia pending, Noah pending, Olivia disconnected\n"
  );

  // ──────────────────────────────────────────────────────────────────────
  // 7. SECOND SESSION  (WAITING_ROOM — for testing join flow)
  //    No responses yet, participants are waiting for it to start
  // ──────────────────────────────────────────────────────────────────────
  const waitingQuiz = await prisma.quiz.create({
    data: {
      title: "Database Concepts Quiz",
      description: "Test your knowledge of SQL, NoSQL, and ORMs.",
      creatorId: host.id,
      isAIGenerated: true,
      aiPrompt: "Generate a quiz about database concepts for beginners.",
      enableAdaptiveDifficulty: true,
      expiresAt: addDays(now, 3),
    },
  });

  const wq1 = await prisma.question.create({
    data: {
      quizId: waitingQuiz.id,
      questionType: "MULTIPLE_CHOICE_SINGLE",
      text: "Which of the following is a NoSQL database?",
      order: 0,
      difficulty: 2,
      hasTimeLimit: true,
      timeLimitSeconds: 15,
      points: 100,
      options: {
        create: [
          { text: "PostgreSQL", isCorrect: false, order: 0 },
          { text: "MongoDB", isCorrect: true, order: 1 },
          { text: "MySQL", isCorrect: false, order: 2 },
          { text: "SQLite", isCorrect: false, order: 3 },
        ],
      },
    },
  });

  await prisma.question.create({
    data: {
      quizId: waitingQuiz.id,
      questionType: "TRUE_FALSE",
      text: "An ORM maps database tables to objects in code.",
      order: 1,
      difficulty: 2,
      hasTimeLimit: true,
      timeLimitSeconds: 10,
      points: 75,
      options: {
        create: [
          { text: "True", isCorrect: true, order: 0 },
          { text: "False", isCorrect: false, order: 1 },
        ],
      },
    },
  });

  await prisma.question.create({
    data: {
      quizId: waitingQuiz.id,
      questionType: "RATING_SCALE",
      text: "How comfortable are you writing raw SQL queries? (1-10)",
      order: 2,
      difficulty: 1,
      hasTimeLimit: false,
      points: 0,
    },
  });

  const waitingSession = await prisma.session.create({
    data: {
      quizId: waitingQuiz.id,
      hostId: host.id,
      joinCode: "77778888",
      status: "WAITING_ROOM",
      currentQuestionId: wq1.id,
      allowLateJoiners: true,
      allowRejoin: true,
      expiresAt: addDays(now, 3),
    },
  });
  console.log(
    `Waiting Session: "${waitingQuiz.title}" (code: ${waitingSession.joinCode})`
  );

  await prisma.sessionState.create({
    data: {
      sessionId: waitingSession.id,
      currentQuestionIndex: 0,
      isAcceptingResponses: false,
      participantCount: 2,
    },
  });

  // Only Emma & Liam joined the waiting room so far
  await Promise.all(
    [participants[0], participants[1]].map((p) =>
      prisma.sessionParticipant.create({
        data: {
          sessionId: waitingSession.id,
          userId: p.id,
          isActive: true,
          totalScore: 0,
        },
      })
    )
  );
  console.log("Waiting room: Emma & Liam joined, waiting for host to start");

  // ──────────────────────────────────────────────────────────────────────
  // 8. THIRD SESSION  (DRAFT — not started yet, tests session lifecycle)
  // ──────────────────────────────────────────────────────────────────────
  const draftQuiz = await prisma.quiz.create({
    data: {
      title: "Advanced React Patterns",
      description:
        "Compound components, render props, and custom hooks deep dive.",
      creatorId: host.id,
      isAIGenerated: false,
      enableAdaptiveDifficulty: false,
      expiresAt: addDays(now, 7),
    },
  });

  await prisma.question.create({
    data: {
      quizId: draftQuiz.id,
      questionType: "MULTIPLE_CHOICE_SINGLE",
      text: "Which hook is used for side effects in React?",
      order: 0,
      difficulty: 3,
      hasTimeLimit: true,
      timeLimitSeconds: 15,
      points: 100,
      options: {
        create: [
          { text: "useState", isCorrect: false, order: 0 },
          { text: "useEffect", isCorrect: true, order: 1 },
          { text: "useMemo", isCorrect: false, order: 2 },
          { text: "useRef", isCorrect: false, order: 3 },
        ],
      },
    },
  });

  await prisma.question.create({
    data: {
      quizId: draftQuiz.id,
      questionType: "OPEN_ENDED",
      text: "Describe a use case where you'd prefer render props over custom hooks.",
      order: 1,
      difficulty: 8,
      hasTimeLimit: false,
      points: 250,
    },
  });

  const draftSession = await prisma.session.create({
    data: {
      quizId: draftQuiz.id,
      hostId: host.id,
      joinCode: "11112222",
      status: "DRAFT",
      allowLateJoiners: true,
      allowRejoin: false,
      expiresAt: addDays(now, 7),
    },
  });
  console.log(
    `Draft Session: "${draftQuiz.title}" (code: ${draftSession.joinCode})\n`
  );

  // ──────────────────────────────────────────────────────────────────────
  // 9. ADVANCED COMPUTER NETWORKS (15 questions — professor / host)
  // ──────────────────────────────────────────────────────────────────────
  const { quiz: cnQuiz, session: cnSession } = await seedComputerNetworksQuiz(host.id, now);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────────────────────────────────
  console.log("[WS] Seed complete! Summary:");
  console.log("   Users: 1 host + 5 participants");
  console.log("   Quizzes: 4 (Web Dev, Databases, React, Computer Networks)");
  console.log("");
  console.log("   LIVE session (55551234):");
  console.log("      • Currently on Q2/4 — accepting responses");
  console.log("      • 4 active + 1 disconnected (Olivia)");
  console.log("      • Q1 completed (5/5 answered, 60% correct)");
  console.log("      • Q2 in-progress (2/5 answered so far)");
  console.log("      • Q3, Q4 upcoming");
  console.log("");
  console.log("   WAITING_ROOM session (77778888):");
  console.log("      • 2 participants waiting (Emma, Liam)");
  console.log("      • 3 questions ready, host hasn't started");
  console.log("");
  console.log("   DRAFT session (11112222):");
  console.log("      • 2 questions prepared, not published yet");
  console.log("");
  console.log(`   COMPUTER NETWORKS session (${cnSession.joinCode}):`);
  console.log(`      • "${cnQuiz.title}" — 15 graduate-level questions`);
  console.log("      • WAITING_ROOM — host: professor@university.edu / password123");
  console.log("");
  console.log("   WS test scenarios covered:");
  console.log("      ✓ Live question with partial responses");
  console.log("      ✓ Disconnected participant (rejoin flow)");
  console.log("      ✓ Waiting room (join + start flow)");
  console.log("      ✓ Draft session (lifecycle: DRAFT → WAITING → LIVE)");
  console.log("      ✓ Late joiner support");
  console.log("      ✓ Staggered join times");
}

main()
  .catch((e) => {
    console.error("[WS] Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

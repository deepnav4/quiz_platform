apps/
  http-backend/
    index.js                  ← Express app, mounts all routes
    seed.js
    package.json
    config/
      index.js                ← PORT, JWT_SECRET, AI/OCR keys
    middlewares/
      auth.js                 ← JWT verify middleware
      validate.js             ← Input validation
      errorHandler.js         ← Global error handler
    routes/
      auth.js                 ← POST /signup, /login, GET /me
      quiz.js                 ← CRUD /api/quizzes
      question.js             ← CRUD /api/quizzes/:quizId/questions
      session.js              ← /api/sessions (create, join, start, end)
      result.js               ← /api/results (leaderboard, question breakdown)
    controllers/
      auth.js                 ← signup(), login(), getMe()
      quiz.js                 ← createQuiz(), getMyQuizzes(), getQuiz(), updateQuiz(), deleteQuiz()
      question.js             ← addQuestion(), updateQuestion(), deleteQuestion(), reorderQuestions()
      session.js              ← createSession(), joinSession(), startSession(), endSession()
      result.js               ← getSessionResults(), getLeaderboard(), getQuestionResult()
    utils/
      ai.js                   ← generateQuizFromPrompt(), generateQuestionsFromTopic()
      ocr.js                  ← extractQuestionsFromImage()
      adaptive.js             ← pickNextQuestion(), adjustDifficulty()
      scoring.js              ← calculatePoints(), calculateLeaderboard()
      joinCode.js             ← generateJoinCode()
      token.js                ← signToken(), verifyToken()

  ws-backend/
    index.js                  ← WebSocket server, routes messages to handlers
    seed.js
    package.json
    config/
      index.js                ← WS_PORT, JWT_SECRET
    handlers/
      connection.js           ← handleConnection(), handleDisconnect()
      session.js              ← handleJoinSession(), handleLeaveSession()
      question.js             ← handleNextQuestion(), handleSubmitResponse()
      host.js                 ← handleStartQuiz(), handlePauseQuiz(), handleResumeQuiz(), handleEndQuiz()
      leaderboard.js          ← handleBroadcastLeaderboard(), handleBroadcastQuestionResult()
    utils/
      auth.js                 ← verifyWsToken()
      rooms.js                ← addToRoom(), removeFromRoom(), getRoom()
      broadcast.js            ← broadcastToRoom(), sendToOne(), broadcastToRoomExcept()
      timer.js                ← startTimer(), stopTimer(), getRemainingTime()
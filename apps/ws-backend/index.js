import { WebSocketServer } from "ws";
import { config } from "./config/index.js";
import { handleConnection, handleDisconnect } from "./handlers/connection.js";
import { handleJoinSession, handleLeaveSession } from "./handlers/session.js";
import { handleNextQuestion, handleSubmitResponse } from "./handlers/question.js";
import { handleStartQuiz, handlePauseQuiz, handleResumeQuiz, handleEndQuiz } from "./handlers/host.js";
import { handleBroadcastLeaderboard, handleBroadcastQuestionResult } from "./handlers/leaderboard.js";

const wss = new WebSocketServer({ port: config.port });

wss.on("connection", (ws, req) => {
  handleConnection(ws, req);

  ws.on("message", (raw) => {
    const message = JSON.parse(raw);

    // Route messages to handlers based on type
    const handlers = {
      join_session: handleJoinSession,
      leave_session: handleLeaveSession,
      next_question: handleNextQuestion,
      submit_response: handleSubmitResponse,
      start_quiz: handleStartQuiz,
      pause_quiz: handlePauseQuiz,
      resume_quiz: handleResumeQuiz,
      end_quiz: handleEndQuiz,
      get_leaderboard: handleBroadcastLeaderboard,
      get_question_result: handleBroadcastQuestionResult,
    };

    const handler = handlers[message.type];
    if (handler) {
      handler(ws, message.data);
    }
  });

  ws.on("close", () => {
    handleDisconnect(ws);
  });
});

console.log(`WebSocket server is running on port ${config.port}`);

import { WebSocketServer } from "ws";
import { config } from "./config/index.js";
import { handleConnection, handleDisconnect } from "./handlers/connection.js";
import { handleJoinSession, handleLeaveSession } from "./handlers/session.js";
import { handleNextQuestion, handleSubmitResponse, handleRevealAnswers } from "./handlers/question.js";
import { handleStartQuiz, handlePauseQuiz, handleResumeQuiz, handleEndQuiz } from "./handlers/host.js";
import { handleBroadcastLeaderboard, handleBroadcastQuestionResult } from "./handlers/leaderboard.js";

const wss = new WebSocketServer({ port: config.port });

wss.on("connection", (ws, req) => {
  handleConnection(ws, req);

  ws.on("message", async (raw) => {
    let message;
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }

    const handlers = {
      join_session: handleJoinSession,
      leave_session: handleLeaveSession,
      next_question: handleNextQuestion,
      submit_response: handleSubmitResponse,
      reveal_answers: handleRevealAnswers,
      start_quiz: handleStartQuiz,
      pause_quiz: handlePauseQuiz,
      resume_quiz: handleResumeQuiz,
      end_quiz: handleEndQuiz,
      get_leaderboard: handleBroadcastLeaderboard,
      get_question_result: handleBroadcastQuestionResult,
    };

    const handler = handlers[message.type];
    if (handler) {
      try {
        await handler(ws, message.data);
      } catch (err) {
        console.error(`Handler error (${message.type}):`, err);
      }
    }
  });

  ws.on("close", () => {
    handleDisconnect(ws);
  });
});

console.log(`WebSocket server is running on port ${config.port}`);

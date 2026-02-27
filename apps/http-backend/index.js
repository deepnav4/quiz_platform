import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";

import authRoutes from "./routes/auth.js";
import quizRoutes from "./routes/quiz.js";
import questionRoutes from "./routes/question.js";
import sessionRoutes from "./routes/session.js";
import resultRoutes from "./routes/result.js";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/quizzes", questionRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/results", resultRoutes);

// Error handler (must be last)
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
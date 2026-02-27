import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.WS_PORT || 8080,
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
};

import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  aiApiKey: process.env.AI_API_KEY || "",
  ocrApiKey: process.env.OCR_API_KEY || "",
};

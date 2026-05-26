import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

export function verifyWsToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (err) {
    return null;
  }
}

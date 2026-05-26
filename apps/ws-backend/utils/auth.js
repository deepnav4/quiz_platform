import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

/**
 * Verify a JWT token from the WebSocket connection query parameter.
 * @param {string} token - The JWT token to verify.
 * @returns {{ id: string, email: string, name: string } | null} The decoded user data, or null if invalid.
 */
export function verifyWsToken(token) {
  try {
    if (!token) return null;
    const decoded = jwt.verify(token, config.jwtSecret);
    return {
      id: decoded.id || decoded.sub,
      email: decoded.email,
      name: decoded.name,
    };
  } catch (err) {
    return null;
  }
}

import { verifyToken } from "../utils/token.js";

export function authMiddleware(req, res, next) {
  // TODO: extract token from Authorization header, verify, attach req.user
}

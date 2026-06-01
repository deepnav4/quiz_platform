import jwt from "jsonwebtoken";
import { getJwtSecrets } from "../config/index.js";

function tryVerify(token, secret) {
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

/** Normalize JWT payload / mock user to { id, email, name }. */
export function normalizeWsUser(payload) {
  if (!payload || typeof payload !== "object") return null;

  const id = payload.id ?? payload.sub ?? payload.userId;
  if (!id) return null;

  return {
    id: String(id),
    email: payload.email ?? "",
    name: payload.name ?? payload.email ?? "User",
  };
}

export function verifyWsToken(token) {
  if (!token) return null;

  // Dev mock tokens (AuthContext offline mode)
  if (
    typeof token === "string" &&
    token.startsWith("mock-token-") &&
    process.env.NODE_ENV !== "production"
  ) {
    return normalizeWsUser({
      id: "1",
      email: "demo@quizora.com",
      name: "Demo User",
    });
  }

  const secrets = getJwtSecrets();
  for (const secret of secrets) {
    const verified = tryVerify(token, secret);
    if (verified) {
      const user = normalizeWsUser(verified);
      if (user) return user;
    }
  }

  try {
    const decoded = jwt.decode(token);
    if (decoded) {
      console.warn(
        "[ws-auth] JWT verify failed for all secrets. id:",
        decoded.id ?? decoded.sub,
        "secrets tried:",
        secrets.length
      );
    }
  } catch {
    /* ignore */
  }

  return null;
}

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wsEnvPath = path.resolve(__dirname, "../.env");
const httpEnvPath = path.resolve(__dirname, "../../http-backend/.env");

// Load ws-backend first, then http-backend (http values only fill gaps)
dotenv.config({ path: wsEnvPath });
dotenv.config({ path: httpEnvPath });

const DEFAULT_JWT_SECRET = "quizora-dev-secret-key-2024";

/** Collect every JWT secret we should try (deduped, non-empty). */
export function getJwtSecrets() {
  const secrets = new Set();

  const add = (value) => {
    if (value && typeof value === "string" && value.trim()) {
      secrets.add(value.trim());
    }
  };

  add(process.env.JWT_SECRET);

  // Also parse JWT_SECRET directly from env files (handles mismatched copies)
  for (const envPath of [wsEnvPath, httpEnvPath]) {
    try {
      if (!fs.existsSync(envPath)) continue;
      const content = fs.readFileSync(envPath, "utf8");
      const m = content.match(/^\s*JWT_SECRET\s*=\s*(.+)\s*$/m);
      if (m?.[1]) {
        let secret = m[1].trim();
        if (
          (secret.startsWith('"') && secret.endsWith('"')) ||
          (secret.startsWith("'") && secret.endsWith("'"))
        ) {
          secret = secret.slice(1, -1);
        }
        add(secret);
      }
    } catch {
      /* ignore read errors */
    }
  }

  add(DEFAULT_JWT_SECRET);

  return [...secrets];
}

export const config = {
  port: process.env.WS_PORT || 8080,
  jwtSecrets: getJwtSecrets(),
  /** Primary secret — first in the list (used for logging only). */
  jwtSecret: getJwtSecrets()[0] || DEFAULT_JWT_SECRET,
};

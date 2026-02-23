import { PrismaClient } from "./generated/prisma/index.js";

// Singleton pattern: reuse the same PrismaClient instance across the app.
// In development, hot-reloads would create many connections without this.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

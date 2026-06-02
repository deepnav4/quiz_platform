/**
 * One-off: remove host users wrongly stored as session participants.
 * Run: npm run purge:host-participants --workspace=ws-backend
 */
import { prisma } from "@repo/db";

const sessions = await prisma.session.findMany({
  select: { id: true, hostId: true },
});

let removed = 0;
for (const s of sessions) {
  const result = await prisma.sessionParticipant.deleteMany({
    where: { sessionId: s.id, userId: s.hostId },
  });
  removed += result.count;
}

console.log(`Removed ${removed} host-as-participant row(s) across ${sessions.length} session(s).`);
await prisma.$disconnect();

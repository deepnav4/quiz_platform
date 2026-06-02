import prisma from "@repo/db";

/** True when userId is the session host (not a quiz participant). */
export function isSessionHost(session, userId) {
  if (!session?.hostId || !userId) return false;
  return String(session.hostId) === String(userId);
}

export async function countActiveParticipants(sessionId, hostId) {
  return prisma.sessionParticipant.count({
    where: {
      sessionId,
      isActive: true,
      userId: hostId ? { not: hostId } : undefined,
    },
  });
}

/** Remove host from participant table and sync participantCount (host is never a player). */
export async function purgeHostParticipant(sessionId, hostId) {
  if (!sessionId || !hostId) return 0;

  await prisma.sessionParticipant.deleteMany({
    where: { sessionId, userId: hostId },
  });

  const count = await countActiveParticipants(sessionId, hostId);

  try {
    await prisma.sessionState.update({
      where: { sessionId },
      data: { participantCount: count },
    });
  } catch {
    /* sessionState may not exist yet */
  }

  return count;
}

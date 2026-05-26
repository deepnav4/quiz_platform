import { addToRoom, removeFromRoom } from "../utils/rooms.js";
import { broadcastToRoom, sendToOne } from "../utils/broadcast.js";
import prisma from "@repo/db";

export async function handleJoinSession(ws, data) {
  try {
    if (!ws.user) return sendToOne(ws, { type: "error", data: { message: "Not authenticated" } });
    const { sessionId } = data;
    if (!sessionId) return sendToOne(ws, { type: "error", data: { message: "sessionId required" } });

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return sendToOne(ws, { type: "error", data: { message: "Session not found" } });

    if (!["WAITING_ROOM", "LIVE"].includes(session.status)) {
      return sendToOne(ws, { type: "error", data: { message: "Session not active" } });
    }

    // Upsert participant
    await prisma.sessionParticipant.upsert({
      where: { sessionId_userId: { sessionId, userId: ws.user.id } },
      create: { sessionId, userId: ws.user.id, isActive: true },
      update: { isActive: true, lastSeenAt: new Date() },
    });

    // Update participant count
    const count = await prisma.sessionParticipant.count({
      where: { sessionId, isActive: true },
    });
    await prisma.sessionState.update({
      where: { sessionId },
      data: { participantCount: count },
    });

    ws.sessionId = sessionId;
    addToRoom(sessionId, ws);

    // Notify everyone
    broadcastToRoom(sessionId, {
      type: "participant_joined",
      data: { userId: ws.user.id, name: ws.user.name, participantCount: count },
    });
  } catch (err) {
    console.error("Join session error:", err);
    sendToOne(ws, { type: "error", data: { message: "Failed to join session" } });
  }
}

export async function handleLeaveSession(ws, data) {
  try {
    const sessionId = data?.sessionId || ws.sessionId;
    if (!sessionId || !ws.user) return;

    removeFromRoom(sessionId, ws);

    await prisma.sessionParticipant.updateMany({
      where: { sessionId, userId: ws.user.id },
      data: { isActive: false, lastSeenAt: new Date() },
    });

    const count = await prisma.sessionParticipant.count({
      where: { sessionId, isActive: true },
    });
    await prisma.sessionState.update({
      where: { sessionId },
      data: { participantCount: count },
    });

    ws.sessionId = null;

    broadcastToRoom(sessionId, {
      type: "participant_left",
      data: { userId: ws.user.id, participantCount: count },
    });
  } catch (err) {
    console.error("Leave session error:", err);
  }
}

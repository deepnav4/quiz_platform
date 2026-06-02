import { addToRoom, removeFromRoom } from "../utils/rooms.js";
import { broadcastToRoom, sendToOne } from "../utils/broadcast.js";
import { isSessionHost, countActiveParticipants, purgeHostParticipant } from "../utils/sessionHelpers.js";
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

    ws.sessionId = sessionId;
    addToRoom(sessionId, ws);

    const asHost = isSessionHost(session, ws.user.id);

    if (asHost) {
      const participantCount = await purgeHostParticipant(sessionId, session.hostId);
      sendToOne(ws, {
        type: "session_joined",
        data: { sessionId, role: "host", hostId: session.hostId, participantCount },
      });
      return;
    }

    await prisma.sessionParticipant.upsert({
      where: { sessionId_userId: { sessionId, userId: ws.user.id } },
      create: { sessionId, userId: ws.user.id, isActive: true },
      update: { isActive: true, lastSeenAt: new Date() },
    });

    const count = await countActiveParticipants(sessionId, session.hostId);
    await prisma.sessionState.update({
      where: { sessionId },
      data: { participantCount: count },
    });

    broadcastToRoom(sessionId, {
      type: "participant_joined",
      data: {
        userId: ws.user.id,
        name: ws.user.name,
        participantCount: count,
        hostId: session.hostId,
      },
    });

    sendToOne(ws, {
      type: "session_joined",
      data: { sessionId, role: "participant", participantCount: count },
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

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    removeFromRoom(sessionId, ws);

    if (session && !isSessionHost(session, ws.user.id)) {
      await prisma.sessionParticipant.updateMany({
        where: { sessionId, userId: ws.user.id },
        data: { isActive: false, lastSeenAt: new Date() },
      });

      const count = await countActiveParticipants(sessionId, session.hostId);
      await prisma.sessionState.update({
        where: { sessionId },
        data: { participantCount: count },
      });

      broadcastToRoom(sessionId, {
        type: "participant_left",
        data: { userId: ws.user.id, participantCount: count, hostId: session.hostId },
      });
    }

    ws.sessionId = null;
  } catch (err) {
    console.error("Leave session error:", err);
  }
}

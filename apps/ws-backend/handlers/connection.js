import { verifyWsToken } from "../utils/auth.js";
import { removeFromRoom } from "../utils/rooms.js";
import { sendToOne } from "../utils/broadcast.js";
import prisma from "@repo/db";

export function handleConnection(ws, req) {
  try {
    const url = new URL(req.url, "http://localhost");
    const token = url.searchParams.get("token");
    const user = verifyWsToken(token);

    if (!user) {
      sendToOne(ws, { type: "error", data: { message: "Authentication failed" } });
      ws.close(4001, "Unauthorized");
      return;
    }

    ws.user = { id: user.id, email: user.email, name: user.name };
    ws.sessionId = null;

    sendToOne(ws, { type: "connected", data: { message: "Welcome", userId: user.id } });
  } catch (err) {
    console.error("Connection error:", err);
    ws.close(4000, "Connection error");
  }
}

export async function handleDisconnect(ws) {
  try {
    if (ws.sessionId) {
      removeFromRoom(ws.sessionId, ws);

      if (ws.user) {
        await prisma.sessionParticipant.updateMany({
          where: { sessionId: ws.sessionId, userId: ws.user.id },
          data: { isActive: false, lastSeenAt: new Date() },
        });
      }
    }
  } catch (err) {
    console.error("Disconnect error:", err);
  }
}

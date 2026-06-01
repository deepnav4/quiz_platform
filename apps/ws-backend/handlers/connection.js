import { verifyWsToken } from "../utils/auth.js";
import { removeFromRoom } from "../utils/rooms.js";
import { sendToOne } from "../utils/broadcast.js";
import prisma from "@repo/db";

export function handleConnection(ws, req) {
  try {
    const url = new URL(req.url, "http://localhost");
    const token = url.searchParams.get("token");
    const user = verifyWsToken(token);

    // Debug logging to help diagnose auth failures in dev
    try {
      const short = token ? String(token).slice(0, 16) + (String(token).length > 16 ? '...' : '') : '<no-token>';
      console.log(`[ws] incoming connection token=${short}`);
      console.log('[ws] verifyWsToken result:', user ? { id: user.id, email: user.email } : null);
    } catch (e) { /* ignore logging errors */ }

    if (!user) {
      console.warn('[ws] authentication failed for token prefix:', token ? String(token).slice(0,12) : '<none>');
      sendToOne(ws, { type: "error", data: { message: "Authentication failed" } });
      // include a reason when closing to help client debugging
      ws.close(4001, "Unauthorized: token verification failed");
      return;
    }

    ws.user = { id: String(user.id), email: user.email, name: user.name };
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

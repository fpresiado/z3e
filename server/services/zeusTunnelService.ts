import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { db } from "../db.js";
import { users, adminAuditLogs } from "@shared/schema.js";

interface ZeusTunnelMessage {
  type: "health" | "command" | "log" | "learning:sync" | "response";
  id: string;
  token: string;
  payload: any;
  timestamp: number;
}

interface SystemTokenPayload {
  systemId: string;
  name: string;
  type: "futuremainframe" | "mobile" | "admin";
  iat: number;
}

export class ZeusTunnelService {
  private io: SocketIOServer;
  private systemTokens = new Map<string, SystemTokenPayload>();
  private messageLog: ZeusTunnelMessage[] = [];
  private JWT_SECRET = process.env.JWT_SECRET || "zeus-tunnel-secret";

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      path: "/zeus-tunnel",
      cors: { origin: "*", methods: ["GET", "POST"] },
    });

    this.io.on("connection", (socket: Socket) => {
      console.log(`[TUNNEL] Client connected: ${socket.id}`);

      socket.on("authenticate", (data: { token: string }, callback) => {
        try {
          const decoded = jwt.verify(data.token, this.JWT_SECRET) as SystemTokenPayload;
          this.systemTokens.set(socket.id, decoded);
          console.log(`[TUNNEL] System authenticated: ${decoded.name} (${decoded.type})`);
          callback({ authenticated: true, systemId: decoded.systemId });
        } catch (error) {
          console.error(`[TUNNEL] Auth failed:`, error);
          callback({ authenticated: false, error: "Invalid token" });
        }
      });

      socket.on("message", async (msg: ZeusTunnelMessage, callback) => {
        try {
          const systemToken = this.systemTokens.get(socket.id);
          if (!systemToken) {
            return callback({ success: false, error: "Not authenticated" });
          }

          this.messageLog.push(msg);

          switch (msg.type) {
            case "health":
              return callback({ success: true, data: await this.handleHealthSync(systemToken, msg.payload) });
            case "command":
              return callback({ success: true, data: await this.handleCommand(systemToken, msg.payload) });
            case "log":
              return callback({ success: true, data: await this.handleLog(systemToken, msg.payload) });
            case "learning:sync":
              return callback({ success: true, data: await this.handleLearningSyncMessage(systemToken, msg.payload) });
            default:
              return callback({ success: false, error: "Unknown message type" });
          }
        } catch (error: any) {
          console.error(`[TUNNEL] Message error:`, error);
          callback({ success: false, error: error.message });
        }
      });

      socket.on("disconnect", () => {
        const systemToken = this.systemTokens.get(socket.id);
        if (systemToken) {
          console.log(`[TUNNEL] System disconnected: ${systemToken.name}`);
          this.systemTokens.delete(socket.id);
        }
      });
    });
  }

  generateSystemToken(systemId: string, name: string, type: "futuremainframe" | "mobile" | "admin"): string {
    const payload: SystemTokenPayload = {
      systemId,
      name,
      type,
      iat: Date.now(),
    };
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: "7d" });
  }

  private async handleHealthSync(token: SystemTokenPayload, payload: any) {
    console.log(`[TUNNEL] Health sync from ${token.name}:`, payload);
    return {
      status: "ok",
      timestamp: Date.now(),
      receivedAt: new Date().toISOString(),
    };
  }

  private async handleCommand(token: SystemTokenPayload, payload: any) {
    console.log(`[TUNNEL] Command from ${token.name}:`, payload.command);
    
    // Log admin action
    if (token.type === "admin") {
      await db.insert(adminAuditLogs).values({
        adminId: payload.userId || 1,
        action: payload.command,
        target: payload.target,
        targetType: payload.targetType || "system",
        details: payload,
      });
    }

    return { success: true, command: payload.command };
  }

  private async handleLog(token: SystemTokenPayload, payload: any) {
    console.log(`[TUNNEL] Log from ${token.name}:`, payload.message);
    return { received: true, timestamp: Date.now() };
  }

  private async handleLearningSyncMessage(token: SystemTokenPayload, payload: any) {
    console.log(`[TUNNEL] Learning sync from ${token.name}:`, payload);
    return { synced: true, timestamp: Date.now() };
  }

  getIO() {
    return this.io;
  }

  getMessageLog() {
    return this.messageLog;
  }
}

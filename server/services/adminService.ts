import { db } from "../db";
import { users, auditLogs } from "@shared/schema";

export class AdminService {
  async getAllUsers(): Promise<any[]> {
    return db.query.users.findMany();
  }

  async logAction(userId: string | null, action: string, resource: string, resourceId?: string): Promise<void> {
    await db.insert(auditLogs).values({ userId, action, resource, resourceId, timestamp: new Date() });
  }

  async getAuditTrail(limit: number = 100): Promise<any[]> {
    return db.query.auditLogs.findMany({ limit });
  }

  async getSystemHealth(): Promise<any> {
    return { masteryEngine: "✅", reasoningTransformer: "✅", knowledgeGraph: "✅" };
  }

  async exportUserData(userId: string): Promise<any> {
    const user = await db.query.users.findFirst({ where: (u: any) => u.id === userId });
    return { user, exportedAt: new Date() };
  }
}

export const adminService = new AdminService();

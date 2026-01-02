import { db } from "../db";
import { auditLogs } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export class AuditService {
  async log(
    action: string,
    resource: string,
    userId?: string,
    resourceId?: string,
    changes?: any,
    ipAddress?: string
  ): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        id: uuidv4(),
        action,
        resource,
        userId: userId || null,
        resourceId,
        changes: changes ? JSON.stringify(changes) : null,
        ipAddress,
        timestamp: new Date(),
      });
    } catch (e) {
      console.error("[Audit] Error logging:", e);
    }
  }

  async getLogs(limit: number = 100): Promise<any[]> {
    return db.select().from(auditLogs).limit(limit);
  }

  async getUserLogs(userId: string): Promise<any[]> {
    return db.select().from(auditLogs).where(eq(auditLogs.userId, userId));
  }

  async getLogsByResource(resource: string, resourceId: string): Promise<any[]> {
    return db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.resource, resource), eq(auditLogs.resourceId, resourceId)));
  }
}

export const auditService = new AuditService();

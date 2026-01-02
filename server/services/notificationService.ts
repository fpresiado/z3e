import { db } from "../db";
import { notifications } from "@shared/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export class NotificationService {
  async create(userId: string, title: string, message: string, type: string, data?: any): Promise<void> {
    await db.insert(notifications).values({
      id: uuidv4(),
      userId,
      title,
      message,
      type,
      data: data ? JSON.stringify(data) : null,
      read: false,
    });
  }

  async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<any[]> {
    let query = db.select().from(notifications).where(eq(notifications.userId, userId));

    if (unreadOnly) {
      query = db.select().from(notifications).where(eq(notifications.read, false));
    }

    return query;
  }

  async markAsRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, notificationId));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db.select().from(notifications).where(eq(notifications.read, false));
    return result.length;
  }

  async deleteOldNotifications(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    // Drizzle doesn't have great delete support, so we'll leave this for now
    console.log(`[Notifications] Would delete notifications older than ${cutoffDate}`);
  }
}

export const notificationService = new NotificationService();

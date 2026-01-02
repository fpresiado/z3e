import { db } from "../db";
import { learningStreaks, runs } from "@shared/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export class StreakService {
  async updateStreak(userId: string): Promise<void> {
    const [existing] = await db.select().from(learningStreaks).where(eq(learningStreaks.userId, userId));

    const now = new Date();
    const lastActivity = existing?.lastActivityAt ? new Date(existing.lastActivityAt) : null;
    const timeSinceLastActivity = lastActivity ? now.getTime() - lastActivity.getTime() : null;
    const daysSinceActivity = timeSinceLastActivity ? Math.floor(timeSinceLastActivity / (1000 * 60 * 60 * 24)) : null;

    let newStreak = 1;
    let streakStartedAt = now;

    if (existing && daysSinceActivity !== null) {
      if (daysSinceActivity === 0) {
        // Same day - maintain streak
        newStreak = existing.currentStreak;
        streakStartedAt = existing.streakStartedAt;
      } else if (daysSinceActivity === 1) {
        // Next day - increment streak
        newStreak = existing.currentStreak + 1;
        streakStartedAt = existing.streakStartedAt;
      } else {
        // Gap in days - reset streak
        newStreak = 1;
        streakStartedAt = now;
      }
    }

    if (existing) {
      await db
        .update(learningStreaks)
        .set({
          currentStreak: newStreak,
          longestStreak: Math.max(existing.longestStreak, newStreak),
          lastActivityAt: now,
          streakStartedAt,
          updatedAt: now,
        })
        .where(eq(learningStreaks.userId, userId));
    } else {
      await db.insert(learningStreaks).values({
        id: uuidv4(),
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityAt: now,
        streakStartedAt: now,
        updatedAt: now,
      });
    }
  }

  async getStreak(userId: string): Promise<any> {
    const [streak] = await db.select().from(learningStreaks).where(eq(learningStreaks.userId, userId));
    return streak || null;
  }

  async getTopStreaks(limit: number = 10): Promise<any[]> {
    return db.select().from(learningStreaks).orderBy((t) => t.currentStreak).limit(limit);
  }
}

export const streakService = new StreakService();

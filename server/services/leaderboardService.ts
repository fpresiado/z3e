import { db } from "../db";
import { userMastery, learningStreaks, users, curriculumAttempts, attemptHistory } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  masteryPercent: number;
  totalAttempts: number;
  successAttempts: number;
  currentStreak: number;
  achievementCount?: number;
}

export class LeaderboardService {
  async getGlobalLeaderboard(limit: number = 50, offset: number = 0): Promise<LeaderboardEntry[]> {
    const results = await db
      .select({
        userId: userMastery.userId,
        username: users.username,
        masteryPercent: userMastery.overallMastery,
        totalAttempts: userMastery.totalAttempts,
        successAttempts: userMastery.successAttempts,
        currentStreak: learningStreaks.currentStreak,
      })
      .from(userMastery)
      .leftJoin(users, eq(userMastery.userId, users.id))
      .leftJoin(learningStreaks, eq(userMastery.userId, learningStreaks.userId))
      .orderBy(desc(userMastery.overallMastery))
      .limit(limit)
      .offset(offset);

    return results.map((r, idx) => ({
      rank: offset + idx + 1,
      userId: r.userId,
      username: r.username || "Unknown",
      masteryPercent: parseFloat(r.masteryPercent?.toString() || "0"),
      totalAttempts: r.totalAttempts || 0,
      successAttempts: r.successAttempts || 0,
      currentStreak: r.currentStreak || 0,
    }));
  }

  async getWeeklyLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const results = await db
      .select({
        userId: sql<string>`${attemptHistory.userId}`,
        username: users.username,
        successCount: sql<number>`COUNT(CASE WHEN ${attemptHistory.isCorrect} = true THEN 1 END)`,
        totalCount: sql<number>`COUNT(*)`,
      })
      .from(attemptHistory)
      .leftJoin(users, eq(attemptHistory.userId, users.id))
      .where(sql`${attemptHistory.timestamp} >= ${oneWeekAgo}`)
      .groupBy(attemptHistory.userId, users.username)
      .orderBy(sql`COUNT(CASE WHEN ${attemptHistory.isCorrect} = true THEN 1 END) DESC`)
      .limit(limit);

    return results.map((r, idx) => ({
      rank: idx + 1,
      userId: r.userId,
      username: r.username || "Unknown",
      masteryPercent: r.totalCount > 0 ? Math.round((r.successCount / r.totalCount) * 100) : 0,
      totalAttempts: r.totalCount,
      successAttempts: r.successCount,
      currentStreak: 0,
    }));
  }

  async getUserRank(userId: string): Promise<LeaderboardEntry | null> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return null;

    const [mastery] = await db.select().from(userMastery).where(eq(userMastery.userId, userId));
    const [streak] = await db.select().from(learningStreaks).where(eq(learningStreaks.userId, userId));

    if (!mastery) return null;

    // Get rank by counting how many have higher mastery
    const higherMastery = await db
      .select({ count: sql<number>`count(*)` })
      .from(userMastery)
      .where(sql`${userMastery.overallMastery} > ${mastery.overallMastery}`);

    const rank = (higherMastery[0]?.count || 0) + 1;

    return {
      rank,
      userId,
      username: user.username,
      masteryPercent: parseFloat(mastery.overallMastery?.toString() || "0"),
      totalAttempts: mastery.totalAttempts || 0,
      successAttempts: mastery.successAttempts || 0,
      currentStreak: streak?.currentStreak || 0,
    };
  }

  async getDomainLeaderboard(domain: string, limit: number = 50): Promise<LeaderboardEntry[]> {
    // This would need domain-specific mastery tracking - for now return global with note
    return this.getGlobalLeaderboard(limit, 0);
  }

  async getLeaderboardSize(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(userMastery);
    return result[0]?.count || 0;
  }
}

export const leaderboardService = new LeaderboardService();

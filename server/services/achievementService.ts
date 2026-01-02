import { db } from "../db";
import { achievements, curriculumAttempts, runs } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export type BadgeType = "first_run" | "perfect_score" | "streak_5" | "level_complete" | "mastery_100" | "speedrunner" | "comeback_king";

export interface AchievementRecord {
  id: string;
  userId: string;
  badge: string;
  name: string;
  description?: string;
  unlockedAt: Date;
}

const BADGE_DEFINITIONS: Record<BadgeType, { name: string; description: string }> = {
  first_run: { name: "First Run", description: "Started your first learning run" },
  perfect_score: { name: "Perfect Score", description: "Got 100% on a level" },
  streak_5: { name: "5-Win Streak", description: "Won 5 questions in a row" },
  level_complete: { name: "Level Master", description: "Completed a full level" },
  mastery_100: { name: "Grandmaster", description: "Achieved 100% mastery" },
  speedrunner: { name: "Speedrunner", description: "Completed a level in under 2 minutes" },
  comeback_king: { name: "Comeback King", description: "Got 3 fails then passed all remaining" },
};

export class AchievementService {
  async unlockBadge(userId: string, badge: BadgeType): Promise<boolean> {
    try {
      const existing = await db
        .select()
        .from(achievements)
        .where(and(eq(achievements.userId, userId), eq(achievements.badge, badge)));

      if (existing.length > 0) return false;

      const def = BADGE_DEFINITIONS[badge];
      await db.insert(achievements).values({
        id: uuidv4(),
        userId,
        badge,
        name: def.name,
        description: def.description,
      });

      return true;
    } catch (e) {
      return false;
    }
  }

  async getUserBadges(userId: string): Promise<AchievementRecord[]> {
    return db.select().from(achievements).where(eq(achievements.userId, userId));
  }

  async checkAndUnlockAchievements(userId: string): Promise<BadgeType[]> {
    const unlocked: BadgeType[] = [];

    // Check first run
    const runs_count = await db.select().from(runs).where(eq(runs.owner, userId));
    if (runs_count.length === 1 && (await this.unlockBadge(userId, "first_run"))) {
      unlocked.push("first_run");
    }

    // Check perfect score
    const all_attempts = await db.select().from(curriculumAttempts).where(eq(curriculumAttempts.runId, runs_count[0]?.id || ""));
    if (all_attempts.length > 0 && all_attempts.every((a: any) => a.validatorResult === "pass")) {
      if (await this.unlockBadge(userId, "perfect_score")) {
        unlocked.push("perfect_score");
      }
    }

    // Check streak
    let streak = 0;
    for (const attempt of all_attempts) {
      if (attempt.validatorResult === "pass") {
        streak++;
        if (streak >= 5 && (await this.unlockBadge(userId, "streak_5"))) {
          unlocked.push("streak_5");
          break;
        }
      } else {
        streak = 0;
      }
    }

    return unlocked;
  }
}

export const achievementService = new AchievementService();

import { db } from "../db";
import { spacedRepetition, curriculumQuestions } from "@shared/schema";
import { eq, and, lt } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export class SpacedRepetitionService {
  // SM-2 algorithm for spaced repetition
  calculateNextReview(quality: number, easeFactor: number, interval: number) {
    let newEaseFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    let newInterval: number;

    if (quality < 3) {
      newInterval = 1;
    } else if (interval === 1) {
      newInterval = 3;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }

    return { newInterval, newEaseFactor };
  }

  async scheduleReview(userId: string, questionId: string, quality: number): Promise<void> {
    const [existing] = await db
      .select()
      .from(spacedRepetition)
      .where(and(eq(spacedRepetition.userId, userId), eq(spacedRepetition.questionId, questionId)));

    const { newInterval, newEaseFactor } = this.calculateNextReview(
      quality,
      existing?.easeFactor || 2.5,
      existing?.interval || 1
    );

    const nextReviewAt = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000);

    if (existing) {
      await db
        .update(spacedRepetition)
        .set({
          interval: newInterval,
          easeFactor: newEaseFactor,
          repetitions: existing.repetitions + 1,
          lastReviewedAt: new Date(),
          nextReviewAt,
        })
        .where(and(eq(spacedRepetition.userId, userId), eq(spacedRepetition.questionId, questionId)));
    } else {
      await db.insert(spacedRepetition).values({
        id: uuidv4(),
        userId,
        questionId,
        nextReviewAt,
        interval: newInterval,
        easeFactor: newEaseFactor,
        repetitions: 1,
        lastReviewedAt: new Date(),
      });
    }
  }

  async getDueForReview(userId: string): Promise<any[]> {
    const now = new Date();
    const due = await db
      .select()
      .from(spacedRepetition)
      .where(and(eq(spacedRepetition.userId, userId), lt(spacedRepetition.nextReviewAt, now)));

    return Promise.all(
      due.map(async (item) => {
        const [question] = await db.select().from(curriculumQuestions).where(eq(curriculumQuestions.id, item.questionId));
        return { ...item, question };
      })
    );
  }

  async getStats(userId: string): Promise<any> {
    const items = await db.select().from(spacedRepetition).where(eq(spacedRepetition.userId, userId));
    return {
      totalReviews: items.reduce((sum, i) => sum + i.repetitions, 0),
      itemsScheduled: items.length,
      avgEaseFactor: items.length > 0 ? (items.reduce((sum, i) => sum + i.easeFactor, 0) / items.length).toFixed(2) : 0,
      dueForReview: items.filter((i) => new Date(i.nextReviewAt) < new Date()).length,
    };
  }
}

export const spacedRepetitionService = new SpacedRepetitionService();

import { db } from "../db";
import { questionDifficulty, curriculumAttempts, curriculumQuestions } from "@shared/schema";
import { eq } from "drizzle-orm";

export class DifficultyService {
  async updateQuestionDifficulty(questionId: string): Promise<void> {
    const attempts = await db
      .select()
      .from(curriculumAttempts)
      .where(eq(curriculumAttempts.questionId, questionId));

    if (attempts.length === 0) return;

    const passCount = attempts.filter((a) => a.validatorResult === "pass").length;
    const successRate = Math.round((passCount / attempts.length) * 100);
    
    // Difficulty: 0.1 = very easy (90%+), 0.9 = very hard (<10%)
    const difficulty = 1 - successRate / 100;

    await db
      .insert(questionDifficulty)
      .values({
        questionId,
        difficulty: difficulty.toString(),
        totalAttempts: attempts.length,
        successRate: successRate.toString(),
      })
      .onConflictDoUpdate({
        target: questionDifficulty.questionId,
        set: {
          difficulty: difficulty.toString(),
          totalAttempts: attempts.length,
          successRate: successRate.toString(),
          updatedAt: new Date(),
        },
      });
  }

  async getQuestionDifficulty(questionId: string): Promise<number> {
    const record = await db
      .select()
      .from(questionDifficulty)
      .where(eq(questionDifficulty.questionId, questionId));

    return record.length > 0 ? parseFloat(record[0].difficulty as any) : 0.5;
  }

  async getQuestionsOrderedByDifficulty(levelId: string, ascending: boolean = true): Promise<any[]> {
    const questions = await db
      .select({
        question: curriculumQuestions,
        difficulty: questionDifficulty.difficulty,
      })
      .from(curriculumQuestions)
      .leftJoin(questionDifficulty, eq(curriculumQuestions.id, questionDifficulty.questionId))
      .where(eq(curriculumQuestions.levelId, levelId));

    const sorted = questions.sort((a, b) => {
      const aDiff = a.difficulty ? parseFloat(a.difficulty as any) : 0.5;
      const bDiff = b.difficulty ? parseFloat(b.difficulty as any) : 0.5;
      return ascending ? aDiff - bDiff : bDiff - aDiff;
    });

    return sorted.map((item) => item.question);
  }
}

export const difficultyService = new DifficultyService();

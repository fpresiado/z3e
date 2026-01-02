import { db } from "../db";
import { runs, attemptHistory, curriculumQuestions, curriculumAttempts } from "@shared/schema";
import { eq } from "drizzle-orm";

export class ReportService {
  async generateLearningReport(userId?: string): Promise<string> {
    const userRuns = userId 
      ? await db.select().from(runs).where(eq(runs.owner, userId))
      : await db.select().from(runs);

    const attempts = userId
      ? await db.select().from(attemptHistory).where(eq(attemptHistory.userId, userId))
      : await db.select().from(attemptHistory);

    const totalAttempts = attempts.length;
    const passedAttempts = attempts.filter((a: any) => a.isCorrect).length;
    const failedAttempts = totalAttempts - passedAttempts;
    const successRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

    const csv = `Learning Report
Generated: ${new Date().toISOString()}

Summary
-------
Total Runs: ${userRuns.length}
Total Attempts: ${totalAttempts}
Passed: ${passedAttempts}
Failed: ${failedAttempts}
Success Rate: ${successRate}%

Attempt Details
---------------
Timestamp,Question,Answer,Result,Severity,Time (seconds)
${attempts
  .map(
    (a: any) =>
      `"${new Date(a.timestamp).toISOString()}","${a.questionPrompt || ""}","${a.answerText}","${a.isCorrect ? "PASS" : "FAIL"}","${a.severity || "NONE"}","${a.timeToAnswer || 0}"`
  )
  .join("\n")}
`;

    return csv;
  }

  async generateLevelReport(): Promise<string> {
    const attempts = await db.select().from(curriculumAttempts);

    const levelStats = new Map<string, { passed: number; failed: number }>();

    for (const attempt of attempts) {
      const [question] = await db
        .select()
        .from(curriculumQuestions)
        .where(eq(curriculumQuestions.id, attempt.questionId));

      if (!question) continue;

      const level = question.levelId;
      const current = levelStats.get(level) || { passed: 0, failed: 0 };

      if (attempt.validatorResult === "pass") {
        current.passed++;
      } else {
        current.failed++;
      }

      levelStats.set(level, current);
    }

    const csv = `Level Performance Report
Generated: ${new Date().toISOString()}

Level,Passed,Failed,Total,Success Rate
${Array.from(levelStats.entries())
  .map(
    ([level, stats]) =>
      `"${level}","${stats.passed}","${stats.failed}","${stats.passed + stats.failed}","${Math.round((stats.passed / (stats.passed + stats.failed)) * 100)}%"`
  )
  .join("\n")}
`;

    return csv;
  }
}

export const reportService = new ReportService();
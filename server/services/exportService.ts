import { db } from "../db";
import { runs, futureMessages, curriculumAttempts } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

export interface ExportData {
  exportId: string;
  timestamp: string;
  runs: any[];
  messages: any[];
  attempts: any[];
  metadata: {
    totalRuns: number;
    totalAttempts: number;
    masteryPercentage: number;
  };
}

export class ExportService {
  async exportLearningData(): Promise<ExportData> {
    const exportId = uuidv4();
    const timestamp = new Date().toISOString();

    // Get all learning runs
    const allRuns = await db.select().from(runs);

    const learningRunIds = allRuns.filter((r: any) => r.type === "learning").map((r: any) => r.id);

    // Get all messages for learning runs
    const allMessages = await db
      .select()
      .from(futureMessages);

    // Get all attempts
    const allAttempts = await db.select().from(curriculumAttempts);

    const passedAttempts = allAttempts.filter((a) => a.validatorResult === "pass").length;
    const totalAttempts = allAttempts.length;
    const masteryPercentage = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

    return {
      exportId,
      timestamp,
      runs: allRuns,
      messages: allMessages,
      attempts: allAttempts,
      metadata: {
        totalRuns: allRuns.length,
        totalAttempts: allAttempts.length,
        masteryPercentage,
      },
    };
  }

  async importLearningData(data: ExportData): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    try {
      // Import runs
      for (const run of data.runs) {
        try {
          await db.insert(runs).values({
            id: run.id,
            type: run.type,
            state: run.state,
            owner: run.owner,
            metadata: run.metadata,
            createdAt: new Date(run.createdAt),
            updatedAt: new Date(run.updatedAt),
          });
          imported++;
        } catch (e: any) {
          errors.push(`Failed to import run ${run.id}: ${e.message}`);
        }
      }

      // Import messages
      for (const msg of data.messages) {
        try {
          await db.insert(futureMessages).values({
            id: msg.id,
            runId: msg.runId,
            role: msg.role,
            sender: msg.sender,
            content: msg.content,
            sequenceNumber: msg.sequenceNumber,
            status: msg.status,
            timestamp: new Date(msg.timestamp),
          });
        } catch (e: any) {
          errors.push(`Failed to import message ${msg.id}: ${e.message}`);
        }
      }

      // Import attempts
      for (const attempt of data.attempts) {
        try {
          await db.insert(curriculumAttempts).values({
            id: attempt.id,
            questionId: attempt.questionId,
            runId: attempt.runId,
            attemptNumber: attempt.attemptNumber,
            answerText: attempt.answerText,
            validatorResult: attempt.validatorResult,
            severity: attempt.severity,
            errorType: attempt.errorType,
            timestamp: new Date(attempt.timestamp),
          });
        } catch (e: any) {
          errors.push(`Failed to import attempt ${attempt.id}: ${e.message}`);
        }
      }

      return { imported, errors };
    } catch (error: any) {
      return { imported, errors: [error.message] };
    }
  }
}

export const exportService = new ExportService();

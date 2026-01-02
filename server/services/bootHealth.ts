import { db } from "../db";
import { runs, futureMessages, curriculumLevels, curriculumQuestions, curriculumAttempts, learningState } from "@shared/schema";
import { providerManager } from "./provider";
import { sql } from "drizzle-orm";

export interface BootCheckResult {
  status: "OK" | "DEGRADED" | "FAILED";
  checks: {
    [key: string]: { status: string; message: string };
  };
}

export class BootHealthService {
  async runBootChecks(): Promise<BootCheckResult> {
    const checks: { [key: string]: { status: string; message: string } } = {};

    // 1. Database connectivity
    checks.database = await this.checkDatabase();

    // 2. Schema presence
    checks.schema = await this.checkSchema();

    // 3. Curriculum presence
    checks.curriculum = await this.checkCurriculum();

    // 4. Provider connectivity
    checks.provider = await this.checkProvider();

    // Determine overall status
    const statuses = Object.values(checks).map((c) => c.status);
    const status = statuses.includes("FAILED")
      ? "FAILED"
      : statuses.includes("DEGRADED")
        ? "DEGRADED"
        : "OK";

    return { status, checks };
  }

  private async checkDatabase(): Promise<{ status: string; message: string }> {
    try {
      await db.execute(sql`SELECT 1`);
      return { status: "OK", message: "Database connected" };
    } catch (error: any) {
      return { status: "FAILED", message: `Database failed: ${error.message}` };
    }
  }

  private async checkSchema(): Promise<{ status: string; message: string }> {
    try {
      // Check critical tables exist by querying them
      await db.select().from(runs).limit(1);
      await db.select().from(futureMessages).limit(1);
      await db.select().from(curriculumLevels).limit(1);
      await db.select().from(curriculumQuestions).limit(1);
      await db.select().from(curriculumAttempts).limit(1);
      await db.select().from(learningState).limit(1);

      return { status: "OK", message: "All critical tables exist" };
    } catch (error: any) {
      return { status: "FAILED", message: `Schema check failed: ${error.message}` };
    }
  }

  private async checkCurriculum(): Promise<{ status: string; message: string }> {
    try {
      const levels = await db.select().from(curriculumLevels).limit(1);

      if (levels.length === 0) {
        return { status: "DEGRADED", message: "No curriculum levels seeded yet" };
      }

      const questions = await db.select().from(curriculumQuestions).limit(1);

      if (questions.length === 0) {
        return { status: "DEGRADED", message: "No curriculum questions seeded yet" };
      }

      return { status: "OK", message: "Curriculum data present" };
    } catch (error: any) {
      return { status: "FAILED", message: `Curriculum check failed: ${error.message}` };
    }
  }

  private async checkProvider(): Promise<{ status: string; message: string }> {
    try {
      const healthy = await providerManager.healthCheck();

      if (healthy) {
        return { status: "OK", message: "Provider connected" };
      } else {
        return { status: "DEGRADED", message: "Provider offline, system in read-only mode" };
      }
    } catch (error: any) {
      return { status: "DEGRADED", message: `Provider check failed: ${error.message}` };
    }
  }
}

export const bootHealthService = new BootHealthService();

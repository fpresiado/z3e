import { db } from "../db";
import { runs } from "@shared/schema";
import { providerManager } from "./provider";
import { eq } from "drizzle-orm";

export interface SkillRequest {
  skillId: string;
  input: any;
}

export interface SkillResult {
  skillId: string;
  runId: string;
  status: "success" | "failed";
  result: any;
  error?: string;
}

export class SkillsService {
  async executeSkill(request: SkillRequest): Promise<SkillResult> {
    // Create a skill execution run
    const [run] = await db
      .insert(runs)
      .values({
        type: "skill",
        state: "running",
        owner: "system",
        metadata: {
          skillId: request.skillId,
          input: request.input,
        },
      })
      .returning();

    try {
      let result: any;

      if (request.skillId === "FixCodeSkill") {
        result = await this.fixCode(request.input);
      } else if (request.skillId === "AnalyzeErrorSkill") {
        result = await this.analyzeError(request.input);
      } else if (request.skillId === "OptimizeCodeSkill") {
        result = await this.optimizeCode(request.input);
      } else {
        throw new Error(`Unknown skill: ${request.skillId}`);
      }

      // Mark run as completed
      await db
        .update(runs)
        .set({
          state: "completed",
          updatedAt: new Date(),
          metadata: {
            ...(run.metadata as any),
            result,
          },
        })
        .where(eq(runs.id, run.id));

      return {
        skillId: request.skillId,
        runId: run.id,
        status: "success",
        result,
      };
    } catch (error: any) {
      await db
        .update(runs)
        .set({
          state: "failed",
          errorMessage: error.message,
          updatedAt: new Date(),
        })
        .where(eq(runs.id, run.id));

      return {
        skillId: request.skillId,
        runId: run.id,
        status: "failed",
        error: error.message,
        result: null,
      };
    }
  }

  private async fixCode(input: { code: string; errorLog: string }): Promise<any> {
    const prompt = `You are an expert code fixer. Analyze this code and error log, then provide a fixed version.

CODE:
\`\`\`
${input.code}
\`\`\`

ERROR LOG:
${input.errorLog}

Provide ONLY the fixed code in a code block. No explanation.`;

    const response = await providerManager.generateAnswer({
      question: prompt,
    });

    return {
      originalCode: input.code,
      fixedCode: response.answer,
      errorLog: input.errorLog,
    };
  }

  private async analyzeError(input: { errorLog: string }): Promise<any> {
    const prompt = `Analyze this error log and provide a brief summary of what went wrong:

${input.errorLog}

Provide: 1. Root cause in one sentence. 2. Recommended fix.`;

    const response = await providerManager.generateAnswer({
      question: prompt,
    });

    return {
      analysis: response.answer,
      errorLog: input.errorLog,
    };
  }

  private async optimizeCode(input: { code: string; metric?: string }): Promise<any> {
    const prompt = `Optimize this code for ${input.metric || "performance"}:

\`\`\`
${input.code}
\`\`\`

Provide ONLY the optimized code. No explanation.`;

    const response = await providerManager.generateAnswer({
      question: prompt,
    });

    return {
      originalCode: input.code,
      optimizedCode: response.answer,
      metric: input.metric || "performance",
    };
  }
}

export const skillsService = new SkillsService();

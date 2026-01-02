import { db } from "../db";
import { curriculumLevels, curriculumQuestions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { promises as fs } from "fs";
import path from "path";

export class CIRImportService {
  async importCIRCurriculum() {
    console.log("[CIR] Starting CIR curriculum import...");

    const curriculumDir = "/tmp/cir";

    try {
      // Read master index
      const indexPath = path.join(curriculumDir, "masterCurriculumIndex.json");
      const indexContent = await fs.readFile(indexPath, "utf-8");
      const masterIndex = JSON.parse(indexContent);

      console.log(`[CIR] Found ${masterIndex.subjects.length} subjects`);

      for (const subject of masterIndex.subjects) {
        await this.importSubject(subject, curriculumDir);
      }

      console.log("[CIR] ✓ CIR curriculum import complete!");
    } catch (error: any) {
      console.error("[CIR] Import failed:", error.message);
    }
  }

  private async importSubject(subject: any, curriculumDir: string) {
    const filePath = path.join(curriculumDir, subject.fileName);

    try {
      const content = await fs.readFile(filePath, "utf-8");
      const curriculum = JSON.parse(content);

      const domainId = subject.id;

      // Check if domain already exists
      const existing = await db
        .select()
        .from(curriculumLevels)
        .where(
          eq(
            curriculumLevels.domain,
            domainId
          )
        );

      if (existing.length > 0) {
        console.log(`[CIR] ✓ ${subject.displayName} (${existing.length} levels) - already imported`);
        return;
      }

      // Import tiers as levels
      if (curriculum.tiers && Array.isArray(curriculum.tiers)) {
        for (const tier of curriculum.tiers) {
          const levelData = {
            domain: domainId,
            levelNumber: tier.tierNumber,
            name: tier.name,
            description: tier.goal,
            questionCount: tier.questions?.length || 0,
          };

          const [level] = await db
            .insert(curriculumLevels)
            .values(levelData)
            .returning();

          // Import questions for this level/tier
          if (tier.questions && Array.isArray(tier.questions)) {
            for (let i = 0; i < tier.questions.length; i++) {
              const q = tier.questions[i];
              try {
                await db.insert(curriculumQuestions).values({
                  levelId: level.id,
                  number: i + 1,
                  prompt: q.questionText,
                  expectedCategory: `${subject.id}_tier_${tier.tierNumber}`,
                  expectedFormat: "essay",
                  expectedValue: q.expectedBehaviors?.join("; ") || "",
                  metadata: {
                    difficulty: q.difficultyLevel || 1,
                    hints: q.hints || [],
                    concepts: tier.concepts || [],
                  },
                });
              } catch (err: any) {
                console.error(`[CIR] Error importing question for ${subject.id} tier ${tier.tierNumber}:`, err.message);
              }
            }
          }
        }

        console.log(
          `[CIR] ✓ ${subject.displayName} (${curriculum.tiers.length} tiers) - imported`
        );
      }
    } catch (error: any) {
      console.error(
        `[CIR] Error importing ${subject.fileName}:`,
        error.message
      );
    }
  }
}

export const cirImportService = new CIRImportService();

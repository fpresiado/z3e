import { db } from "../db";
import { curriculumLevels, curriculumQuestions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { promises as fs } from "fs";
import path from "path";

const DOMAIN_MAP: { [key: string]: string } = {
  domain_AI: "AI",
  domain_ARTS: "ARTS",
  domain_BUS: "BUS",
  domain_ENGINEER: "ENGINEER",
  domain_ESOTERIC: "ESOTERIC",
  domain_FINANCE: "FINANCE",
  domain_FUSION: "FUSION",
  domain_HSCIENCE: "HSCIENCE",
  domain_HUM: "HUM",
  domain_INFO: "INFO",
  domain_MATH: "MATH",
  domain_MED: "MED",
  domain_MEMORY: "MEMORY",
  domain_META: "META",
  domain_NAT: "NAT",
  domain_OPS: "OPS",
  domain_PERSONAL: "PERSONAL",
};

export class CurriculumLoaderService {
  async loadCurriculumFromDirectory() {
    console.log("[LOADER] Starting curriculum load from curriculum_output...");

    const curriculumDir = path.join(process.cwd(), "curriculum_output");

    try {
      const entries = await fs.readdir(curriculumDir, { withFileTypes: true });
      const domainDirs = entries.filter((e) => e.isDirectory() && e.name.startsWith("domain_"));

      console.log(`[LOADER] Found ${domainDirs.length} domains`);

      let totalQuestionsLoaded = 0;

      for (const domainDir of domainDirs) {
        const domainCode = DOMAIN_MAP[domainDir.name] || domainDir.name.replace("domain_", "");
        const domainPath = path.join(curriculumDir, domainDir.name);

        // Check if domain already loaded
        const existing = await db
          .select()
          .from(curriculumLevels)
          .where(eq(curriculumLevels.domain, domainCode));

        if (existing.length > 0) {
          console.log(`[LOADER] ✓ ${domainCode} already loaded (${existing.length} levels)`);
          continue;
        }

        // Read all level files from domain directory
        const files = await fs.readdir(domainPath);
        const levelFiles = files.filter((f) => f.includes("level_") && f.includes("questions"));

        // Extract unique level numbers
        const levels = new Set<number>();
        for (const file of levelFiles) {
          const match = file.match(/level_(\d+)/);
          if (match) levels.add(parseInt(match[1]));
        }

        console.log(`[LOADER] Loading ${domainCode}: ${levels.size} levels`);

        // Load each level
        for (const levelNum of Array.from(levels).sort((a, b) => a - b)) {
          const levelQuestions: any[] = [];

          // Read all question parts for this level
          for (const file of files) {
            if (file.includes(`level_${String(levelNum).padStart(2, "0")}`) && file.includes("questions")) {
              const filePath = path.join(domainPath, file);
              const content = await fs.readFile(filePath, "utf-8");
              const lines = content.split("\n").filter((l) => l.trim());

              for (const line of lines) {
                try {
                  levelQuestions.push(JSON.parse(line));
                } catch {
                  // Skip invalid lines
                }
              }
            }
          }

          if (levelQuestions.length === 0) continue;

          // Create level record
          const [level] = await db
            .insert(curriculumLevels)
            .values({
              domain: domainCode,
              levelNumber: levelNum,
              name: `Level ${levelNum}`,
              description: `${domainCode} Level ${levelNum}`,
              questionCount: levelQuestions.length,
            })
            .returning();

          // Insert questions
          let questionsAdded = 0;
          for (let i = 0; i < levelQuestions.length; i++) {
            const q = levelQuestions[i];
            try {
              await db.insert(curriculumQuestions).values({
                levelId: level.id,
                number: (q.questionNumber || q.id?.split("_Q")?.[1] || i + 1) as number,
                prompt: q.prompt || q.questionText || "",
                expectedCategory: q.questionType || "general",
                expectedFormat: "essay",
                expectedValue: q.expectedAnswer || q.expectedBehaviors?.join("; ") || "",
                metadata: {
                  difficulty: q.metadata?.difficulty || q.difficulty || 1,
                  domainFocus: q.metadata?.domainFocus || "",
                  questionType: q.questionType || "",
                  requiresIntegration: q.metadata?.requiresIntegration || false,
                },
              });
              questionsAdded++;
            } catch (err: any) {
              // Silently skip problematic questions
            }
          }

          console.log(`[LOADER] ✓ ${domainCode} Level ${levelNum}: ${questionsAdded} questions`);
          totalQuestionsLoaded += questionsAdded;
        }
      }

      console.log(`[LOADER] ✓ Curriculum loaded: ${totalQuestionsLoaded} questions across ${domainDirs.length} domains`);
      return true;
    } catch (error: any) {
      console.error("[LOADER] Error loading curriculum:", error.message);
      return false;
    }
  }
}

export const curriculumLoaderService = new CurriculumLoaderService();

import { db } from "../db";
import { curriculumLevels, curriculumQuestions } from "@shared/schema";
import { eq } from "drizzle-orm";

export class SeedService {
  async seedCurriculum() {
    // Check if levels already exist
    const existingLevels = await db
      .select()
      .from(curriculumLevels)
      .limit(1);

    if (existingLevels.length > 0) {
      console.log("[SEED] Curriculum already seeded, skipping");
      return;
    }

    console.log("[SEED] Seeding 9 curriculum levels...");

    const levelsData = [
      {
        domain: "education",
        levelNumber: 1,
        name: "Basics",
        description: "Introduction to system metrics",
        questionCount: 5,
      },
      {
        domain: "education",
        levelNumber: 2,
        name: "Foundations",
        description: "Understanding CPU and memory",
        questionCount: 5,
      },
      {
        domain: "education",
        levelNumber: 3,
        name: "Intermediate",
        description: "Network and disk metrics",
        questionCount: 5,
      },
      {
        domain: "education",
        levelNumber: 4,
        name: "Advanced",
        description: "System performance tuning",
        questionCount: 5,
      },
      {
        domain: "education",
        levelNumber: 5,
        name: "Expert",
        description: "Complex system analysis",
        questionCount: 5,
      },
      {
        domain: "education",
        levelNumber: 6,
        name: "Master",
        description: "Real-time system monitoring",
        questionCount: 5,
      },
      {
        domain: "education",
        levelNumber: 7,
        name: "Specialist",
        description: "Specialized domain knowledge",
        questionCount: 5,
      },
      {
        domain: "education",
        levelNumber: 8,
        name: "Professional",
        description: "Production system management",
        questionCount: 5,
      },
      {
        domain: "education",
        levelNumber: 9,
        name: "Architect",
        description: "System architecture design",
        questionCount: 5,
      },
    ];

    // Insert all levels
    for (const level of levelsData) {
      try {
        const existing = await db
          .select()
          .from(curriculumLevels)
          .where(
            eq(curriculumLevels.levelNumber, level.levelNumber)
          );

        if (existing.length === 0) {
          await db.insert(curriculumLevels).values(level);
          console.log(`[SEED] ✓ Level ${level.levelNumber}: ${level.name}`);
        }
      } catch (error: any) {
        console.error(
          `[SEED] Error seeding level ${level.levelNumber}:`,
          error.message
        );
      }
    }

    // Seed sample questions for each level
    await this.seedSampleQuestions();
    console.log("[SEED] ✓ Curriculum fully seeded");
  }

  private async seedSampleQuestions() {
    const levels = await db.select().from(curriculumLevels);

    const questions = [
      { expected_category: "CPU_LOAD", prompt: "What is CPU load at 50%?", expectedValue: "CPU load is 50%." },
      { expected_category: "MEMORY_USAGE", prompt: "Describe memory usage at 75%", expectedValue: "Memory usage is 75%." },
      { expected_category: "DISK_USAGE", prompt: "What is disk usage at 80%?", expectedValue: "Disk usage is 80%." },
      { expected_category: "UPTIME", prompt: "System has been up for 100 hours", expectedValue: "Uptime is 100 hours." },
      { expected_category: "PROCESSES", prompt: "How many processes are running: 150?", expectedValue: "150 processes running." },
    ];

    for (const level of levels) {
      // Check if this level already has questions
      const existing = await db
        .select()
        .from(curriculumQuestions)
        .where(eq(curriculumQuestions.levelId, level.id));

      if (existing.length === 0) {
        // Add sample questions for this level
        for (let i = 0; i < questions.length; i++) {
          try {
            await db.insert(curriculumQuestions).values({
              levelId: level.id,
              number: i + 1,
              prompt: questions[i].prompt,
              expectedCategory: questions[i].expected_category,
              expectedFormat: "literal",
              expectedValue: questions[i].expectedValue,
            });
          } catch (error: any) {
            console.error(`[SEED] Error seeding question for level ${level.levelNumber}:`, error.message);
          }
        }
      }
    }
  }
}

export const seedService = new SeedService();

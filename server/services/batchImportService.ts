import { db } from "../db";
import { curriculumLevels, curriculumQuestions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export interface QuestionImport {
  levelNumber: number;
  prompt: string;
  expectedCategory: string;
  expectedValue?: string;
  expectedFormat?: string;
}

export class BatchImportService {
  async importQuestionsFromCSV(csvData: string): Promise<{ imported: number; errors: string[] }> {
    const lines = csvData.trim().split("\n");
    const errors: string[] = [];
    let imported = 0;

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      try {
        const [levelNum, prompt, category, expectedValue, format] = lines[i].split(",").map((s) => s.trim());

        if (!levelNum || !prompt || !category) {
          errors.push(`Row ${i + 1}: Missing required fields`);
          continue;
        }

        const level = await db
          .select()
          .from(curriculumLevels)
          .where(eq(curriculumLevels.levelNumber, parseInt(levelNum)));

        if (level.length === 0) {
          errors.push(`Row ${i + 1}: Level ${levelNum} not found`);
          continue;
        }

        await db.insert(curriculumQuestions).values({
          id: uuidv4(),
          levelId: level[0].id,
          number: Math.floor(Math.random() * 1000),
          prompt,
          expectedCategory: category,
          expectedValue: expectedValue || undefined,
          expectedFormat: format || "literal",
        });

        imported++;
      } catch (e: any) {
        errors.push(`Row ${i + 1}: ${e.message}`);
      }
    }

    return { imported, errors };
  }

  async importQuestionsFromJSON(jsonData: QuestionImport[]): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    for (let i = 0; i < jsonData.length; i++) {
      try {
        const q = jsonData[i];

        const level = await db
          .select()
          .from(curriculumLevels)
          .where(eq(curriculumLevels.levelNumber, q.levelNumber));

        if (level.length === 0) {
          errors.push(`Item ${i + 1}: Level ${q.levelNumber} not found`);
          continue;
        }

        await db.insert(curriculumQuestions).values({
          id: uuidv4(),
          levelId: level[0].id,
          number: Math.floor(Math.random() * 1000),
          prompt: q.prompt,
          expectedCategory: q.expectedCategory,
          expectedValue: q.expectedValue,
          expectedFormat: q.expectedFormat || "literal",
        });

        imported++;
      } catch (e: any) {
        errors.push(`Item ${i + 1}: ${e.message}`);
      }
    }

    return { imported, errors };
  }
}

export const batchImportService = new BatchImportService();

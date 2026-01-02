import { db } from "../db";
import {
  educationLevelState,
  curriculumMastery,
  curriculumAttempts,
  curriculumQuestions,
  curriculumLevels,
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { promises as fs } from "fs";
import path from "path";

const INDEX_PATH = path.join(process.cwd(), "server", "data", "educationLevelIndex.json");

export class EducationLevelService {
  private levelIndex: any = null;

  async initialize() {
    try {
      const indexContent = await fs.readFile(INDEX_PATH, "utf-8");
      this.levelIndex = JSON.parse(indexContent);
      console.log("[ELS] Education level index loaded");
    } catch (error) {
      console.error("[ELS] Failed to load education level index:", error);
      throw error;
    }
  }

  async getEducationLevelIndex() {
    if (!this.levelIndex) await this.initialize();
    return this.levelIndex;
  }

  async getEducationLevelState(zeusProfile: string = "default") {
    const [state] = await db
      .select()
      .from(educationLevelState)
      .where(eq(educationLevelState.zeusProfile, zeusProfile));

    if (!state) {
      const [newState] = await db
        .insert(educationLevelState)
        .values({
          zeusProfile,
          currentEducationLevel: 1,
          mode: "manual",
          completedLevels: [],
        })
        .returning();
      return newState;
    }

    return state;
  }

  async setEducationMode(
    zeusProfile: string,
    mode: "manual" | "automatic",
    startLevel?: number,
    endLevel?: number
  ) {
    const [state] = await db
      .select()
      .from(educationLevelState)
      .where(eq(educationLevelState.zeusProfile, zeusProfile));

    if (state) {
      const [updated] = await db
        .update(educationLevelState)
        .set({
          mode,
          autoRunStartLevel: startLevel,
          autoRunEndLevel: endLevel || 12,
          autoRunActive: mode === "automatic",
          currentEducationLevel: startLevel || state.currentEducationLevel,
        })
        .where(eq(educationLevelState.zeusProfile, zeusProfile))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(educationLevelState)
      .values({
        zeusProfile,
        mode,
        autoRunStartLevel: startLevel,
        autoRunEndLevel: endLevel || 12,
        autoRunActive: mode === "automatic",
        currentEducationLevel: startLevel || 1,
      })
      .returning();
    return created;
  }

  async getCurriculaForLevel(educationLevel: number) {
    const index = await this.getEducationLevelIndex();
    const levelConfig = index.educationLevels.find((l: any) => l.level === educationLevel);
    
    if (!levelConfig) {
      throw new Error(`Education level ${educationLevel} not found`);
    }

    return levelConfig;
  }

  async calculateCurriculumMastery(zeusProfile: string, curriculumId: string) {
    // Get all curriculum levels for this curriculum
    const levels = await db
      .select()
      .from(curriculumLevels)
      .where(eq(curriculumLevels.domain, curriculumId));

    if (levels.length === 0) {
      return { masteryPercent: 0, questionsAttempted: 0, questionsCorrect: 0 };
    }

    let totalAttempted = 0;
    let totalCorrect = 0;
    let totalSevereErrors = 0;

    for (const level of levels) {
      const attempts = await db
        .select()
        .from(curriculumAttempts)
        .where(eq(curriculumAttempts.questionId, level.id));

      for (const attempt of attempts) {
        totalAttempted++;
        if (attempt.validatorResult === "pass") {
          totalCorrect++;
        }
        if (attempt.severity === "SEVERE") {
          totalSevereErrors++;
        }
      }
    }

    const masteryPercent = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

    // Update or create mastery record
    const existing = await db
      .select()
      .from(curriculumMastery)
      .where(
        and(
          eq(curriculumMastery.zeusProfile, zeusProfile),
          eq(curriculumMastery.curriculumId, curriculumId)
        )
      );

    if (existing.length > 0) {
      await db
        .update(curriculumMastery)
        .set({
          masteryPercent: masteryPercent.toString(),
          questionsAttempted: totalAttempted,
          questionsCorrect: totalCorrect,
          severeErrorCount: totalSevereErrors,
          lastUpdated: new Date(),
        })
        .where(
          and(
            eq(curriculumMastery.zeusProfile, zeusProfile),
            eq(curriculumMastery.curriculumId, curriculumId)
          )
        );
    } else {
      await db.insert(curriculumMastery).values({
        zeusProfile,
        curriculumId,
        masteryPercent: masteryPercent.toString(),
        questionsAttempted: totalAttempted,
        questionsCorrect: totalCorrect,
        severeErrorCount: totalSevereErrors,
      });
    }

    return { masteryPercent, questionsAttempted: totalAttempted, questionsCorrect: totalCorrect };
  }

  async checkLevelMastery(zeusProfile: string, educationLevel: number) {
    const levelConfig = await this.getCurriculaForLevel(educationLevel);
    const threshold = levelConfig.masteryThreshold || 95;

    let allAboveThreshold = true;
    const curricula = [];

    for (const curriculumId of levelConfig.curricula) {
      const mastery = await this.calculateCurriculumMastery(zeusProfile, curriculumId);
      curricula.push({
        curriculumId,
        masteryPercent: mastery.masteryPercent,
      });

      if (mastery.masteryPercent < threshold) {
        allAboveThreshold = false;
      }
    }

    return {
      levelComplete: allAboveThreshold,
      curricula,
      threshold,
    };
  }

  async progressToNextLevel(zeusProfile: string) {
    const state = await this.getEducationLevelState(zeusProfile);

    if (state.mode === "automatic" && state.autoRunActive) {
      if (state.currentEducationLevel < (state.autoRunEndLevel || 12)) {
        const nextLevel = state.currentEducationLevel + 1;
        
        const completedLevels = (state.completedLevels || []) as number[];
        if (!completedLevels.includes(state.currentEducationLevel)) {
          completedLevels.push(state.currentEducationLevel);
        }

        const [updated] = await db
          .update(educationLevelState)
          .set({
            currentEducationLevel: nextLevel,
            completedLevels,
          })
          .where(eq(educationLevelState.zeusProfile, zeusProfile))
          .returning();

        return {
          advanced: true,
          newLevel: nextLevel,
          state: updated,
        };
      } else {
        // Auto-run complete
        const [updated] = await db
          .update(educationLevelState)
          .set({
            autoRunActive: false,
            completedLevels: Array.from({ length: state.currentEducationLevel }, (_, i) => i + 1),
          })
          .where(eq(educationLevelState.zeusProfile, zeusProfile))
          .returning();

        return {
          advanced: false,
          autoRunComplete: true,
          state: updated,
        };
      }
    }

    return { advanced: false, state };
  }

  async getCurriculaForEducationLevel(educationLevel: number) {
    const levelConfig = await this.getCurriculaForLevel(educationLevel);
    const curricula = [];

    for (const curriculumId of levelConfig.curricula) {
      const levels = await db
        .select()
        .from(curriculumLevels)
        .where(eq(curriculumLevels.domain, curriculumId));

      curricula.push({
        curriculumId,
        name: levelConfig.label,
        levels: levels.map((l) => ({
          id: l.id,
          levelNumber: l.levelNumber,
          name: l.name,
        })),
      });
    }

    return curricula;
  }
}

export const educationLevelService = new EducationLevelService();

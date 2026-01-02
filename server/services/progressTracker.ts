import { db } from "../db";
import { sql } from "drizzle-orm";

interface ProgressState {
  isRunning: boolean;
  totalQuestions: number;
  generatedQuestions: number;
  totalDomains: number;
  currentDomain: number;
  currentLevel: number;
  startTime: number;
  pausedTime: number;
  completedDomains: string[];
  cpuEnabled: boolean;
}

let progressState: ProgressState = {
  isRunning: false,
  totalQuestions: 199500, // 21 domains × 19 levels × 500 questions
  generatedQuestions: 0,
  totalDomains: 21,
  currentDomain: 0,
  currentLevel: 0,
  startTime: 0,
  pausedTime: 0,
  completedDomains: [],
  cpuEnabled: false,
};

export const progressTracker = {
  // Initialize progress tracker
  init() {
    progressState.generatedQuestions = 0;
    progressState.isRunning = false;
    progressState.startTime = 0;
    progressState.pausedTime = 0;
    progressState.completedDomains = [];
  },

  // Start generation
  start() {
    if (!progressState.isRunning) {
      progressState.isRunning = true;
      if (progressState.startTime === 0) {
        progressState.startTime = Date.now();
      }
      progressState.pausedTime = 0;
    }
  },

  // Pause generation
  pause() {
    if (progressState.isRunning) {
      progressState.isRunning = false;
      progressState.pausedTime = Date.now();
    }
  },

  // Update progress incrementally
  updateProgress(questionsGenerated: number, currentDomain: number, currentLevel: number, completedDomains: string[]) {
    progressState.generatedQuestions = questionsGenerated;
    progressState.currentDomain = currentDomain;
    progressState.currentLevel = currentLevel;
    progressState.completedDomains = completedDomains;
  },

  // Get current progress with ETA
  getProgress() {
    const percentage = (progressState.generatedQuestions / progressState.totalQuestions) * 100;
    
    let eta = "Calculating...";
    if (progressState.generatedQuestions > 0 && progressState.startTime > 0) {
      const elapsedMs = Date.now() - progressState.startTime;
      const elapsedSeconds = elapsedMs / 1000;
      const qPerSecond = progressState.generatedQuestions / Math.max(elapsedSeconds, 1);
      const remainingQuestions = progressState.totalQuestions - progressState.generatedQuestions;
      const etaSeconds = remainingQuestions / Math.max(qPerSecond, 0.1);
      
      const hours = Math.floor(etaSeconds / 3600);
      const minutes = Math.floor((etaSeconds % 3600) / 60);
      const seconds = Math.floor(etaSeconds % 60);
      
      if (hours > 0) {
        eta = `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        eta = `${minutes}m ${seconds}s`;
      } else {
        eta = `${seconds}s`;
      }
    }

    return {
      isRunning: progressState.isRunning,
      generatedQuestions: progressState.generatedQuestions,
      totalQuestions: progressState.totalQuestions,
      percentage: Math.min(percentage, 100),
      eta,
      currentDomain: progressState.currentDomain,
      totalDomains: progressState.totalDomains,
      currentLevel: progressState.currentLevel,
      completedDomains: progressState.completedDomains,
      qPerSecond: (progressState.generatedQuestions / Math.max((Date.now() - progressState.startTime) / 1000, 1)).toFixed(2),
      cpuEnabled: progressState.cpuEnabled,
    };
  },

  setCpuEnabled(enabled: boolean) {
    progressState.cpuEnabled = enabled;
    console.log(`[ProgressTracker] CPU ${enabled ? "ENABLED" : "DISABLED"}`);
  },

  // Check if generation should continue
  shouldContinueGeneration(): boolean {
    return progressState.isRunning;
  },

  // Sync with actual database
  async syncFromDatabase() {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(*) as count FROM curriculum_questions
      `);
      const count = result.rows[0]?.count || 0;
      progressState.generatedQuestions = parseInt(count);
    } catch (error) {
      console.error("[ProgressTracker] Error syncing from database:", error);
    }
  },
};

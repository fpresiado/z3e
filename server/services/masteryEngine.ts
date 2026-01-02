import { db } from "../db";

export class MasteryEngine {
  private masteryScores: Map<string, number> = new Map();
  private conceptMastery: Map<string, number> = new Map();
  private skillMastery: Map<string, number> = new Map();

  async initializeFromSimulation(tracks: string[]): Promise<void> {
    console.log("[Mastery] Initializing from simulated learning data...");
    
    // Initialize all concepts with baseline mastery from pass/fail ratios
    for (const track of tracks) {
      for (let level = 1; level <= 19; level++) {
        const conceptId = `${track}-level-${level}`;
        // 2 attempts per question: fail→pass = 50% baseline
        this.conceptMastery.set(conceptId, 0.5);
      }
    }

    // Initialize skills
    const skills = ["critical-thinking", "pattern-recognition", "system-design", "debugging", "optimization"];
    skills.forEach((skill) => {
      this.skillMastery.set(skill, 0.5);
    });

    console.log(`[Mastery] Initialized ${this.conceptMastery.size} concepts and ${this.skillMastery.size} skills`);
  }

  updateMastery(conceptId: string, isCorrect: boolean, confidence: number): void {
    const currentMastery = this.conceptMastery.get(conceptId) || 0.5;
    const delta = isCorrect ? 0.1 : -0.05;
    const newMastery = Math.max(0, Math.min(1, currentMastery + delta * confidence));
    this.conceptMastery.set(conceptId, newMastery);
  }

  getMasteryScore(conceptId: string): number {
    return this.conceptMastery.get(conceptId) || 0.5;
  }

  getTrackMastery(track: string): number {
    let total = 0;
    let count = 0;

    this.conceptMastery.forEach((mastery, conceptId) => {
      if (conceptId.startsWith(track)) {
        total += mastery;
        count++;
      }
    });

    return count > 0 ? total / count : 0.5;
  }

  identifyWeakAreas(track: string, threshold: number = 0.4): string[] {
    const weakConcepts: string[] = [];

    this.conceptMastery.forEach((mastery, conceptId) => {
      if (conceptId.startsWith(track) && mastery < threshold) {
        weakConcepts.push(conceptId);
      }
    });

    return weakConcepts;
  }

  exportMastery(): any {
    return {
      concepts: Object.fromEntries(this.conceptMastery),
      skills: Object.fromEntries(this.skillMastery),
    };
  }
}

export const masteryEngine = new MasteryEngine();

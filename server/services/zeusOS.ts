import { EventBus } from "./eventBus.js";
import { learningService } from "./learningService.js";
import { bootHealthService } from "./bootHealth.js";
import { skillsService } from "./skillsService.js";
import { providerManager } from "./provider.js";
import { exportService } from "./exportService.js";
// import { leaderboardService } from "./leaderboardService.js"; // REMOVED - not needed for core
import { achievementService } from "./achievementService.js";
import { notificationService } from "./notificationService.js";
import { streakService } from "./streakService.js";
import { spacedRepetitionService } from "./spacedRepetitionService.js";
// import { recommendationEngineService } from "./recommendationEngineService.js"; // REMOVED - not needed for core

/**
 * ZeusOS Kernel
 * Central orchestrator that wires all services, manages state transitions,
 * and coordinates the full learning pipeline
 */
export class ZeusOS {
  private static instance: ZeusOS;
  private eventBus: EventBus;
  private services: Map<string, any> = new Map();
  private systemState: "booting" | "running" | "safe_mode" | "shutdown" = "booting";

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.registerServices();
  }

  static getInstance(): ZeusOS {
    if (!ZeusOS.instance) {
      ZeusOS.instance = new ZeusOS();
    }
    return ZeusOS.instance;
  }

  private registerServices(): void {
    // Core services
    this.services.set("learning", learningService);
    this.services.set("bootHealth", bootHealthService);
    this.services.set("provider", providerManager);
    this.services.set("eventBus", this.eventBus);
    
    // Feature services
    this.services.set("skills", skillsService);
    this.services.set("export", exportService);
    // this.services.set("leaderboard", leaderboardService); // REMOVED - not needed for core
    this.services.set("achievement", achievementService);
    this.services.set("notification", notificationService);
    this.services.set("streak", streakService);
    this.services.set("spacedRepetition", spacedRepetitionService);
    // this.services.set("recommendation", recommendationEngineService); // REMOVED - not needed for core
  }

  async boot(): Promise<{ status: string; checks: any }> {
    console.log("[ZeusOS] Kernel booting...");
    this.systemState = "booting";
    
    try {
      const healthCheck = await (bootHealthService as any).performHealthCheck();
      
      if (healthCheck.status === "OK") {
        this.systemState = "running";
        console.log("[ZeusOS] Kernel running normally");
        await this.eventBus.emit("system:boot", { status: "OK" });
      } else {
        this.systemState = "safe_mode";
        console.log("[ZeusOS] SAFE MODE: Critical checks failed");
        await this.eventBus.emit("system:safe-mode", { checks: healthCheck.checks });
      }
      
      return healthCheck;
    } catch (error) {
      this.systemState = "safe_mode";
      console.error("[ZeusOS] Boot failed:", error);
      return { status: "ERROR", checks: {} };
    }
  }

  getService(name: string): any {
    const service = this.services.get(name);
    if (!service) {
      console.warn(`[ZeusOS] Service "${name}" not found`);
    }
    return service;
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }

  getState(): string {
    return this.systemState;
  }

  isSafeMode(): boolean {
    return this.systemState === "safe_mode";
  }

  isRunning(): boolean {
    return this.systemState === "running";
  }

  // Learning orchestration
  async startLearning(domain: string, levelNumber: number): Promise<any> {
    if (this.isSafeMode()) {
      throw new Error("Learning disabled in SAFE MODE");
    }
    
    const result = await learningService.startLearningRun(domain, levelNumber);
    await this.eventBus.emit("learning:started", { runId: result.runId, domain, levelNumber });
    return result;
  }

  async submitAnswer(runId: string, questionId: string, answerText: string): Promise<any> {
    const result = await learningService.submitAnswer(runId, questionId, answerText);
    
    if (result.correct) {
      await this.eventBus.emit("learning:answer-correct", { runId, questionId });
      await (streakService as any).updateStreak(runId, true);
    } else {
      await this.eventBus.emit("learning:answer-incorrect", { runId, questionId, severity: result.severity });
    }
    
    return result;
  }

  // Skill execution
  async executeSkill(skillName: string, context: any): Promise<any> {
    const skill = await (skillsService as any).getSkill(skillName);
    if (!skill) {
      throw new Error(`Skill "${skillName}" not found`);
    }
    
    await this.eventBus.emit("skill:executing", { skillName });
    const result = await (skillsService as any).executeSkill(skillName, context);
    await this.eventBus.emit("skill:executed", { skillName, result });
    return result;
  }

  // Shutdown
  async shutdown(): Promise<void> {
    console.log("[ZeusOS] Kernel shutting down...");
    this.systemState = "shutdown";
    this.eventBus.emit("system:shutdown", {});
  }
}

export const zeusOS = ZeusOS.getInstance();

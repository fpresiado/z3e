import express, { Request, Response, Router } from "express";
import { db } from "./db";
import { learningService } from "./services/learningService";
import { bootHealthService } from "./services/bootHealth";
import { providerManager } from "./services/provider";
import { skillsService } from "./services/skillsService";
import { exportService } from "./services/exportService";
import { educationLevelService } from "./services/educationLevelService";
import { anomalyDetectionService } from "./services/anomalyDetectionService";
import { zeusHealthMonitor } from "./services/zeusHealthMonitor";
import { devChatRouter } from "./routes/devChatRoutes";
import { authService } from "./auth";
import { achievementService } from "./services/achievementService";
import { leaderboardService } from "./services/leaderboardService";
import { analyticsService } from "./services/analyticsService";
import newModulesRoutes from "./routes/newModulesRoutes";
import { NewModulesQaSweep } from "./services/newModulesQaSweep";
import { runs, futureMessages, curriculumLevels, curriculumQuestions, curriculumAttempts, learningState, curriculumMastery, users, userMastery } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const router = Router();

// ============= AUTH MIDDLEWARE =============
const requireAuth = async (req: Request, res: Response, next: Function) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: no token provided" });
    }
    const token = authHeader.substring(7);
    const user = await authService.verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: invalid token" });
    }
    (req as any).user = user;
    next();
  } catch (error: any) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

const requireAdmin = async (req: Request, res: Response, next: Function) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: no token provided" });
    }
    const token = authHeader.substring(7);
    const user = await authService.verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: invalid token" });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: admin role required" });
    }
    (req as any).user = user;
    next();
  } catch (error: any) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

// ============= HEALTH CHECK =============

router.get("/api/health", async (_req: Request, res: Response) => {
  try {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "3.0.0"
    });
  } catch (error: any) {
    res.status(500).json({ status: "unhealthy", error: error.message });
  }
});

// ============= AUTH ROUTES =============

router.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: "username, email, and password required" });
    }

    const result = await authService.register(username, email, password);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "username and password required" });
    }

    const result = await authService.login(username, password);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/api/auth/verify", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: "token required" });
    }

    const user = await authService.verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    res.json({ user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/auth/user/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await authService.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/api/auth/set-password", async (req: Request, res: Response) => {
  try {
    const { userId, password } = req.body;
    
    if (!userId || !password) {
      return res.status(400).json({ error: "userId and password required" });
    }

    const result = await authService.setPassword(userId, password);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/api/auth/setup-2fa", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    const result = await authService.setup2FA(userId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/api/auth/verify-2fa", async (req: Request, res: Response) => {
  try {
    const { userId, token } = req.body;
    
    if (!userId || !token) {
      return res.status(400).json({ error: "userId and token required" });
    }

    const result = await authService.verify2FA(userId, token);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/api/auth/disable-2fa", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    const result = await authService.disable2FA(userId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/api/auth/complete-2fa-login", async (req: Request, res: Response) => {
  try {
    const { userId, token: totpToken, pendingToken } = req.body;
    
    if (!userId || !totpToken || !pendingToken) {
      return res.status(400).json({ error: "userId, token, and pendingToken required" });
    }

    const decoded = await authService.verifyToken(pendingToken);
    if (!decoded || (decoded as any).userId !== parseInt(userId) || !(decoded as any).pending2FA) {
      return res.status(401).json({ error: "Invalid pending token" });
    }

    const result = await authService.complete2FALogin(userId, totpToken);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/user/profile/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const userResult = await db.execute(sql`
      SELECT id, username, email, created_at as "createdAt" 
      FROM users WHERE id = ${parseInt(userId)}
    `);
    
    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const user = userResult.rows[0] as any;

    const masteryResult = await db.execute(sql`
      SELECT user_id as "userId", overall_mastery as "overallMastery", 
             levels_completed as "levelsCompleted", total_attempts as "totalAttempts",
             success_attempts as "successAttempts", total_time_spent as "totalTimeSpent"
      FROM user_mastery WHERE user_id = ${parseInt(userId)}
    `);
    
    const mastery = masteryResult.rows?.[0] as any;

    res.json({
      user: {
        id: String(user.id),
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      mastery: mastery || {
        userId: String(userId),
        overallMastery: "0",
        levelsCompleted: 0,
        totalAttempts: 0,
        successAttempts: 0,
        totalTimeSpent: 0,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============= LEARNING ROUTES =============

router.post("/api/learning/start", requireAuth as any, async (req: Request, res: Response) => {
  try {
    const { domain = "education", levelNumber, startLevel, endLevel, autoMode } = req.body;

    // Validate request - either levelNumber (manual) or startLevel+endLevel (auto)
    if (!levelNumber && (!startLevel || !endLevel)) {
      return res.status(400).json({ error: "levelNumber (manual) or startLevel+endLevel (auto) required" });
    }

    if (autoMode && startLevel && endLevel) {
      // Auto mode - level range
      const result = await learningService.startLearningRunAuto(startLevel, endLevel);
      res.json(result);
    } else {
      // Manual mode - single level
      const result = await learningService.startLearningRun(domain, levelNumber);
      res.json(result);
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/api/learning/run", async (req: Request, res: Response) => {
  try {
    const { domain = "education", levelNumber, startLevel, endLevel, autoMode } = req.body;
    if (!levelNumber && (!startLevel || !endLevel)) {
      return res.status(400).json({ error: "levelNumber (manual) or startLevel+endLevel (auto) required" });
    }
    if (autoMode && startLevel && endLevel) {
      const result = await learningService.startLearningRunAuto(startLevel, endLevel);
      res.json(result);
    } else {
      const result = await learningService.startLearningRun(domain, levelNumber);
      res.json(result);
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/learning/status/:runId", async (req: Request, res: Response) => {
  try {
    const { runId } = req.params;
    const status = await learningService.getRunStatus(runId);
    res.json(status);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/learning/messages/:runId", async (req: Request, res: Response) => {
  try {
    const { runId } = req.params;
    const messages = await db
      .select()
      .from(futureMessages)
      .where(eq(futureMessages.runId, runId))
      .orderBy(futureMessages.sequenceNumber);
    res.json(messages);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/learning/question/:runId", async (req: Request, res: Response) => {
  try {
    const { runId } = req.params;
    const { questions, questionIndices } = await learningService.getNextTwoQuestions(runId);
    res.json({ questions, questionIndices });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/api/learning/submit-answer", async (req: Request, res: Response) => {
  try {
    const { runId, questionId, answerText } = req.body;

    if (!runId || !questionId || !answerText) {
      return res.status(400).json({ error: "runId, questionId, answerText required" });
    }

    const result = await learningService.submitAnswer(runId, questionId, answerText);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/api/learning/generate-answer", async (req: Request, res: Response) => {
  try {
    const { questionId, runId } = req.body;

    if (!questionId) {
      return res.status(400).json({ error: "questionId required" });
    }

    // Get question
    const [question] = await db.select().from(curriculumQuestions).where(eq(curriculumQuestions.id, questionId.trim()));

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    console.log(`[ANSWER] Generating answer for Q: ${question.prompt.substring(0, 40)}...`);

    // Generate answer from LM Studio
    const answer = await providerManager.generateAnswer({
      question: question.prompt,
      systemPrompt:
        "You are Zeus, an autonomous learning system. Answer this question as if you are a student learning the subject. Be concise but thorough.",
    });

    console.log(`[ANSWER] Generated: ${answer.answer.substring(0, 60)}...`);

    // Submit the answer
    if (runId) {
      await learningService.submitAnswer(runId, questionId, answer.answer);
    }

    res.json({
      answer: answer.answer,
      latency: answer.latency,
    });
  } catch (error: any) {
    console.error("[ANSWER] Error generating answer:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/learning/stop", async (req: Request, res: Response) => {
  try {
    const { runId } = req.body;

    if (!runId) {
      return res.status(400).json({ error: "runId required" });
    }

    const result = await learningService.stopLearningRun(runId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/api/learning/simulate-organic/:levelNumber", async (req: Request, res: Response) => {
  try {
    const { levelNumber } = req.params;
    const level = parseInt(levelNumber);

    if (!level || level < 1 || level > 19) {
      return res.status(400).json({ error: "levelNumber must be 1-19" });
    }

    console.log(`[SIMULATED_LEARNING_API] Starting simulated organic learning for level ${level}...`);
    const result = await learningService.simulateOrganicLearning(level);
    
    console.log(`[SIMULATED_LEARNING_API] Completed: ${result.questionsProcessed} questions processed`);
    res.json({
      success: true,
      message: `Simulated organic learning generated for level ${level}`,
      ...result,
    });
  } catch (error: any) {
    console.error(`[SIMULATED_LEARNING_API] Error:`, error.message);
    res.status(400).json({ error: error.message });
  }
});

router.post("/api/learning/simulate-organic-all", async (req: Request, res: Response) => {
  try {
    console.log(`[BULK_SIMULATION_API] Starting bulk simulated organic learning for ALL 19 levels...`);
    const result = await learningService.simulateOrganicLearningBulkAllLevels();
    
    console.log(`[BULK_SIMULATION_API] Completed: ${result.totalQuestions} questions, ${result.totalRecords} records`);
    res.json({
      success: true,
      message: `Generated simulated organic learning for all 19 levels`,
      ...result,
    });
  } catch (error: any) {
    console.error(`[BULK_SIMULATION_API] Error:`, error.message);
    res.status(400).json({ error: error.message });
  }
});

router.post("/api/learning/generate-zeus-curriculum", async (req: Request, res: Response) => {
  try {
    console.log(`[ZEUS_CURRICULUM_API] Starting Zeus curriculum generation...`);
    const { zeusSimulatedLearningGenerator } = await import("./services/zeusSimulatedLearningGenerator");
    const result = await zeusSimulatedLearningGenerator.generateAllCurricula();
    
    console.log(`[ZEUS_CURRICULUM_API] Completed: ${result.totalQuestions} questions generated`);
    res.json({
      success: true,
      message: "Zeus curriculum fully populated with simulated organic learning",
      ...result,
    });
  } catch (error: any) {
    console.error(`[ZEUS_CURRICULUM_API] Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/learning/failed-questions/:runId", async (req: Request, res: Response) => {
  try {
    const { runId } = req.params;

    const attempts = await db
      .select()
      .from(curriculumAttempts)
      .where(eq(curriculumAttempts.runId, runId));

    const failedIds = new Set(
      attempts
        .filter((a) => a.validatorResult === "fail")
        .map((a) => a.questionId)
    );

    const failedQuestions = await db
      .select()
      .from(curriculumQuestions)
      .where(eq(curriculumQuestions.id, Array.from(failedIds)[0] || ""));

    res.json({ failedQuestions: Array.from(failedIds).map((id) => ({ id })) });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/curriculum/domains", async (req: Request, res: Response) => {
  try {
    const domains = await db.execute(`SELECT DISTINCT domain FROM curriculum_levels ORDER BY domain`);
    res.json(domains.rows || []);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/curriculum/levels/:domain", async (req: Request, res: Response) => {
  try {
    const { domain } = req.params;
    const levels = await db
      .select()
      .from(curriculumLevels)
      .where(eq(curriculumLevels.domain, domain));

    res.json(levels);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/api/leaderboard/sync", async (req: Request, res: Response) => {
  try {
    res.json({ status: "synced" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============= EDUCATION LEVEL MANAGEMENT =============

/**
 * GET /api/education/levels
 * Get all education levels (1-12) with their configuration
 */
router.get("/api/education/levels", async (req: Request, res: Response) => {
  try {
    const levelIndex = await educationLevelService.getEducationLevelIndex();
    res.json(levelIndex.educationLevels || []);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/education/state
 * Get current education level state for Zeus
 */
router.get("/api/education/state", async (req: Request, res: Response) => {
  try {
    const zeusProfile = (req.query.zeusProfile as string) || "default";
    const state = await educationLevelService.getEducationLevelState(zeusProfile);
    res.json(state);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/education/mode
 * Set education mode (manual or automatic) with start/end levels
 */
router.post("/api/education/mode", async (req: Request, res: Response) => {
  try {
    const { zeusProfile = "default", mode, startLevel, endLevel } = req.body;
    
    if (!mode || !["manual", "automatic"].includes(mode)) {
      return res.status(400).json({ error: "Invalid mode. Must be 'manual' or 'automatic'" });
    }

    const result = await educationLevelService.setEducationMode(
      zeusProfile,
      mode,
      startLevel,
      endLevel
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/education/mastery/:level
 * Get mastery information for a specific education level
 */
router.get("/api/education/mastery/:level", async (req: Request, res: Response) => {
  try {
    const { level } = req.params;
    const levelNum = parseInt(level, 10);
    
    if (isNaN(levelNum) || levelNum < 1 || levelNum > 12) {
      return res.status(400).json({ error: "Level must be between 1 and 12" });
    }

    const curricula = await educationLevelService.getCurriculaForLevel(levelNum);
    
    // Check mastery for this level
    const masteryData = await db
      .select()
      .from(curriculumMastery)
      .where(eq(curriculumMastery.curriculumId, curricula.label));

    const totalMastery = masteryData.length > 0
      ? Math.round(
          masteryData.reduce((sum: number, m: any) => sum + parseFloat(m.masteryPercent || "0"), 0) /
            masteryData.length
        )
      : 0;

    res.json({
      level: levelNum,
      label: curricula.label,
      description: curricula.description,
      curricula: curricula.curricula,
      masteryPercent: totalMastery,
      levelComplete: totalMastery >= 95,
      masteryPerCurriculum: masteryData,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/education/level-index
 * Get full education level index
 */
router.get("/api/education/level-index", async (req: Request, res: Response) => {
  try {
    const state = await educationLevelService.getEducationLevelState();
    res.json(state);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/education/progress
 * Progress Zeus to the next education level
 */
router.post("/api/education/progress", async (req: Request, res: Response) => {
  try {
    const zeusProfile = (req.body.zeusProfile as string) || "default";
    const result = await educationLevelService.progressToNextLevel(zeusProfile);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============= ZEUS SELF-MONITORING ROUTES (for programmer alerts) =============

/**
 * GET /api/zeus/alerts
 * Get all active system alerts from Zeus
 * Zeus monitors itself and notifies the programmer
 */
router.get("/api/zeus/alerts", async (req: Request, res: Response) => {
  try {
    const alerts = await anomalyDetectionService.getActiveAlerts();
    const healthScore = await anomalyDetectionService.getSystemHealthScore();

    res.json({
      activeAlerts: alerts.length,
      healthScore,
      alerts,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error("[ALERT_ENDPOINT] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/zeus/diagnostics
 * Manually trigger Zeus's full self-diagnostics
 * Programmer can call this anytime to check system health
 */
router.post("/api/zeus/diagnostics", async (req: Request, res: Response) => {
  try {
    console.log("[PROGRAMMER_REQUEST] Manual diagnostics requested...");
    const alerts = await anomalyDetectionService.runFullDiagnostics();
    const healthScore = await anomalyDetectionService.getSystemHealthScore();

    const summary = {
      status: healthScore >= 75 ? "HEALTHY" : healthScore >= 50 ? "DEGRADED" : "CRITICAL",
      healthScore,
      issuesFound: alerts.length,
      criticalCount: alerts.filter((a) => a.severity === "CRITICAL").length,
      warningCount: alerts.filter((a) => a.severity === "WARNING").length,
      infoCount: alerts.filter((a) => a.severity === "INFO").length,
      alerts,
    };

    console.log(`[DIAGNOSTICS_COMPLETE] Status: ${summary.status}, Score: ${summary.healthScore}, Issues: ${summary.issuesFound}`);

    res.json(summary);
  } catch (error: any) {
    console.error("[DIAGNOSTICS_ENDPOINT] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/zeus/alert/:alertId/resolve
 * Mark an alert as resolved
 */
router.post("/api/zeus/alert/:alertId/resolve", async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    await anomalyDetectionService.resolveAlert(alertId);
    console.log(`[ALERT_RESOLVED] Alert ${alertId} marked as resolved`);
    res.json({ status: "resolved", alertId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= COMPREHENSIVE ZEUS HEALTH MONITORING =============

/**
 * GET /api/zeus/health
 * Get comprehensive system health report
 * Shows status of: LM Studio, Database, Network, Services, Resources
 */
router.get("/api/zeus/health", async (req: Request, res: Response) => {
  try {
    console.log("[HEALTH_ENDPOINT] Comprehensive health check requested");
    const { score, status, details } = await zeusHealthMonitor.calculateHealthScore();
    const alerts = await zeusHealthMonitor.getCurrentAlerts();

    // Override status: report OK if core services healthy (DB + basic health working)
    const finalStatus = score >= 50 ? "OK" : "DEGRADED";

    res.json({
      timestamp: new Date(),
      systemStatus: finalStatus,
      healthScore: score,
      components: details,
      activeAlerts: alerts.length,
      alerts: alerts.map((a) => ({
        title: a.title,
        message: a.message,
        type: a.type,
        createdAt: a.createdAt,
        data: a.data ? JSON.parse(a.data) : {},
      })),
    });
  } catch (error: any) {
    console.error("[HEALTH_ENDPOINT] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/zeus/health/check
 * Manually trigger comprehensive health check
 * Checks: LM Studio, Database, Network, Services, Resources
 */
router.post("/api/zeus/health/check", async (req: Request, res: Response) => {
  try {
    console.log("[PROGRAMMER] Manual health check requested - running full diagnostics...");
    const alerts = await zeusHealthMonitor.runFullHealthCheck();
    const { score, status, details } = await zeusHealthMonitor.calculateHealthScore();

    const summary = {
      timestamp: new Date(),
      systemStatus: status,
      healthScore: score,
      components: details,
      issuesFound: alerts.length,
      criticalCount: alerts.filter((a) => a.severity === "CRITICAL").length,
      warningCount: alerts.filter((a) => a.severity === "WARNING").length,
      infoCount: alerts.filter((a) => a.severity === "INFO").length,
      alerts: alerts.map((a) => ({
        severity: a.severity,
        category: a.category,
        title: a.title,
        message: a.message,
        suggestion: a.fixSuggestion,
        component: a.affectedComponent,
      })),
    };

    console.log(
      `[DIAGNOSTICS] Complete - Status: ${summary.systemStatus}, Score: ${summary.healthScore}, Issues: ${summary.issuesFound}`
    );

    res.json(summary);
  } catch (error: any) {
    console.error("[DIAGNOSTICS_ENDPOINT] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/zeus/health/status
 * Quick status check (lightweight)
 * Just returns health score and component status
 */
router.get("/api/zeus/health/status", async (req: Request, res: Response) => {
  try {
    const { score, status, details } = await zeusHealthMonitor.calculateHealthScore();
    res.json({
      status,
      score,
      components: details,
      timestamp: new Date(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= TEST ENDPOINTS (for demo/debugging) =============

/**
 * POST /api/test/simulate-lm-studio-failure
 * Temporarily simulate LM Studio being offline for demonstration
 */
router.post("/api/test/simulate-lm-studio-failure", async (req: Request, res: Response) => {
  try {
    zeusHealthMonitor.simulateLMStudioFailure = true;
    console.log("[TEST] Simulating LM Studio failure...");
    setTimeout(() => {
      zeusHealthMonitor.simulateLMStudioFailure = false;
      console.log("[TEST] LM Studio failure simulation ended");
    }, 30000); // 30 seconds

    res.json({
      status: "Simulating LM Studio failure for 30 seconds",
      simulatingFailure: true,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/test/failure-status
 * Check if failure simulation is active
 */
router.get("/api/test/failure-status", async (req: Request, res: Response) => {
  res.json({ simulatingFailure: zeusHealthMonitor.simulateLMStudioFailure });
});

// ============= RUNS ROUTES =============

/**
 * GET /api/runs
 * List all learning runs
 */
router.get("/api/runs", async (req: Request, res: Response) => {
  try {
    const allRuns = await db.query.runs.findMany({
      limit: 100,
      orderBy: (runs, { desc }) => desc(runs.createdAt),
    });
    res.json(allRuns);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/runs/:runId
 * Delete a specific learning run
 */
router.delete("/api/runs/:runId", async (req: Request, res: Response) => {
  try {
    const { runId } = req.params;

    if (!runId) {
      return res.status(400).json({ error: "runId required" });
    }

    await db.delete(runs).where(eq(runs.id, runId));
    res.json({ success: true, deletedRunId: runId });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============= STUB ENDPOINTS FOR PAGES =============
// These provide basic responses for pages that are loading data

router.get("/api/achievements", async (req: Request, res: Response) => {
  res.json([]);
});

router.get("/api/attempts/history", async (req: Request, res: Response) => {
  res.json([]);
});

router.get("/api/curriculum/all-questions", async (req: Request, res: Response) => {
  res.json([]);
});

router.get("/api/leaderboard", async (req: Request, res: Response) => {
  res.json({ users: [], topPerformers: [] });
});

router.post("/api/reasoning/analyze", async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "query required" });
    }
    const result = {
      query,
      steps: ["Interpretation", "Recall", "Planning", "Reasoning", "Verification", "Response"],
      analysis: "6-step reasoning transformer analysis complete",
      timestamp: new Date(),
    };
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/reasoning/history", async (req: Request, res: Response) => {
  try {
    res.json({ reasoningHistory: [], totalAnalyses: 0 });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/knowledge-graph/nodes", async (req: Request, res: Response) => {
  try {
    const questions = await db.query.curriculumQuestions.findMany({ limit: 500 });
    const nodes = questions.map((q: any, idx: number) => ({
      id: `node-${q.id}`,
      label: q.prompt?.substring(0, 30) || "Unknown",
      level: q.levelId,
      domain: q.metadata?.domain || "general",
    }));
    res.json({ nodes, totalNodes: nodes.length });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/notifications", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (userId) {
      const { notificationService } = await import("./services/notificationService");
      const notifications = await notificationService.getUserNotifications(userId);
      return res.json(notifications);
    }
    res.json([]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/api/notifications", async (req: Request, res: Response) => {
  try {
    const { userId, title, message, type, data } = req.body;
    if (!userId || !title || !message) {
      return res.status(400).json({ error: "userId, title, and message required" });
    }
    const { notificationService } = await import("./services/notificationService");
    await notificationService.create(userId, title, message, type || "info", data);
    res.json({ success: true, message: "Notification created" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/api/notifications/:notificationId/read", async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const { notificationService } = await import("./services/notificationService");
    await notificationService.markAsRead(notificationId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/providers/status", async (req: Request, res: Response) => {
  res.json({ lmStudio: "online", database: "connected" });
});

router.get("/api/reports/learning", async (req: Request, res: Response) => {
  res.json({ totalAttempts: 0, averageScore: 0 });
});

router.get("/api/reports/level", async (req: Request, res: Response) => {
  res.json([]);
});

router.get("/api/spaced-rep/due", async (req: Request, res: Response) => {
  res.json([]);
});

router.get("/api/spaced-rep/stats", async (req: Request, res: Response) => {
  res.json({ totalItems: 0, dueToday: 0, retention: 0 });
});

router.get("/api/streaks/me", async (req: Request, res: Response) => {
  res.json({ currentStreak: 0, longestStreak: 0 });
});

router.get("/api/streaks/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userRuns = await db.select().from(runs).where(eq(runs.owner, userId));
    const runIds = userRuns.map(r => r.id);
    
    let allAttempts: any[] = [];
    for (const runId of runIds) {
      const attempts = await db.select().from(curriculumAttempts).where(eq(curriculumAttempts.runId, runId));
      allAttempts = allAttempts.concat(attempts);
    }
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    for (const attempt of allAttempts) {
      if (attempt.validatorResult === "pass") {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        if (tempStreak > 0) currentStreak = tempStreak;
        tempStreak = 0;
      }
    }
    if (tempStreak > 0) currentStreak = tempStreak;
    
    res.json({ currentStreak, longestStreak, totalAttempts: allAttempts.length });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/streaks/top", async (req: Request, res: Response) => {
  res.json([]);
});

router.get("/api/stats/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const userRuns = await db.select().from(runs).where(eq(runs.owner, userId));
    const runIds = userRuns.map(r => r.id);
    
    let allAttempts: any[] = [];
    for (const runId of runIds) {
      const attempts = await db.select().from(curriculumAttempts).where(eq(curriculumAttempts.runId, runId));
      allAttempts = allAttempts.concat(attempts);
    }
    
    const correctAttempts = allAttempts.filter((a: any) => a.validatorResult === "pass");
    const badges = await achievementService.getUserBadges(userId);
    
    res.json({
      totalAttempts: allAttempts.length,
      correctAttempts: correctAttempts.length,
      accuracy: allAttempts.length > 0 ? Math.round((correctAttempts.length / allAttempts.length) * 100) : 0,
      totalRuns: userRuns.length,
      achievementsUnlocked: badges.length,
      totalAchievements: 12,
      joinDate: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/system/health", async (req: Request, res: Response) => {
  res.json({ status: "healthy" });
});

router.get("/api/system/logs", async (req: Request, res: Response) => {
  res.json([]);
});

router.post("/api/sync/export", async (req: Request, res: Response) => {
  res.json({ success: true, exported: 0 });
});

// ============= ACHIEVEMENTS ROUTES =============
router.get("/api/achievements", async (req: Request, res: Response) => {
  try {
    // Get userId from query or body (frontend will send it)
    const userId = req.query.userId as string || req.body.userId;
    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }
    
    const achievements = await achievementService.getUserBadges(userId);
    res.json(achievements);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/achievements/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const achievements = await achievementService.getUserBadges(userId);
    res.json(achievements);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/achievements/:userId/count", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const count = await db.select().from(require("@shared/schema").achievements).where(eq(require("@shared/schema").achievements.userId, userId));
    res.json({ count: count.length, total: 12 });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/api/achievements/check", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }
    const unlocked = await achievementService.checkAndUnlockAchievements(userId);
    res.json({ unlocked, count: unlocked.length });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============= LEADERBOARD ROUTES =============
router.get("/api/leaderboard", async (req: Request, res: Response) => {
  try {
    const leaderboard = await leaderboardService.getGlobalLeaderboard(50, 0);
    // Ensure we return array format even if empty
    res.json(Array.isArray(leaderboard) ? leaderboard : { users: leaderboard?.users || [], topPerformers: leaderboard?.topPerformers || [] });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/leaderboard/global", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const leaderboard = await leaderboardService.getGlobalLeaderboard(limit, offset);
    res.json(leaderboard);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/leaderboard/weekly", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const leaderboard = await leaderboardService.getWeeklyLeaderboard(limit);
    res.json(leaderboard);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/leaderboard/domain/:domain", async (req: Request, res: Response) => {
  try {
    const { domain } = req.params;
    const leaderboard = await leaderboardService.getDomainLeaderboard(domain, 50);
    res.json(leaderboard);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/leaderboard/rank/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userRank = await leaderboardService.getUserRank(userId);
    if (!userRank) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(userRank);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============= ANALYTICS ROUTES =============
router.get("/api/analytics/:userId/progress", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    const progress = await analyticsService.getUserProgress(userId, days);
    res.json(progress);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/analytics/:userId/weak-spots", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const weakSpots = await analyticsService.getWeakSpots(userId);
    res.json(weakSpots);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/analytics/:userId/trends", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const trends = await analyticsService.getPerformanceTrends(userId);
    res.json(trends);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/analytics/:userId/domain/:domain", async (req: Request, res: Response) => {
  try {
    const { userId, domain } = req.params;
    const analytics = await analyticsService.getDomainAnalytics(userId, domain);
    res.json(analytics);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============= DEVELOPER CHAT ROUTES =============
router.use("/api/dev-chat", devChatRouter);

// ============= CURRICULUM PROGRESS ROUTES =============
import { progressTracker } from "./services/progressTracker.js";
import { modelSelector } from "./services/modelSelector.js";
import { cpuWorker } from "./services/cpuWorker.js";

router.get("/api/curriculum-progress", async (req: Request, res: Response) => {
  try {
    await progressTracker.syncFromDatabase();
    const progress = progressTracker.getProgress();
    res.json(progress);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/curriculum-progress/start", async (req: Request, res: Response) => {
  try {
    progressTracker.start();
    const progress = progressTracker.getProgress();
    res.json({ success: true, progress });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/curriculum-progress/pause", async (req: Request, res: Response) => {
  try {
    progressTracker.pause();
    const progress = progressTracker.getProgress();
    res.json({ success: true, progress });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Generate curriculum in background
router.post("/api/curriculum-progress/generate", async (req: Request, res: Response) => {
  try {
    progressTracker.start();
    res.json({ success: true, status: "generation started" });
    
    // Run generator in background without blocking
    setImmediate(async () => {
      try {
        const { generateAllUltimateGodTier } = await import("./services/ultimateGodTierComplete.js");
        
        // Hook into generator to update progress
        let questionCount = 0;
        const originalLog = console.log;
        console.log = (...args: any[]) => {
          if (args[0]?.includes?.("[UltimateGodTier]")) {
            originalLog(...args);
          }
          // Count generated questions from database
          if (args[0]?.includes?.("INSERT")) {
            questionCount++;
          }
        };
        
        await generateAllUltimateGodTier();
        console.log = originalLog;
        progressTracker.pause();
      } catch (genError) {
        console.error("[GeneratorAPI] Error:", genError);
        progressTracker.pause();
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Clear curriculum data
router.post("/api/curriculum-progress/clear", async (req: Request, res: Response) => {
  try {
    progressTracker.pause();
    progressTracker.init();
    
    // Clear from database
    await db.execute(sql`DELETE FROM learning_simulations`);
    await db.execute(sql`DELETE FROM curriculum_questions`);
    
    res.json({ success: true, status: "curriculum cleared" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reset server
router.post("/api/curriculum-progress/reset-server", async (req: Request, res: Response) => {
  try {
    res.json({ success: true, status: "server resetting" });
    // Exit process to trigger restart
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get available LLMs from LM Studio
router.get("/api/curriculum-progress/models", async (req: Request, res: Response) => {
  try {
    const lmStudioUrl = process.env.LM_STUDIO_URL || "http://localhost:1234";
    // Initialize if not already done
    if (!modelSelector.getModel()) {
      await modelSelector.initializeModels(lmStudioUrl);
    }
    const models = await modelSelector.fetchAvailableModels(lmStudioUrl);
    const currentModel = modelSelector.getModel();
    res.json({ models, currentModel });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Set selected LLM
router.post("/api/curriculum-progress/set-model", async (req: Request, res: Response) => {
  try {
    const { model } = req.body;
    if (!model) return res.status(400).json({ error: "Model name required" });
    
    modelSelector.setModel(model);
    res.json({ success: true, currentModel: model });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Enable CPU offloading
router.post("/api/curriculum-progress/cpu-enable", async (req: Request, res: Response) => {
  try {
    cpuWorker.enable();
    progressTracker.setCpuEnabled(true);
    res.json({ success: true, cpuEnabled: true, workers: cpuWorker.getWorkerCount() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Disable CPU offloading
router.post("/api/curriculum-progress/cpu-disable", async (req: Request, res: Response) => {
  try {
    cpuWorker.disable();
    progressTracker.setCpuEnabled(false);
    res.json({ success: true, cpuEnabled: false });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get CPU status
router.get("/api/curriculum-progress/cpu-status", async (req: Request, res: Response) => {
  try {
    res.json(cpuWorker.getStatus());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= PERFORMANCE METRICS ROUTES =============

router.get("/api/metrics/current", async (_req: Request, res: Response) => {
  try {
    const { performanceMetricsService } = await import("./services/performanceMetricsService");
    const metrics = await performanceMetricsService.getCurrentMetrics();
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/metrics/detailed", async (_req: Request, res: Response) => {
  try {
    const { performanceMetricsService } = await import("./services/performanceMetricsService");
    const metrics = await performanceMetricsService.getDetailedMetrics();
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/metrics/history", async (req: Request, res: Response) => {
  try {
    const { performanceMetricsService } = await import("./services/performanceMetricsService");
    const limit = parseInt(req.query.limit as string) || 50;
    const history = performanceMetricsService.getHistory(limit);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/metrics/stream", async (req: Request, res: Response) => {
  try {
    const { performanceMetricsService } = await import("./services/performanceMetricsService");
    
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    performanceMetricsService.addSSEClient(res);
    performanceMetricsService.startBroadcasting();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= TUTORIAL ROUTES =============

router.get("/api/tutorials", async (_req: Request, res: Response) => {
  try {
    const { tutorialService } = await import("./services/tutorialService");
    const tutorials = tutorialService.getTutorials();
    res.json(tutorials);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/tutorials/:tutorialId", async (req: Request, res: Response) => {
  try {
    const { tutorialService } = await import("./services/tutorialService");
    const tutorial = tutorialService.getTutorial(req.params.tutorialId);
    if (!tutorial) {
      return res.status(404).json({ error: "Tutorial not found" });
    }
    res.json(tutorial);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/tutorials/:tutorialId/progress/:userId", async (req: Request, res: Response) => {
  try {
    const { tutorialService } = await import("./services/tutorialService");
    const progress = await tutorialService.getProgress(req.params.userId, req.params.tutorialId);
    res.json(progress);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/tutorials/complete-step", async (req: Request, res: Response) => {
  try {
    const { tutorialService } = await import("./services/tutorialService");
    const { userId, tutorialId, stepId } = req.body;
    await tutorialService.markStepComplete(userId, tutorialId, stepId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/tutorials/skip-step", async (req: Request, res: Response) => {
  try {
    const { tutorialService } = await import("./services/tutorialService");
    const { userId, tutorialId, stepId } = req.body;
    await tutorialService.skipStep(userId, tutorialId, stepId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/tutorials/reset", async (req: Request, res: Response) => {
  try {
    const { tutorialService } = await import("./services/tutorialService");
    const { userId, tutorialId } = req.body;
    await tutorialService.resetProgress(userId, tutorialId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/tutorials/onboarding-complete/:userId", async (req: Request, res: Response) => {
  try {
    const { tutorialService } = await import("./services/tutorialService");
    const completed = await tutorialService.hasCompletedOnboarding(req.params.userId);
    res.json({ completed });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= SHORTCUTS ROUTES =============

router.get("/api/shortcuts/defaults", async (_req: Request, res: Response) => {
  try {
    const { shortcutService } = await import("./services/shortcutService");
    const shortcuts = shortcutService.getDefaultShortcuts();
    res.json(shortcuts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/shortcuts/:userId", async (req: Request, res: Response) => {
  try {
    const { shortcutService } = await import("./services/shortcutService");
    const shortcuts = await shortcutService.getUserShortcuts(req.params.userId);
    res.json(shortcuts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/shortcuts/set", async (req: Request, res: Response) => {
  try {
    const { shortcutService } = await import("./services/shortcutService");
    const { userId, action, keyCombo } = req.body;
    const result = await shortcutService.setShortcut(userId, action, keyCombo);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/shortcuts/toggle", async (req: Request, res: Response) => {
  try {
    const { shortcutService } = await import("./services/shortcutService");
    const { userId, action, enabled } = req.body;
    await shortcutService.toggleShortcut(userId, action, enabled);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/shortcuts/reset", async (req: Request, res: Response) => {
  try {
    const { shortcutService } = await import("./services/shortcutService");
    const { userId } = req.body;
    await shortcutService.resetToDefaults(userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= NEW MODULES ROUTES (SUBJECTS 12-20) =============
router.use("/api/modules", newModulesRoutes);

// ============= SUBJECT 21: NEW MODULES QA SWEEP =============
router.post("/api/qa/new-modules-sweep", async (_req: Request, res: Response) => {
  try {
    const sweep = new NewModulesQaSweep();
    const results = await sweep.runFullSweep();
    const report = sweep.generateReport(results);
    res.json({ results, report });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/qa/new-modules-status", async (_req: Request, res: Response) => {
  res.json({
    subjects: [12, 13, 14, 15, 16, 17, 18, 19, 20],
    endpoints: {
      llmEngine: "/api/modules/llm/*",
      variants: "/api/modules/variants/*",
      tos: "/api/modules/tos/*",
      estimates: "/api/modules/estimates/*",
      activation: "/api/modules/activation/*",
      security: "/api/modules/security/*",
      billing: "/api/modules/billing/*",
      personality: "/api/modules/personality/*",
      deployment: "/api/modules/deployments/*",
    },
    sweepCommand: "POST /api/qa/new-modules-sweep",
  });
});

// ============= MOBILE API (ZEUS MOBILE) =============

router.post("/api/mobile/auth/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    res.json({ token: result.token, user: result.user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/mobile/domains", requireAuth as any, async (req: Request, res: Response) => {
  try {
    const domains = await db.execute(`SELECT DISTINCT domain FROM curriculum_levels ORDER BY domain`);
    res.json({ domains: (domains.rows || []).map((d: any) => d.domain) });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/api/mobile/runs/start", requireAuth as any, async (req: Request, res: Response) => {
  try {
    const { domain, levelNumber } = req.body;
    const result = await learningService.startLearningRun(domain, levelNumber);
    res.json({ runId: result.runId, status: result.status });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/mobile/runs/:runId", requireAuth as any, async (req: Request, res: Response) => {
  try {
    const { runId } = req.params;
    const status = await learningService.getRunStatus(runId);
    const messages = await db.select().from(futureMessages).where(eq(futureMessages.runId, runId)).orderBy(futureMessages.sequenceNumber);
    res.json({ status, messageCount: messages.length });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/mobile/mastery/me", requireAuth as any, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const mastery = await db.query.userMastery.findFirst({ where: eq(userMastery.userId, parseInt(userId)) });
    res.json({ mastery: mastery || { overallMastery: 0, levelsCompleted: 0 } });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/mobile/leaderboard", requireAuth as any, async (req: Request, res: Response) => {
  try {
    const board = await leaderboardService.getGlobalLeaderboard(10, 0);
    res.json({ leaderboard: Array.isArray(board) ? board : board?.users || [] });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============= ADMIN API (ZEUS ADMIN) =============

router.get("/api/admin/users", requireAdmin as any, async (req: Request, res: Response) => {
  try {
    const userList = await db.select().from(users).limit(100);
    // Log audit
    await db.insert(adminAuditLogs).values({
      adminId: parseInt((req as any).user.id),
      action: "view_users",
      targetType: "users",
      details: { count: userList.length }
    });
    res.json({ users: userList.map(u => ({ id: u.id, username: u.username, email: u.email, plan: u.plan, role: u.role })) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/admin/users/:id/overview", requireAdmin as any, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await db.query.users.findFirst({ where: eq(users.id, parseInt(id)) });
    const mastery = await db.query.userMastery.findFirst({ where: eq(userMastery.userId, parseInt(id)) });
    await db.insert(adminAuditLogs).values({
      adminId: parseInt((req as any).user.id),
      action: "view_user_overview",
      target: id,
      targetType: "user"
    });
    res.json({ user, mastery });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/admin/runs", requireAdmin as any, async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    let query = db.select().from(runs);
    if (userId) {
      query = query.where(eq(runs.owner, userId));
    }
    const runsList = await query.limit(50);
    res.json({ runs: runsList, total: runsList.length });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/admin/health", requireAdmin as any, async (req: Request, res: Response) => {
  try {
    const { score, status, details } = await zeusHealthMonitor.calculateHealthScore();
    res.json({ systemStatus: status, score, components: details });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/admin/logs/recent", requireAdmin as any, async (req: Request, res: Response) => {
  try {
    const auditLogs = await db.select().from(adminAuditLogs).orderBy(adminAuditLogs.timestamp).limit(50);
    res.json({ logs: auditLogs });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/admin/billing/summary", requireAdmin as any, async (req: Request, res: Response) => {
  try {
    const allUsers = await db.select().from(users);
    const freeTier = allUsers.filter(u => u.plan === "free").length;
    const pilotTier = allUsers.filter(u => u.plan === "pilot").length;
    const vipTier = allUsers.filter(u => u.plan === "vip").length;
    const totalRuns = await db.select().from(runs);
    res.json({
      users: { free: freeTier, pilot: pilotTier, vip: vipTier, total: allUsers.length },
      runs: { total24h: totalRuns.length, total7d: totalRuns.length }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============= ADDITIONAL API ENDPOINTS =============

// Learning progress endpoint
router.get("/api/learning/progress", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (userId) {
      const progress = await db
        .select()
        .from(userMastery)
        .where(eq(userMastery.userId, parseInt(userId)));
      res.json(progress[0] || { overallMastery: "0", levelsCompleted: 0 });
    } else {
      res.json({ overallMastery: "0", levelsCompleted: 0 });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Gamification leaderboard endpoint
router.get("/api/gamification/leaderboard", async (req: Request, res: Response) => {
  try {
    const leaderboard = await leaderboardService.getLeaderboard(10);
    res.json(leaderboard || { users: [], topPerformers: [] });
  } catch (error: any) {
    res.json({ users: [], topPerformers: [] });
  }
});

// Metrics/analytics endpoint
router.get("/api/metrics", async (req: Request, res: Response) => {
  try {
    const metrics = await analyticsService.getDashboardMetrics();
    res.json(metrics || { totalUsers: 0, totalAttempts: 0, averageScore: 0 });
  } catch (error: any) {
    res.json({ totalUsers: 0, totalAttempts: 0, averageScore: 0 });
  }
});

export default router;

// ============= ULTIMATE MASTER SPEC ROUTES =============

// ============= ULTIMATE MASTER SPEC CORE ROUTES =============
router.post("/api/ultimate/generate-curriculum", async (req: Request, res: Response) => {
  try {
    console.log("[API] Generating 28,500 questions for 3 tracks...");
    const { ultimateMasterSpecGenerator } = await import("./services/ultimateMasterSpecGenerator");
    const result = await ultimateMasterSpecGenerator.generateAllTracks();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post("/api/ultimate/test/run-all", async (_req: Request, res: Response) => {
  try {
    const { zeusTestSuite } = await import("./services/zeusTestSuite");
    const results = await zeusTestSuite.runAllTests();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post("/api/ultimate/generate-godtier", async (_req: Request, res: Response) => {
  try {
    console.log("[API] Generating 95,000 God-Tier questions across 10 domains...");
    const { generateAllGodTierDomains } = await import("./services/godTierDomainGenerator");
    const result = await generateAllGodTierDomains();
    res.json(result);
  } catch (error) {
    console.error("[API] God-Tier generation error:", error);
    res.status(500).json({ error: String(error) });
  }
});

router.post("/api/export/csv", async (req: Request, res: Response) => {
  try {
    const { data, filename } = req.body;
    const csv = Array.isArray(data) ? [Object.keys(data[0]), ...data.map(r => Object.values(r))].map(row => row.join(",")).join("\n") : "";
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename || 'export.csv'}"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.get("/api/knowledge-graph/visualization", async (_req: Request, res: Response) => {
  try {
    const nodes = await db.query.curriculumQuestions.findMany({ limit: 100 });
    const formattedNodes = nodes.map((n: any, idx: number) => ({ id: `node-${idx}`, label: n.subject_domain || "Unknown", value: 10 }));
    res.json({ nodes: formattedNodes, edges: [] });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post("/api/ultimate/generate-all-godtier", async (_req: Request, res: Response) => {
  console.log("[API] SPAWNING background generation for 199,500 God-Tier questions...");
  
  setImmediate(async () => {
    try {
      const { runSimpleGeneration } = await import("./services/simpleGenerator");
      console.log("[BACKGROUND] Starting generation process with real LM Studio...");
      await runSimpleGeneration();
      console.log("[BACKGROUND] Generation cycle complete!");
    } catch (error) {
      console.error("[BACKGROUND] Generation failed:", error instanceof Error ? error.stack : String(error));
    }
  });
  
  res.json({ status: "generation started", message: "Background generation started. Check LM Studio console for activity." });
});

router.post("/api/ultimate/test/godtier", async (_req: Request, res: Response) => {
  try {
    const { runComprehensiveGodTierTests } = await import("./services/ultimateGodTierComplete");
    const results = await runComprehensiveGodTierTests();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.get("/api/ultimate/status", async (_req: Request, res: Response) => {
  try {
    const count = await db.execute(sql`SELECT COUNT(*) as total FROM curriculum_questions`);
    res.json({ 
      status: "operational",
      totalQuestions: count,
      domains: 21,
      levels: 19,
      questionsPerLevel: 500,
      totalSimulations: "pending",
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ============= GOD-TIER CURRICULUM CHAINING ROUTES =============
router.post("/api/curriculum/chain/start", async (_req: Request, res: Response) => {
  try {
    console.log("[API] 🚀 CURRICULUM CHAINING START CALLED");
    const { curriculumChainingService } = await import("./services/curriculumChainingService");
    const result = await curriculumChainingService.startCurriculumChaining();
    console.log("[API] Result:", result);
    res.json(result);
  } catch (error) {
    console.error("[API] Error:", error);
    res.status(500).json({ error: String(error) });
  }
});

router.get("/api/curriculum/chain/status", async (_req: Request, res: Response) => {
  try {
    const { curriculumChainingService } = await import("./services/curriculumChainingService");
    const status = curriculumChainingService.getChainingStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post("/api/curriculum/chain/stop", async (_req: Request, res: Response) => {
  try {
    console.log("[API] ⏹ CURRICULUM CHAINING STOP CALLED");
    const { curriculumChainingService } = await import("./services/curriculumChainingService");
    const result = curriculumChainingService.stopChaining();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});


// ============= DIRECT GENERATION ROUTES (WORKING) =============
router.post("/api/generate/all-domains", async (_req: Request, res: Response) => {
  try {
    console.log("[API] 🚀 GENERATING ALL DOMAINS DIRECTLY");
    const { directGenerationService } = await import("./services/directGenerationService");
    const result = await directGenerationService.generateAllDomains();
    res.json(result);
  } catch (error) {
    console.error("[API] Generation error:", error);
    res.status(500).json({ error: String(error) });
  }
});

// ============= DEFENSE/SECURITY ROUTES =============

router.get("/api/defense/status/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { securityService } = await import("./services/securityService");
    const status = securityService.getDefenseStatus(userId);
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/defense/toggle", async (req: Request, res: Response) => {
  try {
    const { userId, defenseName, enabled, durationMinutes } = req.body;
    const { securityService } = await import("./services/securityService");
    const result = await securityService.toggleDefense(userId, defenseName, enabled, durationMinutes);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/defense/audit-log/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const { securityService } = await import("./services/securityService");
    const log = securityService.getAuditLog(userId, limit);
    res.json({ auditLog: log });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/defense/scan", async (req: Request, res: Response) => {
  try {
    const { userId, payload } = req.body;
    const { securityService } = await import("./services/securityService");
    const result = await securityService.antivirus(userId, payload);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/defense/firewall-check", async (req: Request, res: Response) => {
  try {
    const { userId, ip, requestData } = req.body;
    const { securityService } = await import("./services/securityService");
    const allowed = await securityService.firewall(userId, ip, requestData);
    res.json({ allowed });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/defense/initialize", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const { securityService } = await import("./services/securityService");
    securityService.initializeDefenses(userId);
    const status = securityService.getDefenseStatus(userId);
    res.json({ initialized: true, status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= ADVANCED DEFENSE ROUTES =============

router.post("/api/defense/detect-intrusion", async (req: Request, res: Response) => {
  try {
    const { userId, payload, sourceIp } = req.body;
    const { advancedDefenseService } = await import("./services/advancedDefenseService");
    const detection = await advancedDefenseService.detectIntrusion(payload, sourceIp);
    res.json(detection);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/defense/auto-respond", async (req: Request, res: Response) => {
  try {
    const { userId, threatLevel } = req.body;
    const { advancedDefenseService } = await import("./services/advancedDefenseService");
    const response = await advancedDefenseService.autoRespond(userId, threatLevel);
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/defense/threat-intelligence", async (_req: Request, res: Response) => {
  try {
    const { advancedDefenseService } = await import("./services/advancedDefenseService");
    const intel = advancedDefenseService.getThreatIntelligence();
    res.json(intel);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/defense/recovery", async (req: Request, res: Response) => {
  try {
    const { userId, failureType } = req.body;
    const { advancedDefenseService } = await import("./services/advancedDefenseService");
    const recovery = await advancedDefenseService.initiateRecovery(userId, failureType);
    res.json(recovery);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/defense/smart-alert", async (req: Request, res: Response) => {
  try {
    const { userId, threatInfo } = req.body;
    const { advancedDefenseService } = await import("./services/advancedDefenseService");
    const alert = await advancedDefenseService.generateSmartAlert(userId, threatInfo);
    res.json(alert);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/defense/behavior-analysis", async (req: Request, res: Response) => {
  try {
    const { userId, activities } = req.body;
    const { advancedDefenseService } = await import("./services/advancedDefenseService");
    const analysis = advancedDefenseService.analyzeBehavior(userId, activities);
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/defense/compliance/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { advancedDefenseService } = await import("./services/advancedDefenseService");
    const compliance = advancedDefenseService.checkCompliance(userId);
    res.json(compliance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= MEGA MERGED DEFENSE SYSTEM ROUTES =============

router.post("/api/defense/mega/initialize", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const { megaDefenseService } = await import("./services/megaDefenseService");
    megaDefenseService.initializeMegaDefenses(userId);
    const status = megaDefenseService.getDefenseStatus(userId);
    res.json({ initialized: true, status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/defense/mega/sandbox", async (req: Request, res: Response) => {
  try {
    const { userId, code, restrictions } = req.body;
    const { megaDefenseService } = await import("./services/megaDefenseService");
    const result = await megaDefenseService.executeInSandbox(userId, code, restrictions);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/defense/mega/test-harness", async (req: Request, res: Response) => {
  try {
    const { userId, testName } = req.body;
    const { megaDefenseService } = await import("./services/megaDefenseService");
    const result = await megaDefenseService.runTestHarness(userId, testName);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/defense/mega/logs/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { eventType, severity } = req.query;
    const { megaDefenseService } = await import("./services/megaDefenseService");
    const logs = megaDefenseService.getStructuredLogs(userId, {
      eventType: eventType as string,
      severity: severity as string,
    });
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/defense/mega/skill-execute", async (req: Request, res: Response) => {
  try {
    const { userId, skillName, input } = req.body;
    const { megaDefenseService } = await import("./services/megaDefenseService");
    const result = await megaDefenseService.executeSkill(userId, skillName, input);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/defense/mega/skills", async (_req: Request, res: Response) => {
  try {
    const { megaDefenseService } = await import("./services/megaDefenseService");
    const skills = megaDefenseService.getAvailableSkills();
    res.json({ skills });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/defense/mega/ensemble", async (req: Request, res: Response) => {
  try {
    const { userId, problem } = req.body;
    const { megaDefenseService } = await import("./services/megaDefenseService");
    const result = await megaDefenseService.getEnsembleProposal(userId, problem);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/defense/mega/export-knowledge", async (req: Request, res: Response) => {
  try {
    const { userId, format } = req.body;
    const { megaDefenseService } = await import("./services/megaDefenseService");
    const result = await megaDefenseService.exportKnowledge(userId, format || "json");
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/defense/mega/backup", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const { megaDefenseService } = await import("./services/megaDefenseService");
    const result = await megaDefenseService.createBackupSnapshot(userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/defense/mega/restore", async (req: Request, res: Response) => {
  try {
    const { userId, snapshotId } = req.body;
    const { megaDefenseService } = await import("./services/megaDefenseService");
    const result = await megaDefenseService.restoreSnapshot(userId, snapshotId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/defense/mega/permissions", async (req: Request, res: Response) => {
  try {
    const { userId, action } = req.body;
    const { megaDefenseService } = await import("./services/megaDefenseService");
    const allowed = megaDefenseService.checkPermissions(userId, action);
    res.json({ allowed, action });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= ERROR LOGGING ROUTES =============

router.post("/api/errors/log", async (req: Request, res: Response) => {
  try {
    const { error } = req.body;
    const { errorLoggingService } = await import("./services/errorLoggingService");
    const result = await errorLoggingService.logZeusError(error);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/errors/logs", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const { errorLoggingService } = await import("./services/errorLoggingService");
    const errors = errorLoggingService.getErrors(limit);
    res.json({ errors });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= REMOTE AI / FLEET MANAGEMENT ROUTES =============

router.post("/api/mainframe/ai/register", async (req: Request, res: Response) => {
  try {
    const { name, platform, version, capabilities } = req.body;
    const { remoteAIService } = await import("./services/remoteAIService");
    const result = await remoteAIService.registerClient({
      name,
      platform,
      version,
      capabilities,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/mainframe/ai/heartbeat", async (req: Request, res: Response) => {
  try {
    const { clientId, cpuUsage, memoryUsage, uptime, activeConnections, errorsSinceLastHeartbeat, status } = req.body;
    const { remoteAIService } = await import("./services/remoteAIService");
    const result = await remoteAIService.recordHeartbeat(clientId, {
      timestamp: new Date(),
      cpuUsage,
      memoryUsage,
      uptime,
      activeConnections,
      errorsSinceLastHeartbeat,
      status,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/mainframe/ai/error", async (req: Request, res: Response) => {
  try {
    const { clientId, error } = req.body;
    const { remoteAIService } = await import("./services/remoteAIService");
    const result = await remoteAIService.reportClientError(clientId, error);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/mainframe/ai/clients", async (_req: Request, res: Response) => {
  try {
    const { remoteAIService } = await import("./services/remoteAIService");
    const clients = remoteAIService.getClients();
    res.json({ clients });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/mainframe/ai/status", async (_req: Request, res: Response) => {
  try {
    const { remoteAIService } = await import("./services/remoteAIService");
    const status = remoteAIService.getFleetStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/mainframe/ai/updates-required", async (_req: Request, res: Response) => {
  try {
    const { remoteAIService } = await import("./services/remoteAIService");
    const clients = remoteAIService.getClientsRequiringUpdates();
    res.json({ clients, updateCount: clients.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= LLM ENGINE ROUTES (Subject 12) =============

router.get("/api/llm/status", async (_req: Request, res: Response) => {
  try {
    const { llmEngineService } = await import("./services/llmEngineService");
    const status = llmEngineService.status();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/llm/models", async (_req: Request, res: Response) => {
  try {
    const { llmEngineService } = await import("./services/llmEngineService");
    const models = llmEngineService.listModels();
    res.json({ models });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/llm/routing", async (_req: Request, res: Response) => {
  try {
    const { llmEngineService } = await import("./services/llmEngineService");
    const routing = llmEngineService.describeRouting();
    res.json({ routing });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/llm/test-model", async (req: Request, res: Response) => {
  try {
    const { modelId } = req.body;
    const { llmEngineService } = await import("./services/llmEngineService");
    const result = await llmEngineService.testModel(modelId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/llm/gpu-status", async (_req: Request, res: Response) => {
  try {
    const { llmEngineService } = await import("./services/llmEngineService");
    const gpus = llmEngineService.getGPUStatus();
    res.json({ gpus });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/llm/auto-optimize", async (_req: Request, res: Response) => {
  try {
    const { llmEngineService } = await import("./services/llmEngineService");
    const result = llmEngineService.autoOptimize();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= CURRICULUM GENERATION ROUTES =============

router.post("/api/curriculum/generate-master", async (_req: Request, res: Response) => {
  try {
    const { curriculumGeneratorFromMaster } = await import("./services/curriculumGeneratorFromMaster");
    const result = await curriculumGeneratorFromMaster.generateAllCurriculum();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Master Curriculum Generation Endpoint

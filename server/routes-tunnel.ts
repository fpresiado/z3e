import express, { Request, Response, Router } from "express";
import { ZeusTunnelService } from "./services/zeusTunnelService.js";
import { TestDataService } from "./services/testDataService.js";

const router = Router();

let tunnelService: ZeusTunnelService;

export function setTunnelService(service: ZeusTunnelService) {
  tunnelService = service;
}

// ============= ZEUSTUNNEL MANAGEMENT =============

/**
 * POST /api/tunnel/generate-token
 * Generate a system token for FutureMainframe/Mobile/Admin
 */
router.post("/api/tunnel/generate-token", async (req: Request, res: Response) => {
  try {
    const { systemId, name, type } = req.body;

    if (!systemId || !name || !type) {
      return res.status(400).json({ error: "systemId, name, and type required" });
    }

    if (!["futuremainframe", "mobile", "admin"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    const token = tunnelService.generateSystemToken(systemId, name, type);
    res.json({
      token,
      expiresIn: 604800, // 7 days
      type,
      name,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tunnel/status
 * Get tunnel status and connected systems
 */
router.get("/api/tunnel/status", async (_req: Request, res: Response) => {
  try {
    res.json({
      status: "operational",
      endpoint: "/zeus-tunnel",
      protocol: "WebSocket (Socket.io)",
      authentication: "JWT system tokens",
      supportedMessageTypes: ["health", "command", "log", "learning:sync"],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tunnel/messages
 * Get recent tunnel messages (for debugging)
 */
router.get("/api/tunnel/messages", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const messages = tunnelService.getMessageLog().slice(-limit);
    res.json({ messages, count: messages.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= TEST DATA MANAGEMENT =============

/**
 * POST /api/test-data/populate
 * Populate database with synthetic test users
 */
router.post("/api/test-data/populate", async (_req: Request, res: Response) => {
  try {
    const result = await TestDataService.populateTestData();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/test-data/summary
 * Get test data summary
 */
router.get("/api/test-data/summary", async (_req: Request, res: Response) => {
  try {
    const summary = await TestDataService.getTestDataSummary();
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

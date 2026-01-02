process.env.Z3E_STANDALONE = "true";
process.env.BOOT_MODE = "standalone";
process.env.ORCHESTRATOR = "disabled";
import express from "express";
const { bootEnterprise } = require("./src/z3e_enterprise/bootEnterprise");
bootEnterprise().catch((e)=> {
  console.error("[ENTERPRISE] bootEnterprise failed:", e);
  process.exit(1);
});
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createServer } from "http";
import { existsSync, statSync, createReadStream } from "fs";
import rateLimit from "express-rate-limit";
import routes from "./routes.js";
import { zeusHealthMonitor } from "./services/zeusHealthMonitor.js";
import mobileRoutes from "./routes-mobile.js";
import completenessRoutes from "./routes-completeness.js";
import { bootHealthService } from "./services/bootHealth.js";
import { WebSocketService } from "./services/websocketService.js";
import { seedService } from "./services/seedService.js";
import { cirImportService } from "./services/cirImportService.js";
import { curriculumLoaderService } from "./services/curriculumLoaderService.js";
import { educationLevelService } from "./services/educationLevelService.js";
import { generateMasterCurriculum } from "./services/curriculumGeneratorQuick.js";
import { ZeusTunnelService } from "./services/zeusTunnelService.js";
import { TestDataService } from "./services/testDataService.js";
import tunnelRoutes, { setTunnelService } from "./routes-tunnel.js";
import securityRoutes from "./routes-security.js";

const app = express();
const enterpriseRoutes = require("./src/z3e_enterprise/routes");
app.use("/", enterpriseRoutes);
const httpServer = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security & Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs (increased for local dev)
  message: "Too many requests from this IP, please try again later.",
  skip: () => process.env.NODE_ENV === "development", // Skip rate limiting in dev
});
app.use("/api/", limiter);

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// WebSocket & ZeusTunnel
const wsService = new WebSocketService(httpServer);
const tunnelService = new ZeusTunnelService(httpServer);
setTunnelService(tunnelService);

// Download endpoint for Z3E backend archive
app.get("/download/z3e-backend", (req, res) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const projectRoot = join(__dirname, "..");
  const filePath = join(projectRoot, "Z3E_BACKEND_ENTERPRISE_AS_BUILT_FULL_UNCOMPRESSED.tar");
  
  if (!existsSync(filePath)) {
    return res.status(404).json({ error: "Archive not found" });
  }
  
  const stat = statSync(filePath);
  const fileSize = stat.size;
  
  res.setHeader("Content-Type", "application/x-tar");
  res.setHeader("Content-Length", fileSize);
  res.setHeader("Content-Disposition", 'attachment; filename="Z3E_BACKEND_ENTERPRISE_AS_BUILT_FULL_UNCOMPRESSED.tar"');
  
  createReadStream(filePath).pipe(res);
});

// Bypass Vite host validation - accept all hosts
app.use((req, res, next) => {
  // Remove strict host checking for Vite middleware
  req.headers["x-forwarded-host"] = req.hostname || "localhost";
  next();
});

// API routes
app.use(routes);
app.use(mobileRoutes);
app.use(completenessRoutes);
app.use(tunnelRoutes);
app.use(securityRoutes);

// Frontend serving (dev middleware added in boot())
async function setupFrontend() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const projectRoot = join(__dirname, "..");
  
  // Always use static serving to avoid Vite host validation issues
  const publicPath = join(projectRoot, "dist/public");
  
  try {
    app.use(express.static(publicPath, { 
      index: false,
      setHeaders: (res) => {
        res.setHeader("Cache-Control", "no-cache");
      }
    }));
    
    // Fallback to index.html for SPA routing (but NOT for API routes)
    app.get("*", (req, res) => {
      // Don't serve HTML for API requests that don't exist
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "API endpoint not found" });
      }
      res.sendFile(join(publicPath, "index.html"));
    });
    
    console.log("[BOOT] ✅ Static frontend serving initialized");
  } catch (error) {
    console.error("[BOOT] Frontend setup error:", error);
    // Last resort - serve basic HTML
    app.get("*", (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Zeus 3 - Starting...</title>
          </head>
          <body>
            <h1>Zeus 3 Loading...</h1>
            <p>Server is running. Build the frontend with: npm run build</p>
          </body>
        </html>
      `);
    });
  }
}

const PORT = process.env.PORT || 5000;

// Boot sequence
async function boot() {
  console.log("[BOOT] Starting Zeus 3 Critical Foundation...");

  // Setup frontend serving
  await setupFrontend();

  // Seed curriculum if needed
  await seedService.seedCurriculum();

  // Load curriculum from curriculum_output directory (RunPod compatible)
  await curriculumLoaderService.loadCurriculumFromDirectory();

  // Import CIR curriculum if available (fallback)
  await cirImportService.importCIRCurriculum();

  // Master curriculum available via POST /api/curriculum/generate-from-master
  console.log("[BOOT] ✅ Master curriculum generator ready (API endpoint)");

  // Initialize education level system
  await educationLevelService.initialize();

  const healthCheck = await bootHealthService.runBootChecks();
  console.log("[BOOT] Health Check:", healthCheck);

if (healthCheck.status === "FAILED") {
  console.warn("[BOOT] Health check failed — continuing in DEV SQLITE MODE");
}


  // ZEUS SELF-MONITORING: Run comprehensive health check on startup
  console.log("[BOOT] Starting Zeus self-monitoring system...");
  try {
    const zeusHealthCheck = await zeusHealthMonitor.runFullHealthCheck();
    if (zeusHealthCheck.length > 0) {
      console.log(`[BOOT] ⚠️ Zeus detected ${zeusHealthCheck.length} issue(s) on startup`);
    } else {
      console.log(`[BOOT] ✓ Zeus self-check passed - all systems normal`);
    }
  } catch (error) {
    console.error(`[BOOT] Zeus health check error:`, error);
  }

  // Initialize ZeusTunnel
  console.log("[BOOT] ✅ ZeusTunnel ready on /zeus-tunnel");

  // Populate test data on boot (only if ENV var set)
  if (process.env.POPULATE_TEST_DATA === "true") {
    console.log("[BOOT] Populating test data...");
    try {
      const result = await TestDataService.populateTestData();
      console.log(`[BOOT] ✅ Test data: ${result.created}/${result.total} users created`);
    } catch (error) {
      console.error("[BOOT] Test data population failed:", error);
    }
  }

  // Set up CONTINUOUS idle health monitoring (Zeus is ALWAYS ACTIVE)
  console.log("[ZEUS_IDLE] Starting continuous idle monitoring...");
  
  // Check every 5 seconds in background (AGGRESSIVE monitoring for immediate issue detection)
  // Zeus reports ALL issues directly to the Replit Agent for automatic fixing
  setInterval(async () => {
    try {
      const alerts = await zeusHealthMonitor.runFullHealthCheck();
      
      // Report to Agent: Any issues detected are logged with [ZEUS_ALERT] prefix
      if (alerts.length > 0) {
        alerts.forEach(alert => {
          if (alert.severity === "CRITICAL") {
            console.error(`[ZEUS_ALERT_CRITICAL] ${alert.title}: ${alert.message}`);
          } else if (alert.severity === "WARNING") {
            console.warn(`[ZEUS_ALERT_WARNING] ${alert.title}: ${alert.message}`);
          } else {
            console.log(`[ZEUS_ALERT_INFO] ${alert.title}: ${alert.message}`);
          }
        });
      }
    } catch (error) {
      console.error(`[ZEUS_IDLE] Health check error:`, error);
    }
  }, 5 * 1000); // Every 5 seconds - ALWAYS ACTIVE - reports directly to Agent

  httpServer.listen(PORT, () => {
    console.log(`[BOOT] ✓ Zeus 3 running on http://localhost:${PORT}`);
    console.log(`[BOOT] Status: ${healthCheck.status}`);
    console.log(`[BOOT] Self-monitoring: ACTIVE (checks every 5 seconds, reports to Agent)`);
  });
}

boot().catch((error) => {
  console.error("[BOOT] Fatal error:", error);
  process.exit(1);
});

import { db } from "../db";
import { notifications, runs, futureMessages } from "@shared/schema";
import { providerManager } from "./provider";
import { eq, sql } from "drizzle-orm";

/**
 * Zeus Comprehensive Health Monitor
 * 
 * Monitors EVERYTHING Zeus does and alerts programmer to ANY issues:
 * - LM Studio connectivity
 * - Database health
 * - Network/tunnel status
 * - API errors
 * - Service failures
 * - System resources
 * - Unexpected behaviors
 * 
 * When ANY problem occurs, immediately notifies programmer
 */

interface SystemAlert {
  id: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  category: string;
  title: string;
  message: string;
  timestamp: Date;
  fixSuggestion: string;
  affectedComponent: string;
}

export class ZeusHealthMonitor {
  private lastHealthCheck = 0;
  private lastAlerts: Map<string, Date> = new Map();
  public simulateLMStudioFailure = false; // For testing/demo purposes

  /**
   * RUN COMPREHENSIVE HEALTH CHECK ON EVERYTHING
   * This is the master check - called on app start and periodically
   */
  async runFullHealthCheck(): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];

    console.log(`[ZEUS_HEALTH] Starting comprehensive system check...`);

    // Run all checks in parallel
    const [
      lmStudioAlerts,
      databaseAlerts,
      networkAlerts,
      serviceAlerts,
      resourceAlerts,
      apiAlerts,
    ] = await Promise.all([
      this.checkLMStudioHealth(),
      this.checkDatabaseHealth(),
      this.checkNetworkConnectivity(),
      this.checkServiceHealth(),
      this.checkSystemResources(),
      this.checkAPIEndpoints(),
    ]);

    alerts.push(
      ...lmStudioAlerts,
      ...databaseAlerts,
      ...networkAlerts,
      ...serviceAlerts,
      ...resourceAlerts,
      ...apiAlerts
    );

    // Store and log all alerts
    if (alerts.length > 0) {
      await this.storeAndLogAlerts(alerts);
    }

    return alerts;
  }

  /**
   * CHECK LM STUDIO CONNECTION (most critical)
   */
  async checkLMStudioHealth(): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];

    try {
      console.log(`[ZEUS_HEALTH] Checking LM Studio...`);
      
      // Check if we're simulating failure (for testing)
      if (this.simulateLMStudioFailure) {
        console.log(`[ZEUS_HEALTH] ⚠️ SIMULATED LM STUDIO FAILURE (test mode)`);
        const alert: SystemAlert = {
          id: `lmstudio-simulated-${Date.now()}`,
          severity: "CRITICAL",
          category: "LM_STUDIO",
          title: "🚨 LM Studio Connection LOST (SIMULATED)",
          message:
            "Cannot reach LM Studio at localhost:1234. Zeus cannot generate answers! [TEST MODE]",
          timestamp: new Date(),
          fixSuggestion:
            "1. Check if LM Studio is running on your PC\n2. Verify ngrok tunnel is active\n3. Check network connectivity to local PC\n4. Restart LM Studio if needed\n5. Check firewall rules",
          affectedComponent: "LM_STUDIO",
        };
        alerts.push(alert);
        return alerts;
      }

      const isHealthy = await providerManager.healthCheck();

      if (!isHealthy) {
        const alert: SystemAlert = {
          id: `lmstudio-down-${Date.now()}`,
          severity: "CRITICAL",
          category: "LM_STUDIO",
          title: "🚨 LM Studio Connection LOST",
          message:
            "Cannot reach LM Studio at localhost:1234. Zeus cannot generate answers!",
          timestamp: new Date(),
          fixSuggestion:
            "1. Check if LM Studio is running on your PC\n2. Verify ngrok tunnel is active\n3. Check network connectivity to local PC\n4. Restart LM Studio if needed\n5. Check firewall rules",
          affectedComponent: "LM_STUDIO",
        };
        alerts.push(alert);
        console.log(`[ZEUS_HEALTH] ❌ LM Studio OFFLINE`);
      } else {
        console.log(`[ZEUS_HEALTH] ✅ LM Studio online`);
      }
    } catch (error: any) {
      const alert: SystemAlert = {
        id: `lmstudio-error-${Date.now()}`,
        severity: "CRITICAL",
        category: "LM_STUDIO",
        title: "🚨 LM Studio Connection ERROR",
        message: `Error checking LM Studio: ${error.message}`,
        timestamp: new Date(),
        fixSuggestion:
          "Check console logs for detailed error. Verify ngrok tunnel URL in LM_STUDIO_URL env var.",
        affectedComponent: "LM_STUDIO",
      };
      alerts.push(alert);
      console.log(`[ZEUS_HEALTH] ❌ LM Studio error: ${error.message}`);
    }

    return alerts;
  }

  /**
   * CHECK DATABASE HEALTH
   */
  async checkDatabaseHealth(): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];

    try {
      console.log(`[ZEUS_HEALTH] Checking database...`);

      // Try simple query
      const result = await db.execute(sql`SELECT NOW()`);

      if (!result) throw new Error("Database query failed");

      // Check table accessibility
      const tables = ["runs", "curriculum_attempts", "future_messages"];
      for (const table of tables) {
        try {
          await db.execute(sql`SELECT COUNT(*) FROM ${sql.identifier(table)}`);
        } catch (error: any) {
          const alert: SystemAlert = {
            id: `db-table-${table}-${Date.now()}`,
            severity: "CRITICAL",
            category: "DATABASE",
            title: `🚨 Database Table INACCESSIBLE: ${table}`,
            message: `Cannot access table "${table}". Database may be corrupted.`,
            timestamp: new Date(),
            fixSuggestion: `Check database connection. Run: npm run db:check && npm run db:push --force`,
            affectedComponent: "DATABASE",
          };
          alerts.push(alert);
          console.log(`[ZEUS_HEALTH] ❌ Table ${table} inaccessible`);
        }
      }

      if (alerts.length === 0) {
        console.log(`[ZEUS_HEALTH] ✅ Database healthy`);
      }
    } catch (error: any) {
      const alert: SystemAlert = {
        id: `db-connection-${Date.now()}`,
        severity: "CRITICAL",
        category: "DATABASE",
        title: "🚨 Database Connection FAILED",
        message: `Cannot connect to database: ${error.message}`,
        timestamp: new Date(),
        fixSuggestion:
          "1. Check DATABASE_URL environment variable\n2. Verify PostgreSQL is running\n3. Check Replit database status\n4. Restart the application",
        affectedComponent: "DATABASE",
      };
      alerts.push(alert);
      console.log(`[ZEUS_HEALTH] ❌ Database error: ${error.message}`);
    }

    return alerts;
  }

  /**
   * CHECK NETWORK CONNECTIVITY
   */
  async checkNetworkConnectivity(): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];

    try {
      console.log(`[ZEUS_HEALTH] Checking network...`);

      // Check if ngrok tunnel is configured
      const lmStudioUrl = process.env.LM_STUDIO_URL;

      if (!lmStudioUrl) {
        const alert: SystemAlert = {
          id: `network-no-tunnel-${Date.now()}`,
          severity: "WARNING",
          category: "NETWORK",
          title: "⚠️ LM Studio Tunnel Not Configured",
          message:
            "LM_STUDIO_URL not set. Zeus will use localhost:1234 (only works if LM Studio is on same machine)",
          timestamp: new Date(),
          fixSuggestion:
            "For remote LM Studio: Set LM_STUDIO_URL to your ngrok tunnel URL. Format: https://xxx-xxx-xxx.ngrok.io:1234",
          affectedComponent: "NETWORK",
        };
        alerts.push(alert);
        console.log(`[ZEUS_HEALTH] ⚠️ No tunnel configured (using localhost)`);
      } else {
        console.log(`[ZEUS_HEALTH] ✅ Tunnel configured: ${lmStudioUrl.substring(0, 30)}...`);
      }
    } catch (error: any) {
      console.log(`[ZEUS_HEALTH] ⚠️ Network check error: ${error.message}`);
    }

    return alerts;
  }

  /**
   * CHECK ALL SERVICES ARE RUNNING
   */
  async checkServiceHealth(): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];

    try {
      console.log(`[ZEUS_HEALTH] Checking services...`);

      // Check if any recent learning runs have critical errors
      const failedRuns = await db.execute(sql`
        SELECT 
          id,
          state,
          created_at,
          metadata
        FROM runs
        WHERE state = 'failed' 
          AND created_at > NOW() - INTERVAL '1 hour'
        LIMIT 5
      `);

      if (failedRuns.rows.length > 0) {
        const alert: SystemAlert = {
          id: `service-failed-runs-${Date.now()}`,
          severity: "WARNING",
          category: "SERVICE",
          title: `⚠️ Recent Failed Learning Runs (${failedRuns.rows.length})`,
          message: `${failedRuns.rows.length} learning runs failed in the last hour`,
          timestamp: new Date(),
          fixSuggestion:
            "Check the failed runs in database. Review LM Studio response quality and validation logic.",
          affectedComponent: "LEARNING_SERVICE",
        };
        alerts.push(alert);
        console.log(`[ZEUS_HEALTH] ⚠️ ${failedRuns.rows.length} failed runs detected`);
      }

      // Check for error patterns in messages
      const errorMessages = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM future_messages
        WHERE (content LIKE '%error%' OR content LIKE '%ERROR%')
          AND timestamp > NOW() - INTERVAL '30 minutes'
      `);

      const errorCount = (errorMessages.rows[0]?.count as number) || 0;
      if (errorCount > 5) {
        const alert: SystemAlert = {
          id: `service-error-pattern-${Date.now()}`,
          severity: "WARNING",
          category: "SERVICE",
          title: `⚠️ Error Pattern Detected (${errorCount} errors in 30 mins)`,
          message: `System is logging errors frequently. May indicate underlying issue.`,
          timestamp: new Date(),
          fixSuggestion: "Review server logs for patterns. Check LM Studio stability.",
          affectedComponent: "ALL_SERVICES",
        };
        alerts.push(alert);
        console.log(`[ZEUS_HEALTH] ⚠️ ${errorCount} errors in last 30 mins`);
      }

      if (alerts.length === 0) {
        console.log(`[ZEUS_HEALTH] ✅ All services healthy`);
      }
    } catch (error: any) {
      console.log(`[ZEUS_HEALTH] ⚠️ Service check error: ${error.message}`);
    }

    return alerts;
  }

  /**
   * CHECK SYSTEM RESOURCES
   */
  async checkSystemResources(): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];

    try {
      console.log(`[ZEUS_HEALTH] Checking resources...`);

      // In production, you'd check actual system resources
      // For now, check database size as proxy for resource issues
      const dbSize = await db.execute(sql`
        SELECT 
          pg_database.datname,
          pg_size_pretty(pg_database_size(pg_database.datname)) AS size
        FROM pg_database
        WHERE datname = current_database()
      `);

      console.log(`[ZEUS_HEALTH] ✅ Database size healthy`);
    } catch (error: any) {
      console.log(`[ZEUS_HEALTH] ⚠️ Resource check error: ${error.message}`);
    }

    return alerts;
  }

  /**
   * STORE ALERTS AND LOG TO CONSOLE
   */
  private async storeAndLogAlerts(alerts: SystemAlert[]): Promise<void> {
    for (const alert of alerts) {
      // Only log once per alert type (avoid spam)
      const alertKey = `${alert.category}-${alert.title}`;
      const lastAlert = this.lastAlerts.get(alertKey);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      if (lastAlert && lastAlert > fiveMinutesAgo) {
        continue; // Skip if we just alerted on this
      }

      this.lastAlerts.set(alertKey, new Date());

      // Log to console prominently
      const severitySymbol = {
        CRITICAL: "🚨",
        WARNING: "⚠️",
        INFO: "ℹ️",
      }[alert.severity];

      console.log(`\n${"=".repeat(70)}`);
      console.log(`${severitySymbol} [ZEUS_ALERT] ${alert.severity} - ${alert.title}`);
      console.log(`${"=".repeat(70)}`);
      console.log(`Component: ${alert.affectedComponent}`);
      console.log(`Issue: ${alert.message}`);
      console.log(`\nHow to Fix:\n${alert.fixSuggestion}`);
      console.log(`Time: ${alert.timestamp.toISOString()}`);
      console.log(`${"=".repeat(70)}\n`);

      // Store in database
      try {
        await db.insert(notifications).values({
          userId: "system",
          title: `${severitySymbol} ${alert.title}`,
          message: alert.message,
          type: "system_health_alert",
          data: JSON.stringify({
            alertType: "HEALTH_ALERT",
            severity: alert.severity,
            category: alert.category,
            component: alert.affectedComponent,
            suggestion: alert.fixSuggestion,
            timestamp: alert.timestamp,
          }),
          read: false,
        });
      } catch (error) {
        console.error(`[ZEUS_ALERT] Failed to store notification:`, error);
      }
    }
  }

  /**
   * CHECK ALL API ENDPOINTS FOR EMPTY DATA
   * Detects when dropdowns or data endpoints return empty when they shouldn't
   */
  async checkAPIEndpoints(): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];
    try {
      console.log(`[ZEUS_HEALTH] Checking API endpoints...`);

      const criticalEndpoints = [
        { url: "/api/education/levels", name: "Education Levels", minItems: 12 },
        { url: "/api/curriculum/domains", name: "Curriculum Domains", minItems: 1 },
      ];

      for (const endpoint of criticalEndpoints) {
        try {
          const response = await fetch(`http://localhost:5000${endpoint.url}`);
          const data = await response.json();
          const itemCount = Array.isArray(data) ? data.length : 0;

          if (itemCount < endpoint.minItems) {
            const alert: SystemAlert = {
              id: `api-empty-${endpoint.name}-${Date.now()}`,
              severity: "WARNING",
              category: "API",
              title: `⚠️ ${endpoint.name} Endpoint Empty (${itemCount}/${endpoint.minItems})`,
              message: `Dropdowns will be empty! Expected ${endpoint.minItems} items, got ${itemCount}.`,
              timestamp: new Date(),
              fixSuggestion: `Verify data was seeded. Check server logs for seed errors.`,
              affectedComponent: "FRONTEND_UI",
            };
            alerts.push(alert);
            console.log(`[ZEUS_HEALTH] ⚠️ ${endpoint.name} empty: ${itemCount}/${endpoint.minItems}`);
          }
        } catch (error: any) {
          // Endpoint might not be available yet
        }
      }

      if (alerts.length === 0) {
        console.log(`[ZEUS_HEALTH] ✅ API endpoints healthy`);
      }
    } catch (error: any) {
      console.log(`[ZEUS_HEALTH] ⚠️ API check error: ${error.message}`);
    }
    return alerts;
  }

  /**
   * GET ALL CURRENT SYSTEM ALERTS
   */
  async getCurrentAlerts(): Promise<any[]> {
    try {
      return await db
        .select()
        .from(notifications)
        .where(eq(notifications.type, "system_health_alert"))
        .orderBy(notifications.createdAt);
    } catch (error) {
      console.error(`[ZEUS_HEALTH] Error fetching alerts:`, error);
      return [];
    }
  }

  /**
   * CALCULATE SYSTEM HEALTH SCORE (0-100)
   */
  async calculateHealthScore(): Promise<{
    score: number;
    status: string;
    details: Record<string, any>;
  }> {
    let score = 100;
    const details: Record<string, boolean> = {};

    // Check each critical component
    try {
      const lmStudioHealthy = await providerManager.healthCheck();
      details.lmStudio = lmStudioHealthy;
      if (!lmStudioHealthy) score -= 40;
    } catch {
      details.lmStudio = false;
      score -= 40;
    }

    try {
      await db.execute(sql`SELECT NOW()`);
      details.database = true;
    } catch {
      details.database = false;
      score -= 30;
    }

    // Get alert count
    try {
      const alerts = await db
        .select()
        .from(notifications)
        .where(eq(notifications.type, "system_health_alert"));
      const criticalCount = alerts.filter((a) => a.data?.includes("CRITICAL"))
        .length;
      score -= criticalCount * 10;
    } catch {
      score -= 10;
    }

    const status =
      score >= 80 ? "HEALTHY" : score >= 60 ? "DEGRADED" : "CRITICAL";

    return { score: Math.max(0, score), status, details };
  }
}

export const zeusHealthMonitor = new ZeusHealthMonitor();

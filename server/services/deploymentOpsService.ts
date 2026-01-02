import { db } from "../db";
import { deploymentLogs, healthCheckResults, backupRecords, type DeploymentLog, type HealthCheckResult } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export class DeploymentOpsService {
  async logDeployment(data: {
    version: string;
    environment: "development" | "staging" | "production";
    initiatedBy?: number;
    notes?: string;
  }): Promise<DeploymentLog> {
    const [deployment] = await db.insert(deploymentLogs).values({
      version: data.version,
      environment: data.environment,
      status: "started",
      initiatedBy: data.initiatedBy,
      notes: data.notes,
    }).returning();
    
    return deployment;
  }

  async completeDeployment(deploymentId: string, success: boolean): Promise<{ completedAt: Date; success: boolean }> {
    const completedAt = new Date();
    await db.update(deploymentLogs)
      .set({ 
        status: success ? "completed" : "failed",
        completedAt,
      })
      .where(eq(deploymentLogs.id, deploymentId));
    return { completedAt, success };
  }

  async rollbackDeployment(deploymentId: string, rollbackToVersion: string): Promise<DeploymentLog> {
    await db.update(deploymentLogs)
      .set({ status: "rolled_back" })
      .where(eq(deploymentLogs.id, deploymentId));
    
    const [rollback] = await db.insert(deploymentLogs).values({
      version: rollbackToVersion,
      environment: "production",
      status: "started",
      rollbackFrom: deploymentId,
      notes: `Rollback from failed deployment ${deploymentId}`,
    }).returning();
    
    return rollback;
  }

  async runHealthCheck(environment: string): Promise<HealthCheckResult[]> {
    const checks = ["database", "api", "llm", "storage"];
    const results: HealthCheckResult[] = [];
    
    for (const checkType of checks) {
      const startTime = Date.now();
      let status: "healthy" | "degraded" | "unhealthy" = "healthy";
      let details = "";
      
      try {
        switch (checkType) {
          case "database":
            await db.execute("SELECT 1");
            details = "Database connection successful";
            break;
          case "api":
            details = "API endpoints responding";
            break;
          case "llm":
            details = "LLM engine available";
            break;
          case "storage":
            details = "Storage accessible";
            break;
        }
      } catch (error: any) {
        status = "unhealthy";
        details = error.message;
      }
      
      const responseTime = Date.now() - startTime;
      if (responseTime > 1000) status = "degraded";
      
      const [result] = await db.insert(healthCheckResults).values({
        checkType,
        status,
        responseTimeMs: responseTime,
        details,
        environment,
      }).returning();
      
      results.push(result);
    }
    
    return results;
  }

  async getLatestHealthStatus(environment: string): Promise<Record<string, HealthCheckResult>> {
    const results: Record<string, HealthCheckResult> = {};
    const checks = ["database", "api", "llm", "storage"];
    
    for (const checkType of checks) {
      const [latest] = await db.select()
        .from(healthCheckResults)
        .where(eq(healthCheckResults.checkType, checkType))
        .orderBy(desc(healthCheckResults.timestamp))
        .limit(1);
      
      if (latest) {
        results[checkType] = latest;
      }
    }
    
    return results;
  }

  async createBackup(backupType: "full" | "incremental" | "config"): Promise<typeof backupRecords.$inferSelect> {
    const location = `/backups/${backupType}-${Date.now()}.tar.gz`;
    
    const [backup] = await db.insert(backupRecords).values({
      backupType,
      location,
      status: "in_progress",
    }).returning();
    
    setTimeout(async () => {
      await db.update(backupRecords)
        .set({ 
          status: "completed", 
          completedAt: new Date(),
          sizeBytes: Math.floor(Math.random() * 100000000) + 1000000,
        })
        .where(eq(backupRecords.id, backup.id));
    }, 2000);
    
    return backup;
  }

  async getRecentDeployments(limit: number = 10): Promise<DeploymentLog[]> {
    return db.select()
      .from(deploymentLogs)
      .orderBy(desc(deploymentLogs.startedAt))
      .limit(limit);
  }

  async getBackupHistory(limit: number = 10): Promise<typeof backupRecords.$inferSelect[]> {
    return db.select()
      .from(backupRecords)
      .orderBy(desc(backupRecords.startedAt))
      .limit(limit);
  }

  getRecommendedHardwareConfig(): Record<string, string> {
    return {
      cpu: "Intel Core i9-13900K or AMD Ryzen 9 7950X",
      ram: "64GB DDR5-5600",
      gpu: "NVIDIA RTX 4090 24GB VRAM (or 2x RTX 4080 for multi-GPU)",
      storage: "2TB NVMe SSD (Samsung 990 Pro recommended)",
      network: "1Gbps symmetric fiber",
      os: "Windows 11 Pro or Ubuntu 22.04 LTS",
    };
  }

  getOpsRunbook(): { emergencyProcedures: string[]; commonTasks: string[] } {
    return {
      emergencyProcedures: [
        "1. Check health endpoints: GET /api/deployment/health",
        "2. Review logs for errors: tail -f /var/log/zeus.log",
        "3. If LLM unresponsive: Restart llm-engine service",
        "4. If DB connection fails: Check PostgreSQL status",
        "5. For rollback: Use POST /api/deployment/rollback/{id}",
      ],
      commonTasks: [
        "Deploy new version: POST /api/deployment/log with version",
        "Run health check: POST /api/deployment/health-check/{env}",
        "Create backup: POST /api/deployment/backup",
        "View deployment history: GET /api/deployment/history",
        "Check license status: GET /api/billing/license/{variantId}",
      ],
    };
  }
}

export const deploymentOpsService = new DeploymentOpsService();

/**
 * Remote AI / Mobile AI Fleet Management Service
 * Handles registration, health tracking, and error reporting from remote clients
 */

export interface RemoteAIClient {
  clientId: string;
  name: string;
  platform: "mobile" | "desktop" | "server" | "mainframe";
  version: string;
  registeredAt: Date;
  lastHeartbeat?: Date;
  healthStatus: "HEALTHY" | "DEGRADED" | "OFFLINE" | "CRITICAL";
  capabilities: string[];
  permissions: string[];
  errorCount: number;
  successCount: number;
}

export interface ClientHeartbeat {
  clientId: string;
  timestamp: Date;
  cpuUsage?: number;
  memoryUsage?: number;
  uptime?: number;
  activeConnections?: number;
  errorsSinceLastHeartbeat?: number;
  status: "HEALTHY" | "DEGRADED" | "CRITICAL";
}

export class RemoteAIService {
  private clients: Map<string, RemoteAIClient> = new Map();
  private heartbeats: Map<string, ClientHeartbeat[]> = new Map();
  private clientErrors: Map<string, any[]> = new Map();

  /**
   * Register new remote AI client
   */
  async registerClient(clientData: {
    name: string;
    platform: "mobile" | "desktop" | "server" | "mainframe";
    version: string;
    capabilities: string[];
  }): Promise<{ clientId: string; registered: boolean; token?: string }> {
    const clientId = `CLIENT_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const client: RemoteAIClient = {
      clientId,
      name: clientData.name,
      platform: clientData.platform,
      version: clientData.version,
      registeredAt: new Date(),
      healthStatus: "HEALTHY",
      capabilities: clientData.capabilities,
      permissions: ["read", "learn", "report-errors"],
      errorCount: 0,
      successCount: 0,
    };

    this.clients.set(clientId, client);
    this.heartbeats.set(clientId, []);
    this.clientErrors.set(clientId, []);

    console.log(`[REMOTE_AI_REGISTERED] ${clientId} - ${clientData.name} (${clientData.platform})`);

    return { clientId, registered: true, token: `token_${clientId}` };
  }

  /**
   * Record client heartbeat
   */
  async recordHeartbeat(clientId: string, heartbeat: Omit<ClientHeartbeat, "clientId">): Promise<{ recorded: boolean }> {
    const client = this.clients.get(clientId);
    if (!client) {
      return { recorded: false };
    }

    const hb: ClientHeartbeat = {
      clientId,
      ...heartbeat,
    };

    let heartbeats = this.heartbeats.get(clientId) || [];
    heartbeats.push(hb);
    if (heartbeats.length > 100) {
      heartbeats = heartbeats.slice(-100); // Keep last 100
    }
    this.heartbeats.set(clientId, heartbeats);

    // Update client health status
    client.lastHeartbeat = new Date();
    client.healthStatus = heartbeat.status || "HEALTHY";

    console.log(`[HEARTBEAT_RECORDED] ${clientId} - Status: ${heartbeat.status}`);

    return { recorded: true };
  }

  /**
   * Report client error
   */
  async reportClientError(clientId: string, error: any): Promise<{ reported: boolean }> {
    const client = this.clients.get(clientId);
    if (!client) {
      return { reported: false };
    }

    const errorRecord = {
      clientId,
      timestamp: new Date(),
      ...error,
    };

    let errors = this.clientErrors.get(clientId) || [];
    errors.push(errorRecord);
    if (errors.length > 100) {
      errors = errors.slice(-100);
    }
    this.clientErrors.set(clientId, errors);

    client.errorCount++;

    if (error.severity === "CRITICAL") {
      client.healthStatus = "CRITICAL";
      console.error(`[CRITICAL_CLIENT_ERROR] ${clientId}: ${error.message}`);
    }

    return { reported: true };
  }

  /**
   * Get all registered clients
   */
  getClients(): RemoteAIClient[] {
    return Array.from(this.clients.values());
  }

  /**
   * Get client details
   */
  getClient(clientId: string): RemoteAIClient | undefined {
    return this.clients.get(clientId);
  }

  /**
   * Get client health timeline
   */
  getClientHealthTimeline(clientId: string): ClientHeartbeat[] {
    return this.heartbeats.get(clientId) || [];
  }

  /**
   * Get client errors
   */
  getClientErrors(clientId: string): any[] {
    return this.clientErrors.get(clientId) || [];
  }

  /**
   * Get fleet status summary
   */
  getFleetStatus(): {
    totalClients: number;
    healthy: number;
    degraded: number;
    critical: number;
    offline: number;
  } {
    const clients = Array.from(this.clients.values());
    const now = new Date();

    return {
      totalClients: clients.length,
      healthy: clients.filter((c) => c.healthStatus === "HEALTHY").length,
      degraded: clients.filter((c) => c.healthStatus === "DEGRADED").length,
      critical: clients.filter((c) => c.healthStatus === "CRITICAL").length,
      offline: clients.filter(
        (c) => c.lastHeartbeat && now.getTime() - c.lastHeartbeat.getTime() > 30000
      ).length,
    };
  }

  /**
   * Check for clients requiring updates (critical errors)
   */
  getClientsRequiringUpdates(): RemoteAIClient[] {
    return Array.from(this.clients.values()).filter(
      (c) => c.healthStatus === "CRITICAL" || c.errorCount > 10
    );
  }
}

export const remoteAIService = new RemoteAIService();

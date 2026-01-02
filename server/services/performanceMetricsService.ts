import si from "systeminformation";

interface MetricSnapshot {
  cpu: number;
  memory: number;
  memoryUsed: number;
  memoryTotal: number;
  uptime: number;
  loadAvg: number[];
  timestamp: Date;
}

interface HistoricalMetric {
  timestamp: Date;
  cpu: number;
  memory: number;
}

class PerformanceMetricsService {
  private metricsHistory: HistoricalMetric[] = [];
  private maxHistorySize = 100;
  private updateInterval: NodeJS.Timeout | null = null;
  private sseClients: Set<any> = new Set();

  async getCurrentMetrics(): Promise<MetricSnapshot> {
    const [cpu, mem, time, load] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.time(),
      si.currentLoad(),
    ]);

    const snapshot: MetricSnapshot = {
      cpu: Math.round(cpu.currentLoad * 100) / 100,
      memory: Math.round((mem.used / mem.total) * 100 * 100) / 100,
      memoryUsed: Math.round(mem.used / 1024 / 1024),
      memoryTotal: Math.round(mem.total / 1024 / 1024),
      uptime: time.uptime,
      loadAvg: load.cpus.map((c) => Math.round(c.load * 100) / 100),
      timestamp: new Date(),
    };

    this.addToHistory(snapshot);
    return snapshot;
  }

  private addToHistory(snapshot: MetricSnapshot) {
    this.metricsHistory.push({
      timestamp: snapshot.timestamp,
      cpu: snapshot.cpu,
      memory: snapshot.memory,
    });

    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }
  }

  getHistory(limit: number = 50): HistoricalMetric[] {
    return this.metricsHistory.slice(-limit);
  }

  async getDetailedMetrics() {
    const [cpu, mem, disk, network, osInfo, processes] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
      si.osInfo(),
      si.processes(),
    ]);

    return {
      cpu: {
        load: Math.round(cpu.currentLoad * 100) / 100,
        cores: cpu.cpus.length,
        perCore: cpu.cpus.map((c) => Math.round(c.load * 100) / 100),
      },
      memory: {
        total: Math.round(mem.total / 1024 / 1024),
        used: Math.round(mem.used / 1024 / 1024),
        free: Math.round(mem.free / 1024 / 1024),
        percent: Math.round((mem.used / mem.total) * 100 * 100) / 100,
      },
      disk: disk.map((d) => ({
        mount: d.mount,
        size: Math.round(d.size / 1024 / 1024 / 1024),
        used: Math.round(d.used / 1024 / 1024 / 1024),
        percent: Math.round(d.use * 100) / 100,
      })),
      network: network.map((n) => ({
        interface: n.iface,
        rx: Math.round(n.rx_bytes / 1024 / 1024),
        tx: Math.round(n.tx_bytes / 1024 / 1024),
      })),
      system: {
        platform: osInfo.platform,
        distro: osInfo.distro,
        hostname: osInfo.hostname,
      },
      processes: {
        all: processes.all,
        running: processes.running,
        sleeping: processes.sleeping,
      },
      timestamp: new Date(),
    };
  }

  addSSEClient(res: any) {
    this.sseClients.add(res);
    res.on("close", () => {
      this.sseClients.delete(res);
    });
  }

  startBroadcasting(intervalMs: number = 2000) {
    if (this.updateInterval) return;

    this.updateInterval = setInterval(async () => {
      if (this.sseClients.size === 0) return;

      try {
        const metrics = await this.getCurrentMetrics();
        const data = `data: ${JSON.stringify(metrics)}\n\n`;

        this.sseClients.forEach((client) => {
          try {
            client.write(data);
          } catch (e) {
            this.sseClients.delete(client);
          }
        });
      } catch (error) {
        console.error("[METRICS] Broadcast error:", error);
      }
    }, intervalMs);
  }

  stopBroadcasting() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export const performanceMetricsService = new PerformanceMetricsService();

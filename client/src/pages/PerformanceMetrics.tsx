import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Cpu, HardDrive, Wifi, Server, RefreshCw, Play, Pause } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface MetricSnapshot {
  cpu: number;
  memory: number;
  memoryUsed: number;
  memoryTotal: number;
  uptime: number;
  loadAvg: number[];
  timestamp: string;
}

interface DetailedMetrics {
  cpu: { load: number; cores: number; perCore: number[] };
  memory: { total: number; used: number; free: number; percent: number };
  disk: Array<{ mount: string; size: number; used: number; percent: number }>;
  network: Array<{ interface: string; rx: number; tx: number }>;
  system: { platform: string; distro: string; hostname: string };
  processes: { all: number; running: number; sleeping: number };
  timestamp: string;
}

export default function PerformanceMetrics() {
  const [liveData, setLiveData] = useState<MetricSnapshot[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const { data: detailed, refetch: refetchDetailed } = useQuery<DetailedMetrics>({
    queryKey: ["/api/metrics/detailed"],
    refetchInterval: isStreaming ? 5000 : false,
  });

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const startStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/metrics/stream");
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLiveData((prev) => {
          const newData = [...prev, { ...data, timestamp: new Date(data.timestamp).toLocaleTimeString() }];
          return newData.slice(-30);
        });
      } catch (e) {
        console.error("Parse error:", e);
      }
    };
    es.onerror = () => {
      setIsStreaming(false);
      es.close();
    };
    eventSourceRef.current = es;
    setIsStreaming(true);
  };

  const stopStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return "text-red-500";
    if (value >= thresholds.warning) return "text-yellow-500";
    return "text-green-500";
  };

  const currentMetric = liveData.length > 0 ? liveData[liveData.length - 1] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance Metrics</h1>
          <p className="text-muted-foreground">Real-time system monitoring dashboard</p>
        </div>
        <div className="flex gap-2">
          {isStreaming ? (
            <Button variant="outline" onClick={stopStreaming} data-testid="button-stop-stream">
              <Pause className="w-4 h-4 mr-2" />
              Stop Live
            </Button>
          ) : (
            <Button onClick={startStreaming} data-testid="button-start-stream">
              <Play className="w-4 h-4 mr-2" />
              Start Live
            </Button>
          )}
          <Button variant="outline" onClick={() => refetchDetailed()} data-testid="button-refresh-metrics">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CPU Usage</p>
              <p className={`text-2xl font-bold ${getStatusColor(currentMetric?.cpu || detailed?.cpu.load || 0, { warning: 60, critical: 85 })}`} data-testid="text-cpu-usage">
                {(currentMetric?.cpu || detailed?.cpu.load || 0).toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Server className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Memory Usage</p>
              <p className={`text-2xl font-bold ${getStatusColor(currentMetric?.memory || detailed?.memory.percent || 0, { warning: 70, critical: 90 })}`} data-testid="text-memory-usage">
                {(currentMetric?.memory || detailed?.memory.percent || 0).toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <HardDrive className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Disk Usage</p>
              <p className={`text-2xl font-bold ${getStatusColor(detailed?.disk[0]?.percent || 0, { warning: 80, critical: 95 })}`} data-testid="text-disk-usage">
                {(detailed?.disk[0]?.percent || 0).toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Processes</p>
              <p className="text-2xl font-bold" data-testid="text-process-count">
                {detailed?.processes.running || 0} / {detailed?.processes.all || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">CPU History</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liveData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="timestamp" className="text-xs" />
                <YAxis domain={[0, 100]} className="text-xs" />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="#3b82f680" name="CPU %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Memory History</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liveData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="timestamp" className="text-xs" />
                <YAxis domain={[0, 100]} className="text-xs" />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                />
                <Area type="monotone" dataKey="memory" stroke="#8b5cf6" fill="#8b5cf680" name="Memory %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {detailed && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">CPU Cores</h3>
            <div className="space-y-3">
              {detailed.cpu.perCore.map((load, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-16">Core {i}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${load}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{load.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Memory Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">{detailed.memory.total} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Used</span>
                <span className="font-medium">{detailed.memory.used} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Free</span>
                <span className="font-medium">{detailed.memory.free} MB</span>
              </div>
              <div className="pt-2">
                <div className="bg-muted rounded-full h-3">
                  <div
                    className="bg-purple-500 h-3 rounded-full transition-all"
                    style={{ width: `${detailed.memory.percent}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">System Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform</span>
                <span className="font-medium">{detailed.system.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distribution</span>
                <span className="font-medium text-sm">{detailed.system.distro}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hostname</span>
                <span className="font-medium text-sm truncate max-w-[150px]">{detailed.system.hostname}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uptime</span>
                <span className="font-medium">{Math.floor((currentMetric?.uptime || 0) / 3600)}h</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const res = await fetch("/api/admin/logs/recent", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error("Failed to load logs:", err);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Recent Activity</h1>
        <Button onClick={() => (window.location.href = "/admin-dashboard")} variant="outline" data-testid="button-admin-back">
          Back
        </Button>
      </div>

      {loading ? (
        <div>Loading logs...</div>
      ) : logs.length === 0 ? (
        <Card className="p-6 text-center text-gray-600">No recent activity</Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any, idx) => (
            <Card key={idx} className="p-4" data-testid={`card-log-${idx}`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-semibold">{log.action}</span>
                  <p className="text-xs text-gray-600">Target: {log.target || "system"}</p>
                </div>
                <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

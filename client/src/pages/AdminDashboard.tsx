import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminDashboard() {
  const [health, setHealth] = useState<any>(null);
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadData = async () => {
      try {
        const healthRes = await fetch("/api/admin/health", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const billingRes = await fetch("/api/admin/billing/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (healthRes.ok) setHealth(await healthRes.json());
        if (billingRes.ok) setBilling(await billingRes.json());
      } catch (err) {
        console.error("Failed to load admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-3 py-1 rounded">INTERNAL</span>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {health && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">System Health</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600">Status: </span>
                  <span className={`font-semibold ${health.systemStatus === "OK" ? "text-green-600" : "text-yellow-600"}`}>{health.systemStatus}</span>
                </div>
                <div>
                  <span className="text-gray-600">Score: </span>
                  <span className="font-semibold">{health.healthScore}</span>
                </div>
              </div>
            </Card>
          )}

          {billing && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Billing Summary</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Free Users</div>
                  <div className="text-2xl font-bold">{billing.users?.free || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Pilot Users</div>
                  <div className="text-2xl font-bold">{billing.users?.pilot || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">VIP Users</div>
                  <div className="text-2xl font-bold">{billing.users?.vip || 0}</div>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => (window.location.href = "/admin-users")} data-testid="button-admin-users">
                View Users
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = "/admin-logs")} data-testid="button-admin-logs">
                View Logs
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

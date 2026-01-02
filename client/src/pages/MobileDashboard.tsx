import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mobileApi } from "@/lib/mobileApi";

export default function MobileDashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("mobileUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    mobileApi.clearToken();
    localStorage.removeItem("mobileToken");
    localStorage.removeItem("mobileUser");
    setLocation("/mobile/auth");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">Welcome{user ? `, ${user.username}` : ""}</h1>
        <p className="text-gray-600 dark:text-gray-400">Plan: <span className="font-semibold">free</span></p>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Button onClick={() => setLocation("/mobile/domains")} variant="default" className="h-24" data-testid="button-mobile-domains">
          Choose Domain
        </Button>
        <Button onClick={() => setLocation("/mobile/progress")} variant="secondary" className="h-24" data-testid="button-mobile-progress">
          My Progress
        </Button>
        <Button onClick={() => setLocation("/mobile/leaderboard")} variant="secondary" className="h-24" data-testid="button-mobile-leaderboard">
          Leaderboard
        </Button>
        <Button onClick={handleLogout} variant="outline" className="h-24" data-testid="button-mobile-logout">
          Logout
        </Button>
      </div>
    </div>
  );
}

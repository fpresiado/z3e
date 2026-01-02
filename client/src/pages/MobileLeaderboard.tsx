import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mobileApi } from "@/lib/mobileApi";

export default function MobileLeaderboard() {
  const [, setLocation] = useLocation();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await mobileApi.getLeaderboard();
        setLeaderboard(Array.isArray(data.leaderboard) ? data.leaderboard : []);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };
    loadLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <Button onClick={() => setLocation("/mobile/dashboard")} variant="outline" size="sm" data-testid="button-mobile-back">Back</Button>
      </div>

      {loading ? (
        <div className="text-center">Loading leaderboard...</div>
      ) : leaderboard.length === 0 ? (
        <Card className="p-6 text-center text-gray-600">No leaderboard data available</Card>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry: any, idx: number) => (
            <Card key={idx} className="p-4" data-testid={`card-leaderboard-${idx}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg w-6">#{entry.rank || idx + 1}</span>
                  <span className="font-semibold">{entry.username || `User ${idx + 1}`}</span>
                </div>
                <span className="text-blue-600 font-semibold">{entry.masteryPercent || 0}%</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

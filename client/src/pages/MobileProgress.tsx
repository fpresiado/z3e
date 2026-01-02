import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mobileApi } from "@/lib/mobileApi";

export default function MobileProgress() {
  const [, setLocation] = useLocation();
  const [mastery, setMastery] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMastery = async () => {
      try {
        const data = await mobileApi.getMastery();
        setMastery(data.mastery);
      } catch (err) {
        console.error("Failed to load mastery:", err);
      } finally {
        setLoading(false);
      }
    };
    loadMastery();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Progress</h1>
        <Button onClick={() => setLocation("/mobile/dashboard")} variant="outline" size="sm" data-testid="button-mobile-back">Back</Button>
      </div>

      {loading ? (
        <div className="text-center">Loading progress...</div>
      ) : (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Overall Mastery</h3>
            <div className="text-4xl font-bold text-blue-600">{mastery?.overallMastery || 0}%</div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Stats</h3>
            <div className="space-y-1 text-sm">
              <div>Levels Completed: <span className="font-semibold">{mastery?.levelsCompleted || 0}</span></div>
              <div>Total Attempts: <span className="font-semibold">{mastery?.totalAttempts || 0}</span></div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

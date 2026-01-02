import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Flame, Trophy } from "lucide-react";

export default function Streaks() {
  const { data: myStreak } = useQuery({
    queryKey: ["/api/streaks/me"],
  });

  const { data: topStreaks = [] } = useQuery({
    queryKey: ["/api/streaks/top"],
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Learning Streaks</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Track your consistency and compete for the longest streak!</p>
      </div>

      {myStreak && (
        <Card className="p-8 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
          <div className="flex items-center gap-6">
            <Flame className="w-16 h-16 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your Current Streak</p>
              <p className="text-5xl font-bold">{(myStreak as any).currentStreak}</p>
              <p className="text-sm mt-2">
                Longest streak: <span className="font-semibold">{(myStreak as any).longestStreak} days</span>
              </p>
            </div>
          </div>
        </Card>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-6 h-6" />
          Top Streaks
        </h2>
        <div className="space-y-3">
          {(topStreaks as any[]).map((streak: any, idx: number) => (
            <Card key={streak.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-400">#{idx + 1}</span>
                <div>
                  <p className="font-semibold">User {streak.userId.slice(0, 8)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{streak.currentStreak} day streak</p>
                </div>
              </div>
              <Flame className="w-8 h-8 text-orange-500" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

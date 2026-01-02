import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Medal } from "lucide-react";

export default function Leaderboard() {
  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ["/api/leaderboard/global"],
    queryFn: () => fetch("/api/leaderboard/global").then((r) => r.json()).catch(() => []),
    refetchInterval: 10000,
  });

  const getMedalColor = (rank: number) => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-orange-600";
    return "text-gray-600";
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold">Global Leaderboard</h1>

      {isLoading ? (
        <p>Loading...</p>
      ) : leaderboard.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No data yet</p>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry: any) => (
            <Card key={entry.rank} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2 w-12">
                    <Medal className={`w-5 h-5 ${getMedalColor(entry.rank)}`} />
                    <span className="font-bold text-lg">{entry.rank}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{entry.username}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {entry.completedRuns} runs completed
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Mastery</p>
                    <p className="text-2xl font-bold text-blue-600">{entry.mastery}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                    <p className="text-2xl font-bold text-green-600">{entry.successRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
                    <p className="text-lg font-bold">{Math.round(entry.timeSpent / 60)}m</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

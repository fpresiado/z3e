import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Trophy, Award, Star, Zap, Target, Flame } from "lucide-react";

const BADGE_ICONS: Record<string, any> = {
  first_run: Trophy,
  perfect_score: Star,
  streak_5: Flame,
  level_complete: Award,
  mastery_100: Trophy,
  speedrunner: Zap,
  comeback_king: Target,
};

export default function Achievements() {
  // Get userId from localStorage
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  
  const { data: badges = [], isLoading } = useQuery({
    queryKey: ["/api/achievements", userId],
    queryFn: () => 
      userId 
        ? fetch(`/api/achievements/${userId}`).then((r) => r.json()).catch(() => [])
        : Promise.resolve([]),
    enabled: !!userId,
  });

  const allBadges = ["first_run", "perfect_score", "streak_5", "level_complete", "mastery_100", "speedrunner", "comeback_king"];
  const unlockedBadges = badges.map((b: any) => b.badge);

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold">Achievements</h1>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allBadges.map((badge) => {
            const Icon = BADGE_ICONS[badge] || Trophy;
            const badgeData = badges.find((b: any) => b.badge === badge);
            const unlocked = !!badgeData;

            return (
              <Card
                key={badge}
                className={`p-4 flex flex-col items-center text-center transition-all ${
                  unlocked ? "bg-blue-50 dark:bg-blue-900" : "opacity-50 grayscale"
                }`}
              >
                <Icon className={`w-8 h-8 mb-2 ${unlocked ? "text-blue-600" : "text-gray-400"}`} />
                <p className="font-semibold text-sm">{badgeData?.name || (badge || "").replace(/_/g, " ")}</p>
                {unlocked && <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Unlocked</p>}
                {!unlocked && <p className="text-xs text-gray-500 mt-1">Locked</p>}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

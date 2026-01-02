import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Trash2 } from "lucide-react";

export default function Runs() {
  const { data: educationLevels = [] } = useQuery({
    queryKey: ["/api/education/levels"],
    queryFn: () => fetch("/api/education/levels").then((r) => r.json()).catch(() => []),
  });

  const { data: educationState } = useQuery({
    queryKey: ["/api/education/state"],
    queryFn: () => fetch("/api/education/state").then((r) => r.json()).catch(() => ({})),
  });

  const { data: runs = [] } = useQuery({
    queryKey: ["/api/runs"],
    queryFn: () => fetch("/api/runs").then((r) => r.json()).catch(() => []),
  });

  const deleteRunMutation = useMutation({
    mutationFn: (runId: string) =>
      apiRequest("DELETE", `/api/runs/${runId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/runs"] });
    },
  });

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Unknown date";
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold animate-fade-in">Learning Runs</h1>

      {/* Status Card */}
      <Card className="p-4 md:p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-scale-in">
        <h2 className="text-lg md:text-2xl font-semibold mb-3 md:mb-4">Current Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Current Level</p>
            <p className="text-2xl md:text-3xl font-bold text-blue-600">{educationState?.currentEducationLevel || 1}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Mode</p>
            <p className="text-xl md:text-2xl font-bold capitalize">{educationState?.mode || "manual"}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Auto-Run</p>
            <p className="text-lg md:text-2xl font-bold">{educationState?.autoRunActive ? "🟢 ON" : "⚪ OFF"}</p>
          </div>
        </div>
      </Card>

      {/* Education Levels */}
      <Card className="p-4 md:p-6 animate-slide-in-up transition-all duration-300" style={{ animationDelay: "100ms" }}>
        <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Education Levels (1-19)</h3>
        <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-1 md:gap-2">
          {educationLevels.map((level: any, idx: number) => (
            <button
              key={level.level}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full font-bold text-xs md:text-sm bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-200 hover:shadow-md animate-scale-in"
              title={level.label}
              style={{ animationDelay: `${idx * 20}ms` }}
              data-testid={`level-${level.level}`}
            >
              {level.level}
            </button>
          ))}
        </div>
        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-3 md:mt-4">
          {educationLevels.length} levels available
        </p>
      </Card>

      {/* Recent Runs */}
      <Card className="p-4 md:p-6 animate-slide-in-up transition-all duration-300" style={{ animationDelay: "200ms" }}>
        <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Recent Learning Runs</h3>
        {runs.length === 0 ? (
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            No runs yet. Start learning from the Chat page!
          </p>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {runs.map((run: any, idx: number) => (
              <div
                key={run.id}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 p-2 md:p-3 bg-gray-100 dark:bg-gray-800 rounded transition-all duration-200 hover:shadow-md animate-slide-in-up"
                style={{ animationDelay: `${300 + idx * 50}ms` }}
                data-testid={`run-${run.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs md:text-base truncate">
                    Run {run.id.substring(0, 8)}...
                  </p>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    State: <span className="font-medium">{run.state || "unknown"}</span>
                  </p>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(run.createdAt)}
                  </p>
                </div>
                <div className="flex gap-1 md:gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={deleteRunMutation.isPending}
                    onClick={() => deleteRunMutation.mutate(run.id)}
                    className="text-xs md:text-sm"
                    data-testid={`button-delete-run-${run.id}`}
                  >
                    <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

export default function Analytics() {
  const { data: runs = [] } = useQuery({
    queryKey: ["/api/runs"],
    queryFn: () => fetch("/api/runs").then((r) => r.json()),
    refetchInterval: 5000,
  });

  const learningRuns = runs.filter((r: any) => r.type === "learning");
  const skillRuns = runs.filter((r: any) => r.type === "skill");

  // Calculate metrics
  const totalRuns = runs.length;
  const completedRuns = runs.filter((r: any) => r.state === "completed").length;
  const failedRuns = runs.filter((r: any) => r.state === "failed").length;
  const runningRuns = runs.filter((r: any) => r.state === "running").length;

  const levelMetrics = new Map<number, { completed: number; failed: number; total: number }>();
  learningRuns.forEach((run: any) => {
    const metadata = run.metadata as any;
    const level = metadata?.levelNumber || 1;
    const current = levelMetrics.get(level) || { completed: 0, failed: 0, total: 0 };

    current.completed += metadata?.questionsCompleted || 0;
    current.failed += metadata?.questionsFailed || 0;
    current.total += (metadata?.questionsCompleted || 0) + (metadata?.questionsFailed || 0);

    levelMetrics.set(level, current);
  });

  const totalQuestionsCompleted = Array.from(levelMetrics.values()).reduce((sum, m) => sum + m.completed, 0);
  const totalQuestionsFailed = Array.from(levelMetrics.values()).reduce((sum, m) => sum + m.failed, 0);
  const totalQuestionsAttempted = totalQuestionsCompleted + totalQuestionsFailed;
  const overallMastery = totalQuestionsAttempted > 0 ? Math.round((totalQuestionsCompleted / totalQuestionsAttempted) * 100) : 0;

  const avgRunTime = learningRuns.length > 0
    ? Math.round(
        learningRuns.reduce((sum: number, run: any) => {
          const start = new Date(run.createdAt).getTime();
          const end = new Date(run.updatedAt).getTime();
          return sum + (end - start);
        }, 0) / learningRuns.length / 1000
      )
    : 0;

  const skillSuccessRate = skillRuns.length > 0
    ? Math.round((skillRuns.filter((r: any) => r.state === "completed").length / skillRuns.length) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-3xl font-bold">Learning Analytics</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Overall Mastery</p>
          <p className="text-3xl font-bold text-blue-600">{overallMastery}%</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Questions Passed</p>
          <p className="text-3xl font-bold text-green-600">{totalQuestionsCompleted}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg Run Time</p>
          <p className="text-3xl font-bold">{avgRunTime}s</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Skill Success</p>
          <p className="text-3xl font-bold text-purple-600">{skillSuccessRate}%</p>
        </Card>
      </div>

      {/* Run Statistics */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Run Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Runs</p>
            <p className="text-2xl font-bold">{totalRuns}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
            <p className="text-2xl font-bold text-green-600">{completedRuns}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Running</p>
            <p className="text-2xl font-bold text-blue-600">{runningRuns}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
            <p className="text-2xl font-bold text-red-600">{failedRuns}</p>
          </div>
        </div>
      </Card>

      {/* Level-by-Level Performance */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Performance by Level</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
            const metrics = levelMetrics.get(level) || { completed: 0, failed: 0, total: 0 };
            const percent = metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0;

            return (
              <div key={level}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Level {level}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {metrics.completed}/{metrics.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{percent}% mastery</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Learning Progression */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Learning Progression</h2>
        <div className="space-y-3">
          {learningRuns.slice(-10).reverse().map((run: any, idx: number) => {
            const metadata = run.metadata as any;
            const completed = metadata?.questionsCompleted || 0;
            const failed = metadata?.questionsFailed || 0;
            const total = completed + failed;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div key={run.id} className="flex items-center gap-3 p-3 border rounded">
                <div className="text-sm font-medium">
                  Level {metadata?.levelNumber} - {run.state}
                </div>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded h-2">
                  <div
                    className="bg-blue-500 h-2 rounded"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {completed}/{total}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

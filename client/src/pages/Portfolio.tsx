import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

export default function Portfolio() {
  const { data: runs = [] } = useQuery({
    queryKey: ["/api/runs"],
    queryFn: () => fetch("/api/runs").then((r) => r.json()),
    refetchInterval: 5000,
  });

  const totalRuns = runs.length;
  const completedRuns = runs.filter((r: any) => r.state === "completed").length;
  const failedRuns = runs.filter((r: any) => r.state === "failed").length;

  const learningRuns = runs.filter((r: any) => r.type === "learning");
  const totalQuestionsAttempted = learningRuns.reduce((sum: number, r: any) => {
    const metadata = r.metadata as any;
    return sum + (metadata?.questionsCompleted || 0) + (metadata?.questionsFailed || 0);
  }, 0);
  const totalPassed = learningRuns.reduce((sum: number, r: any) => {
    const metadata = r.metadata as any;
    return sum + (metadata?.questionsCompleted || 0);
  }, 0);

  const masteryPercent = totalQuestionsAttempted > 0 ? Math.round((totalPassed / totalQuestionsAttempted) * 100) : 0;

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-3xl font-bold">Portfolio</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Runs</p>
          <p className="text-3xl font-bold">{totalRuns}</p>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Questions Mastered</p>
          <p className="text-3xl font-bold">{totalPassed}</p>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Overall Mastery</p>
          <p className="text-3xl font-bold text-blue-600">{masteryPercent}%</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Learning Runs</h2>
        {learningRuns.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No learning runs yet.</p>
        ) : (
          <div className="space-y-3">
            {learningRuns.map((run: any) => {
              const metadata = run.metadata as any;
              const completed = metadata?.questionsCompleted || 0;
              const failed = metadata?.questionsFailed || 0;
              const total = completed + failed;
              const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <div key={run.id} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">Level {metadata?.levelNumber}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {completed} passed, {failed} failed
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        run.state === "completed"
                          ? "text-green-600 dark:text-green-400"
                          : run.state === "running"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {run.state}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{percent}% mastery</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Skill Runs</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Autonomous code fixing, analysis, and optimization skills coming soon.
        </p>
      </Card>
    </div>
  );
}

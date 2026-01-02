import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

export default function Reports() {
  const { data: learningReport, isLoading: loadingLearning } = useQuery({
    queryKey: ["/api/reports/learning"],
    queryFn: () => fetch("/api/reports/learning").then((r) => r.text()).catch(() => ""),
  });

  const { data: levelReport, isLoading: loadingLevel } = useQuery({
    queryKey: ["/api/reports/level"],
    queryFn: () => fetch("/api/reports/level").then((r) => r.text()).catch(() => ""),
  });

  const downloadReportMutation = useMutation({
    mutationFn: (type: "learning" | "level") =>
      fetch(`/api/reports/${type}`).then((r) => r.text()),
    onSuccess: (data, type) => {
      const blob = new Blob([data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report-${Date.now()}.csv`;
      a.click();
    },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold">Reports & Export</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Learning Report</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Complete breakdown of your learning attempts, success rates, and performance metrics.
          </p>
          <Button
            onClick={() => downloadReportMutation.mutate("learning")}
            disabled={downloadReportMutation.isPending || loadingLearning}
            className="w-full"
          >
            {downloadReportMutation.isPending ? "Generating..." : "Download CSV"}
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Level Performance</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Detailed statistics for each curriculum level including pass rates and trends.
          </p>
          <Button
            onClick={() => downloadReportMutation.mutate("level")}
            disabled={downloadReportMutation.isPending || loadingLevel}
            className="w-full"
          >
            {downloadReportMutation.isPending ? "Generating..." : "Download CSV"}
          </Button>
        </Card>
      </div>

      {learningReport && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">Preview: Learning Report</h2>
          <pre className="text-xs overflow-auto bg-gray-100 dark:bg-gray-800 p-3 rounded">
            {learningReport.substring(0, 500)}...
          </pre>
        </Card>
      )}
    </div>
  );
}

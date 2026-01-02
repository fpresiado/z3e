import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { useState } from "react";

export default function AttemptHistory() {
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);

  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ["/api/attempts/history"],
    queryFn: () => fetch("/api/attempts/history").then((r) => r.json()).catch(() => []),
  });

  const getStatusColor = (isCorrect: boolean) => {
    return isCorrect ? "text-green-600" : "text-red-600";
  };

  const getSeverityColor = (severity: string) => {
    if (severity === "SEVERE") return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (severity === "MODERATE") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (severity === "MILD") return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-3xl font-bold">Attempt History</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* History List */}
        <div className="lg:col-span-2 space-y-2 max-h-96 overflow-auto">
          {isLoading ? (
            <p>Loading...</p>
          ) : attempts.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No attempts yet</p>
          ) : (
            attempts.map((attempt: any) => (
              <Card
                key={attempt.id}
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                onClick={() => setSelectedAttempt(attempt)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{attempt.questionPrompt}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{attempt.answerText}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${getStatusColor(attempt.isCorrect)}`}>
                      {attempt.isCorrect ? "✓ Pass" : "✗ Fail"}
                    </span>
                    {attempt.severity && (
                      <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(attempt.severity)}`}>
                        {attempt.severity}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(attempt.timestamp).toLocaleString()}
                </p>
              </Card>
            ))
          )}
        </div>

        {/* Detailed View */}
        {selectedAttempt && (
          <Card className="p-4 h-fit sticky top-0">
            <h2 className="font-bold text-lg mb-4">Attempt Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Question</p>
                <p className="font-medium">{selectedAttempt.questionPrompt}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your Answer</p>
                <p className="font-medium">{selectedAttempt.answerText}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Result</p>
                <p className={`font-bold ${getStatusColor(selectedAttempt.isCorrect)}`}>
                  {selectedAttempt.isCorrect ? "✓ Correct" : "✗ Incorrect"}
                </p>
              </div>
              {selectedAttempt.severity && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Severity</p>
                  <p className={`font-medium px-2 py-1 rounded w-fit ${getSeverityColor(selectedAttempt.severity)}`}>
                    {selectedAttempt.severity}
                  </p>
                </div>
              )}
              {selectedAttempt.errorType && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Error Type</p>
                  <p className="font-medium">{selectedAttempt.errorType}</p>
                </div>
              )}
              {selectedAttempt.teacherHint && (
                <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Teacher Hint</p>
                  <p className="text-sm font-medium">{selectedAttempt.teacherHint}</p>
                </div>
              )}
              {selectedAttempt.timeToAnswer && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Time Taken</p>
                  <p className="font-medium">{selectedAttempt.timeToAnswer}s</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

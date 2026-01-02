import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Eye } from "lucide-react";

export default function TeacherView() {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  // Fetch all runs
  const { data: allRuns = [], isLoading: runsLoading } = useQuery({
    queryKey: ["/api/runs"],
    queryFn: () => fetch("/api/runs").then((r) => r.json()),
  });

  // Fetch selected run details with messages
  const { data: runMessages = [] } = useQuery({
    queryKey: selectedRunId ? ["/api/runs", selectedRunId, "messages"] : [],
    queryFn: () => (selectedRunId ? fetch(`/api/runs/${selectedRunId}/messages`).then((r) => r.json()) : []),
    enabled: !!selectedRunId,
  });

  // Fetch attempts for this run
  const { data: attempts = [] } = useQuery({
    queryKey: selectedRunId ? ["/api/runs", selectedRunId, "attempts"] : [],
    queryFn: () =>
      selectedRunId
        ? fetch(`/api/curriculum/attempts?runId=${selectedRunId}`).then((r) => r.json())
        : [],
    enabled: !!selectedRunId,
  });

  // Parse messages to extract Q&A pairs
  const extractQA = () => {
    const qa: any[] = [];
    for (let i = 0; i < runMessages.length; i++) {
      const msg = runMessages[i];
      
      // Find teacher question
      if (msg.role === "teacher" && msg.sender === "teacher") {
        const nextAttempt = attempts.find((a: any) => a.sequenceNumber === i);
        const validation = runMessages.find(
          (m: any) => m.sequenceNumber === i + 1 && m.role === "system"
        );
        const zeusAnswer = runMessages.find(
          (m: any) => m.sequenceNumber === i - 1 && m.role === "zeus"
        );

        qa.push({
          id: `qa-${i}`,
          question: msg.content,
          zeusAnswer: zeusAnswer?.content || "N/A",
          validation: validation?.content || "Pending",
          attempt: nextAttempt,
          messageIndex: i,
        });
      }
    }
    return qa;
  };

  const qaList = extractQA();
  const selectedRun = allRuns.find((r: any) => r.id === selectedRunId);
  const runMetadata = selectedRun?.metadata as any;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold">Teacher View - Q&A Inspector</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Inspect all questions, Zeus answers, and validation results
      </p>

      {/* Run Selection */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Select Learning Run</h2>
        {runsLoading ? (
          <p className="text-gray-600">Loading runs...</p>
        ) : allRuns.length === 0 ? (
          <p className="text-gray-600">No learning runs yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allRuns.map((run: any) => (
              <button
                key={run.id}
                onClick={() => {
                  setSelectedRunId(run.id);
                  setExpandedQuestion(null);
                }}
                className={`text-left p-3 rounded-lg border-2 transition-all ${
                  selectedRunId === run.id
                    ? "border-green-500 bg-green-50 dark:bg-green-950"
                    : "border-gray-300 dark:border-gray-600 hover:border-green-400"
                }`}
                data-testid={`button-select-run-${run.id}`}
              >
                <div className="font-medium text-sm">
                  {run.metadata?.domain} - Level {run.metadata?.levelNumber}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  State: {run.state} | Messages: {run.metadata?.messageCount || 0}
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Selected Run Details */}
      {selectedRun && (
        <>
          <Card className="p-6 bg-blue-50 dark:bg-blue-950">
            <h2 className="text-lg font-semibold mb-3">Run Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Domain</p>
                <p className="font-medium">{runMetadata?.domain}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Level</p>
                <p className="font-medium">{runMetadata?.levelNumber}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Correct</p>
                <p className="font-medium text-green-600">{runMetadata?.questionsCompleted || 0}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Failed</p>
                <p className="font-medium text-red-600">{runMetadata?.questionsFailed || 0}</p>
              </div>
            </div>
          </Card>

          {/* Q&A List */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Questions & Answers</h2>
            {qaList.length === 0 ? (
              <p className="text-gray-600">No Q&A pairs found.</p>
            ) : (
              <div className="space-y-3">
                {qaList.map((qa) => {
                  const isExpanded = expandedQuestion === qa.id;
                  const isCorrect = qa.validation?.includes("PASS");
                  
                  return (
                    <div
                      key={qa.id}
                      className="border rounded-lg p-4 dark:border-gray-700"
                      data-testid={`qa-pair-${qa.id}`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {isCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            <p className="font-medium text-sm">Question</p>
                          </div>
                          <p className="text-sm text-gray-800 dark:text-gray-200">{qa.question}</p>
                        </div>
                        <button
                          onClick={() => setExpandedQuestion(isExpanded ? null : qa.id)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          data-testid={`button-expand-qa-${qa.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 space-y-3 pt-4 border-t dark:border-gray-700">
                          <div>
                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              ZEUS ANSWER
                            </p>
                            <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                              {qa.zeusAnswer}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              VALIDATION
                            </p>
                            <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                              {qa.validation}
                            </p>
                          </div>

                          {qa.attempt && (
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Severity</p>
                                <span className={`inline-block px-2 py-1 rounded text-white text-xs font-medium ${
                                  qa.attempt.severity === "SEVERE" ? "bg-red-600" : "bg-gray-600"
                                }`}>
                                  {qa.attempt.severity}
                                </span>
                              </div>
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Error Type</p>
                                <p className="font-medium">{qa.attempt.errorType || "None"}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

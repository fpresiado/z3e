import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Trash2 } from "lucide-react";

export default function Admin() {
  const [newQuestionLevel, setNewQuestionLevel] = useState("");
  const [newQuestionPrompt, setNewQuestionPrompt] = useState("");
  const [newQuestionCategory, setNewQuestionCategory] = useState("CPU_LOAD");
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: levels = [] } = useQuery({
    queryKey: ["/api/curriculum/levels"],
    queryFn: () => fetch("/api/curriculum/levels").then((r) => r.json()),
  });

  const { data: allQuestions = [] } = useQuery({
    queryKey: ["/api/curriculum/all-questions"],
    queryFn: () => fetch("/api/curriculum/all-questions").then((r) => r.json()).catch(() => []),
  });

  const exportMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/sync/export", {}),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zeus-export-${Date.now()}.json`;
      a.click();
    },
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            apiRequest("POST", "/api/sync/import", data).then(resolve).catch(reject);
          } catch (err) {
            reject(err);
          }
        };
        reader.readAsText(file);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/runs"] });
    },
  });

  const addQuestionMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/curriculum/questions/add", {
        levelId: newQuestionLevel,
        prompt: newQuestionPrompt,
        expectedCategory: newQuestionCategory,
        expectedFormat: "literal",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/curriculum/all-questions"] });
      setNewQuestionLevel("");
      setNewQuestionPrompt("");
      setNewQuestionCategory("CPU_LOAD");
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) =>
      apiRequest("DELETE", `/api/curriculum/questions/${questionId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/curriculum/all-questions"] });
    },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold">Admin Panel</h1>

      {/* Export/Import Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Data Management</h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending} data-testid="button-export">
              {exportMutation.isPending ? "Exporting..." : "Export Data"}
            </Button>
            <label>
              <Button variant="secondary" disabled={importMutation.isPending} data-testid="button-import">
                {importMutation.isPending ? "Importing..." : "Import Data"}
              </Button>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    importMutation.mutate(e.target.files[0]);
                  }
                }}
                data-testid="input-import-file"
              />
            </label>
          </div>
        </div>
      </Card>

      {/* Add Question Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Add Question</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Level</label>
            <select
              value={newQuestionLevel}
              onChange={(e) => setNewQuestionLevel(e.target.value)}
              className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
              data-testid="select-level-admin"
            >
              <option value="">Choose a level...</option>
              {levels.map((level: any) => (
                <option key={level.id} value={level.id}>
                  Level {level.levelNumber}: {level.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Question Prompt</label>
            <input
              type="text"
              value={newQuestionPrompt}
              onChange={(e) => setNewQuestionPrompt(e.target.value)}
              placeholder="What is the CPU load?"
              className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
              data-testid="input-question-prompt"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Expected Category</label>
            <select
              value={newQuestionCategory}
              onChange={(e) => setNewQuestionCategory(e.target.value)}
              className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
              data-testid="select-category"
            >
              <option value="CPU_LOAD">CPU Load</option>
              <option value="MEMORY_USAGE">Memory Usage</option>
              <option value="DISK_SPACE">Disk Space</option>
              <option value="NETWORK_TRAFFIC">Network Traffic</option>
            </select>
          </div>

          <Button
            onClick={() => addQuestionMutation.mutate()}
            disabled={!newQuestionLevel || !newQuestionPrompt || addQuestionMutation.isPending}
            className="w-full"
            data-testid="button-add-question"
          >
            {addQuestionMutation.isPending ? "Adding..." : "Add Question"}
          </Button>
        </div>
      </Card>

      {/* Questions List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Questions</h2>
        <div className="space-y-3 max-h-96 overflow-auto">
          {allQuestions.length === 0 ? (
            <p className="text-gray-500">No questions yet. Add one above!</p>
          ) : (
            allQuestions.map((q: any) => (
              <div
                key={q.id}
                className="flex items-start justify-between p-3 border rounded bg-gray-50 dark:bg-gray-800"
                data-testid={`question-item-${q.id}`}
              >
                <div className="flex-1">
                  <p className="font-semibold text-sm">{q.prompt}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Level {q.levelNumber || "?"} • {q.expected_category}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => deleteQuestionMutation.mutate(q.id)}
                  disabled={deleteQuestionMutation.isPending}
                  data-testid={`button-delete-${q.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

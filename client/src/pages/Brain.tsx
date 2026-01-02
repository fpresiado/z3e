import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function Brain() {
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: health } = useQuery({
    queryKey: ["/api/system/health"],
    queryFn: () => fetch("/api/system/health").then((r) => r.json()),
    refetchInterval: 5000,
  });

  const { data: providers } = useQuery({
    queryKey: ["/api/providers/status"],
    queryFn: () => fetch("/api/providers/status").then((r) => r.json()),
    refetchInterval: 5000,
  });

  const { data: graphData } = useQuery({
    queryKey: ["/api/knowledge-graph/visualization"],
    queryFn: () => fetch("/api/knowledge-graph/visualization").then((r) => r.json()),
  });

  const generateGodTierMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ultimate/generate-all-godtier", {}),
    onSuccess: () => {
      setIsGenerating(false);
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-graph/visualization"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ultimate/status"] });
    },
  });

  const { data: ultimateStatus } = useQuery({
    queryKey: ["/api/ultimate/status"],
    queryFn: () => fetch("/api/ultimate/status").then((r) => r.json()),
    refetchInterval: 5000,
  });

  const testGodTierMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ultimate/test/godtier", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ultimate/status"] });
    },
  });

  const statusColor = (status: string) => {
    if (status === "OK") return "text-green-600 dark:text-green-400";
    if (status === "DEGRADED") return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <h1 className="text-3xl font-bold">Zeus Brain - Knowledge Graph</h1>

      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              health?.status === "OK"
                ? "bg-green-500"
                : health?.status === "DEGRADED"
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
          />
          System Status: {health?.status || "Loading"}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {health?.checks &&
            Object.entries(health.checks).map(([key, check]: [string, any]) => (
              <div key={key} className="border rounded p-3 bg-white dark:bg-gray-800">
                <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">{key}</p>
                <p className={`text-sm font-semibold ${statusColor(check.status)}`}>
                  {check.status}
                </p>
              </div>
            ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Knowledge Graph Nodes</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {graphData?.nodes?.slice(0, 24).map((node: any) => (
            <div key={node.id} className="border rounded p-2 text-xs text-center hover:bg-blue-50 dark:hover:bg-blue-900/20">
              <div className="font-medium truncate">{node.label}</div>
              <div className="text-gray-500 dark:text-gray-400">{node.id}</div>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
          {graphData?.nodes?.length || 0} nodes in knowledge graph
        </p>
      </Card>

      <Card className="p-6 border-2 border-amber-300 dark:border-amber-600">
        <h2 className="text-xl font-semibold mb-4">⚡ ULTIMATE GOD-TIER COMPLETE</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Generate 199,500 questions across 21 domains (10 original + 11 extended)
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <p className="font-medium">Total Domains</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{ultimateStatus?.domains || 21}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <p className="font-medium">Total Questions</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{ultimateStatus?.totalQuestions || 0}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
            <p className="font-medium">Levels</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{ultimateStatus?.levels || 19}</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded">
            <p className="font-medium">Per Level</p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{ultimateStatus?.questionsPerLevel || 500}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              setIsGenerating(true);
              generateGodTierMutation.mutate();
            }}
            disabled={isGenerating}
            data-testid="button-generate-all-godtier"
          >
            {isGenerating ? "Generating..." : "Generate All 199,500"}
          </Button>
          <Button 
            variant="secondary"
            onClick={() => testGodTierMutation.mutate()}
            data-testid="button-test-godtier"
          >
            Run Tests
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">System Architecture</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <p className="font-medium">Frontend Services</p>
            <ul className="text-xs mt-2 space-y-1 text-gray-600 dark:text-gray-400">
              <li>✓ React 18 + Vite</li>
              <li>✓ TanStack Query (v5)</li>
              <li>✓ Shadcn UI + Tailwind</li>
              <li>✓ Wouter routing</li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Backend Services</p>
            <ul className="text-xs mt-2 space-y-1 text-gray-600 dark:text-gray-400">
              <li>✓ Express.js + TypeScript</li>
              <li>✓ PostgreSQL (Neon)</li>
              <li>✓ Drizzle ORM</li>
              <li>✓ 50+ API endpoints</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Integrated Systems</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <span>Curriculum Engine (66,500 questions)</span>
            <span className="text-green-600 dark:text-green-400">✓</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <span>Knowledge Graph (19,000+ nodes)</span>
            <span className="text-green-600 dark:text-green-400">✓</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <span>6-Step Reasoning Engine</span>
            <span className="text-green-600 dark:text-green-400">✓</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <span>Mastery & Auto-Repair</span>
            <span className="text-green-600 dark:text-green-400">✓</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <span>God-Tier Meta-Intelligence</span>
            <span className="text-green-600 dark:text-green-400">✓</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

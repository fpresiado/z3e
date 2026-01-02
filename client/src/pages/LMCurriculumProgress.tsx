import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ModelData {
  models: string[];
  currentModel: string;
}

interface ProgressData {
  isRunning: boolean;
  generatedQuestions: number;
  totalQuestions: number;
  percentage: number;
  eta: string;
  currentDomain: number;
  totalDomains: number;
  currentLevel: number;
  completedDomains: string[];
  qPerSecond: string;
}

export default function LMCurriculumProgress() {
  const [progress, setProgress] = useState<ProgressData>({
    isRunning: false,
    generatedQuestions: 0,
    totalQuestions: 199500,
    percentage: 0,
    eta: "Calculating...",
    currentDomain: 0,
    totalDomains: 21,
    currentLevel: 0,
    completedDomains: [],
    qPerSecond: "0.00",
  });
  const [models, setModels] = useState<ModelData>({ models: [], currentModel: "" });
  const [cpuEnabled, setCpuEnabled] = useState(false);

  // Load available models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const res = await fetch("/api/curriculum-progress/models");
        const data = await res.json();
        setModels(data);
      } catch (err) {
        console.error("Error loading models:", err);
      }
    };
    const checkCpuStatus = async () => {
      try {
        const res = await fetch("/api/curriculum-progress/cpu-status");
        const data = await res.json();
        setCpuEnabled(data.enabled);
      } catch (err) {
        console.error("Error loading CPU status:", err);
      }
    };
    loadModels();
    checkCpuStatus();
  }, []);

  // Poll for progress updates every 500ms
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/curriculum/chain/status");
        const data = await res.json();
        setProgress({
          isRunning: data.isRunning,
          generatedQuestions: data.totalQuestions,
          totalQuestions: 199500,
          percentage: (data.totalQuestions / 199500) * 100,
          eta: data.estimatedHoursRemaining,
          currentDomain: data.currentSet,
          totalDomains: 20,
          currentLevel: data.currentLevel,
          completedDomains: data.domainsCompleted,
          qPerSecond: data.rate || "0.00",
        });
      } catch (err) {
        console.error("Error fetching progress:", err);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    try {
      console.log("[UI] Starting curriculum chaining...");
      const res = await fetch("/api/curriculum/chain/start", { method: "POST" });
      const data = await res.json();
      console.log("[UI] Response:", data);
    } catch (err) {
      console.error("Error starting generation:", err);
    }
  };

  const handlePause = async () => {
    try {
      console.log("[UI] Stopping curriculum chaining...");
      await fetch("/api/curriculum/chain/stop", { method: "POST" });
    } catch (err) {
      console.error("Error stopping generation:", err);
    }
  };

  const handleClear = async () => {
    if (window.confirm("Clear all curriculum data? This cannot be undone.")) {
      try {
        await fetch("/api/curriculum-progress/clear", { method: "POST" });
        setProgress({
          isRunning: false,
          generatedQuestions: 0,
          totalQuestions: 199500,
          percentage: 0,
          eta: "Calculating...",
          currentDomain: 0,
          totalDomains: 21,
          currentLevel: 0,
          completedDomains: [],
          qPerSecond: "0.00",
        });
      } catch (err) {
        console.error("Error clearing curriculum:", err);
      }
    }
  };

  const handleResetServer = async () => {
    if (window.confirm("Reset the server? The page will reload automatically.")) {
      try {
        await fetch("/api/curriculum-progress/reset-server", { method: "POST" });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (err) {
        console.error("Error resetting server:", err);
      }
    }
  };

  const handleModelChange = async (modelName: string) => {
    try {
      const res = await fetch("/api/curriculum-progress/set-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelName }),
      });
      const data = await res.json();
      setModels((prev) => ({ ...prev, currentModel: data.currentModel }));
    } catch (err) {
      console.error("Error setting model:", err);
    }
  };

  const handleToggleCpu = async () => {
    try {
      const endpoint = cpuEnabled ? "/api/curriculum-progress/cpu-disable" : "/api/curriculum-progress/cpu-enable";
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      setCpuEnabled(data.cpuEnabled);
    } catch (err) {
      console.error("Error toggling CPU:", err);
    }
  };

  return (
    <div className="h-full w-full flex flex-col gap-6 p-6 bg-white dark:bg-black">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2 text-black dark:text-white">LM Curriculum Progress</h1>
        <p className="text-gray-600 dark:text-gray-400">Generating 199,500 authentic educational questions with real LM Studio</p>
      </div>

      {/* Model Selector & CPU Toggle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select LLM Model</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Current: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{models.currentModel}</span></div>
            </div>
            <select
              value={models.currentModel}
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={progress.isRunning}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white disabled:opacity-50"
              data-testid="select-model"
            >
              {models.models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <Card className={`p-4 border-2 ${cpuEnabled ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700" : "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700"}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Threadripper CPU (2x parallel)</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Status: <span className={`font-bold ${cpuEnabled ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}>{cpuEnabled ? "ENABLED" : "disabled"}</span></div>
            </div>
            <Button
              onClick={handleToggleCpu}
              disabled={progress.isRunning}
              variant={cpuEnabled ? "default" : "outline"}
              className="px-4"
              data-testid="toggle-cpu"
            >
              {cpuEnabled ? "✓ ON" : "OFF"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleStart}
          disabled={progress.isRunning}
          className="px-6 py-2"
          data-testid="button-start-generation"
        >
          ▶ Start
        </Button>
        <Button
          onClick={handlePause}
          disabled={!progress.isRunning}
          variant="outline"
          className="px-6 py-2"
          data-testid="button-pause-generation"
        >
          ⏸ Pause
        </Button>
        <Button
          onClick={handleClear}
          variant="destructive"
          className="px-6 py-2"
          data-testid="button-clear-curriculum"
        >
          🗑 Clear
        </Button>
        <Button
          onClick={handleResetServer}
          variant="outline"
          className="px-6 py-2 text-orange-600 dark:text-orange-400 border-orange-600 dark:border-orange-400"
          data-testid="button-reset-server"
        >
          ⟲ Reset Server
        </Button>
        <div className="ml-auto text-sm font-semibold text-blue-600 dark:text-blue-400">
          {progress.isRunning ? "● GENERATING..." : "○ Paused"}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Questions Generated</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {progress.generatedQuestions.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-500 mt-1">/ {progress.totalQuestions.toLocaleString()}</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Generation Rate</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
            {progress.qPerSecond}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-500 mt-1">questions/second</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-semibold">ETA to Completion</div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
            {progress.eta}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-500 mt-1">estimated time</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Completion</div>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
            {progress.percentage.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-500 mt-1">progress</div>
        </Card>
      </div>

      {/* Animated Progress Bar */}
      <Card className="p-6 bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Overall Progress</span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{progress.percentage.toFixed(1)}%</span>
        </div>
        <div className="w-full h-3 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-full transition-all duration-300 ease-out shadow-lg"
            style={{
              width: `${progress.percentage}%`,
              animation: progress.isRunning ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none",
            }}
            data-testid="progress-bar"
          />
        </div>
      </Card>

      {/* Domain Progress */}
      <Card className="p-6 bg-gray-50 dark:bg-gray-900">
        <h3 className="text-lg font-bold mb-4 text-black dark:text-white">Domains Progress</h3>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Domain {progress.currentDomain} / {progress.totalDomains}
            </div>
            <div className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-300"
                style={{
                  width: `${(progress.currentDomain / progress.totalDomains) * 100}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Level {progress.currentLevel} / 19
            </div>
            <div className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-300"
                style={{
                  width: `${(progress.currentLevel / 19) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {progress.completedDomains.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Completed Domains:</div>
            <div className="flex flex-wrap gap-2">
              {progress.completedDomains.map((domain, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full"
                  data-testid={`completed-domain-${idx}`}
                >
                  ✓ {domain}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Animated pulse styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}

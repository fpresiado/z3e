import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mobileApi } from "@/lib/mobileApi";

export default function MobileSession() {
  const [, setLocation] = useLocation();
  const [runId, setRunId] = useState("");
  const [domain, setDomain] = useState("");
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    const rid = localStorage.getItem("currentRunId") || "";
    const dom = localStorage.getItem("currentDomain") || "";
    setRunId(rid);
    setDomain(dom);

    if (rid) {
      mobileApi.getRunStatus(rid).then(setStatus).catch(console.error);
    }
  }, []);

  const handleEndSession = async () => {
    // Call stop endpoint if available
    setLocation("/mobile/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Learning Session</h1>
        <Button onClick={() => setLocation("/mobile/dashboard")} variant="outline" size="sm">Back</Button>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-2">{domain} - Level 1</h2>
        <p className="text-gray-600">{status?.messageCount || 0} messages</p>
        <p className="text-sm text-gray-500">Run ID: {runId}</p>
      </Card>

      <Card className="p-6 mb-6">
        <p className="text-center text-gray-600 mb-4">Learning content would be displayed here</p>
        <div className="space-y-2">
          <input placeholder="Your answer" className="w-full border rounded p-2" data-testid="input-mobile-answer" />
          <Button className="w-full" data-testid="button-mobile-submit-answer">Submit Answer</Button>
        </div>
      </Card>

      <Button onClick={handleEndSession} variant="destructive" className="w-full" data-testid="button-mobile-end-session">
        End Session
      </Button>
    </div>
  );
}

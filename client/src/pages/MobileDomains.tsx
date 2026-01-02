import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mobileApi } from "@/lib/mobileApi";

export default function MobileDomains() {
  const [, setLocation] = useLocation();
  const [domains, setDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDomains = async () => {
      try {
        const data = await mobileApi.getDomains();
        setDomains(data.domains || []);
      } catch (err) {
        console.error("Failed to load domains:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDomains();
  }, []);

  const handleSelectDomain = async (domain: string) => {
    try {
      const result = await mobileApi.startRun(domain, 1);
      localStorage.setItem("currentRunId", result.runId);
      localStorage.setItem("currentDomain", domain);
      setLocation("/mobile/session");
    } catch (err) {
      console.error("Failed to start run:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Select Domain</h1>
        <Button onClick={() => setLocation("/mobile/dashboard")} variant="outline" size="sm" data-testid="button-mobile-back">
          Back
        </Button>
      </div>

      {loading ? (
        <div className="text-center">Loading domains...</div>
      ) : (
        <div className="space-y-2">
          {domains.map((domain) => (
            <Card key={domain} className="p-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900" onClick={() => handleSelectDomain(domain)} data-testid={`button-mobile-domain-${domain}`}>
              <div className="flex justify-between items-center">
                <span className="font-semibold">{domain}</span>
                <span className="text-sm text-gray-600">Level 1</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

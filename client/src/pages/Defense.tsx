import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Lock,
  Eye,
  AlertTriangle,
  Gauge,
  CheckCircle,
  Clock,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

const DEFENSE_MODULES = [
  {
    id: "firewall",
    name: "Firewall",
    icon: Shield,
    description: "Lightweight but powerful - blocks malicious traffic and patterns",
    enabled: true,
    color: "text-blue-600",
  },
  {
    id: "antivirus",
    name: "Antivirus",
    icon: AlertTriangle,
    description: "Scans for malicious code signatures and threats",
    enabled: true,
    color: "text-red-600",
  },
  {
    id: "sandbox",
    name: "Sandboxing",
    icon: Lock,
    description: "Isolates operations in restricted environment",
    enabled: true,
    color: "text-purple-600",
  },
  {
    id: "honeypot",
    name: "Honeypot",
    icon: Eye,
    description: "Traps attackers with fake endpoints and data",
    enabled: true,
    color: "text-orange-600",
  },
  {
    id: "rateLimit",
    name: "Rate Limiting",
    icon: Gauge,
    description: "Prevents abuse through request throttling",
    enabled: true,
    color: "text-green-600",
  },
  {
    id: "inputValidation",
    name: "Input Validation",
    icon: CheckCircle,
    description: "Strict validation of all user inputs",
    enabled: true,
    color: "text-cyan-600",
  },
];

const DISABLE_OPTIONS = [
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "45 minutes", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "3 hours", value: 180 },
  { label: "5 hours", value: 300 },
  { label: "Until restart", value: -1 },
];

export default function Defense() {
  const [defenses, setDefenses] = useState(DEFENSE_MODULES);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [auditLog, setAuditLog] = useState<any[]>([]);

  const handleToggleDefense = (moduleId: string, duration: number) => {
    setDefenses(
      defenses.map((d) =>
        d.id === moduleId
          ? { ...d, enabled: !d.enabled, disabledUntil: duration > 0 ? new Date(Date.now() + duration * 60000) : null }
          : d
      )
    );

    // Add to audit log
    const module = defenses.find((d) => d.id === moduleId);
    const action = !module?.enabled ? "DISABLED" : "ENABLED";
    const durationText = duration === -1 ? "until restart" : `for ${duration} minutes`;
    setAuditLog([
      ...auditLog,
      {
        timestamp: new Date(),
        module: moduleId,
        action,
        duration: durationText,
      },
    ]);
  };

  return (
    <div className="space-y-6 max-w-6xl animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🛡️ Defense Center
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage Zeus's security measures. Each defense can be independently toggled with custom durations.
        </p>
      </div>

      {/* Security Overview */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
          {defenses.map((defense) => (
            <div key={defense.id} className="animate-scaleIn">
              <div className={`text-2xl font-bold ${defense.enabled ? "text-green-600" : "text-gray-400"}`}>
                {defense.enabled ? "✓" : "○"}
              </div>
              <p className="text-xs font-semibold capitalize mt-1">{defense.name}</p>
              <p className="text-xs text-gray-500 mt-1">{defense.enabled ? "Active" : "Inactive"}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Defense Modules */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">Security Modules</h2>

        {defenses.map((defense, idx) => {
          const Icon = defense.icon;
          const isExpanded = expandedModule === defense.id;

          return (
            <Card
              key={defense.id}
              className={`p-4 transition-all duration-300 hover:shadow-lg animate-slideIn ${
                isExpanded ? "ring-2 ring-blue-400" : ""
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedModule(isExpanded ? null : defense.id)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <Icon className={`w-6 h-6 ${defense.color}`} />
                  <div>
                    <h3 className="font-semibold text-lg">{defense.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{defense.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {defense.enabled ? (
                    <ToggleRight className="w-6 h-6 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Controls */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t space-y-4 animate-expandDown">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {DISABLE_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant={defense.enabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleDefense(defense.id, option.value)}
                        className={`transition-all ${defense.enabled ? "" : "opacity-50"}`}
                      >
                        {defense.enabled ? (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Disable {option.label}
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Enable
                          </>
                        )}
                      </Button>
                    ))}
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-xs text-gray-700 dark:text-gray-300">
                    <p className="font-semibold mb-1">Status:</p>
                    <p>
                      {defense.enabled ? (
                        <span className="text-green-600 font-semibold">✓ Active and protecting</span>
                      ) : (
                        <span className="text-orange-600 font-semibold">⚠ Disabled - System less protected</span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Audit Log */}
      {auditLog.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {auditLog.slice(-20).map((log, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-900 rounded animate-fadeIn"
              >
                <div>
                  <span className="font-semibold capitalize">{log.module}</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">{log.action}</span>
                </div>
                <div className="text-xs text-gray-500">{log.duration}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

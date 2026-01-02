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
  Zap,
  AlertCircle,
  Bell,
  Activity,
} from "lucide-react";

const DEFENSE_MODULES = [
  {
    id: "firewall",
    name: "Firewall",
    icon: Shield,
    description: "Blocks malicious traffic - lightweight but powerful",
    color: "text-blue-600",
    iconColor: "text-blue-400",
    bgGlow: "bg-blue-500/10",
    borderColor: "border-blue-500",
  },
  {
    id: "antivirus",
    name: "Antivirus",
    icon: AlertTriangle,
    description: "Real-time threat scanning & signature detection",
    color: "text-red-600",
    iconColor: "text-red-400",
    bgGlow: "bg-red-500/10",
    borderColor: "border-red-500",
  },
  {
    id: "sandbox",
    name: "Sandboxing",
    icon: Lock,
    description: "Isolate operations in restricted environment",
    color: "text-purple-600",
    iconColor: "text-purple-400",
    bgGlow: "bg-purple-500/10",
    borderColor: "border-purple-500",
  },
  {
    id: "honeypot",
    name: "Honeypot",
    icon: Eye,
    description: "Trap & log attacker activity with fake endpoints",
    color: "text-orange-600",
    iconColor: "text-orange-400",
    bgGlow: "bg-orange-500/10",
    borderColor: "border-orange-500",
  },
];

const DISABLE_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hr", value: 60 },
  { label: "3 hrs", value: 180 },
  { label: "5 hrs", value: 300 },
  { label: "Until Restart", value: -1 },
];

export default function DefenseAdvanced() {
  const [defenses, setDefenses] = useState(DEFENSE_MODULES);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [zeusMessage, setZeusMessage] = useState("");

  const handleToggleDefense = (moduleId: string, duration: number) => {
    const module = defenses.find((d) => d.id === moduleId);
    const newState = !module?.color;

    // Add notification
    const newNotif = {
      id: Date.now(),
      type: "defense",
      module: moduleId,
      action: newState ? "ENABLED" : "DISABLED",
      message: `${module?.name} has been ${newState ? "enabled" : "disabled"}${duration > 0 ? ` for ${duration} minutes` : ""}`,
      timestamp: new Date(),
    };
    setNotifications([...notifications, newNotif]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications((n) => n.filter((notif) => notif.id !== newNotif.id));
    }, 5000);

    // Zeus message
    const messages = [
      `I've ${newState ? "activated" : "deactivated"} the ${module?.name}. Protect well!`,
      `${module?.name} is now ${newState ? "online" : "offline"}. Stay vigilant.`,
      `Defense system updated. Monitoring continues.`,
    ];
    setZeusMessage(messages[Math.floor(Math.random() * messages.length)]);

    // Add to audit log
    setAuditLog([
      ...auditLog,
      {
        timestamp: new Date(),
        module: moduleId,
        action: newState ? "ENABLED" : "DISABLED",
        duration: duration > 0 ? `${duration}m` : "indefinite",
      },
    ]);

    setTimeout(() => setZeusMessage(""), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 bg-clip-text text-transparent">
          🛡️ Defense Command Center
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Enterprise-grade security powered by Zeus. All defenses monitored in real-time.
        </p>
      </div>

      {/* Alert Bar */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 space-y-2 z-50">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="animate-slideIn bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              <span className="text-sm font-semibold">{notif.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Zeus Status Message */}
      {zeusMessage && (
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-300 dark:border-purple-700 animate-slideIn">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🤖</div>
            <div>
              <p className="font-semibold text-purple-900 dark:text-purple-100">Zeus Protection Status</p>
              <p className="text-sm text-purple-700 dark:text-purple-300">{zeusMessage}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Defense Status Overview */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 border-2 border-slate-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {defenses.map((defense) => {
            const Icon = defense.icon;
            return (
              <div
                key={defense.id}
                className={`text-center p-4 rounded-lg ${defense.bgGlow} border ${defense.borderColor} animate-scaleIn`}
              >
                <Icon className={`w-8 h-8 ${defense.color} mx-auto mb-2 animate-pulse`} />
                <p className="text-xs font-bold text-white capitalize">{defense.name}</p>
                <p className="text-xs text-gray-300 mt-1">🟢 Active</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Detailed Defense Controls */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">Security Modules</h2>

        {defenses.map((defense, idx) => {
          const Icon = defense.icon;
          const isExpanded = expandedModule === defense.id;

          return (
            <Card
              key={defense.id}
              className={`overflow-hidden transition-all duration-300 animate-slideIn ${
                isExpanded ? `ring-2 ring-offset-2 ring-offset-white dark:ring-offset-black ${defense.borderColor}` : ""
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div
                className={`p-4 cursor-pointer hover:${defense.bgGlow} transition-all ${isExpanded ? defense.bgGlow : ""}`}
                onClick={() => setExpandedModule(isExpanded ? null : defense.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Icon className={`w-6 h-6 ${defense.color} animate-pulse`} />
                    <div>
                      <h3 className="font-bold text-lg">{defense.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{defense.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-green-500 text-sm font-bold">ACTIVE</div>
                    <ToggleRight className="w-6 h-6 text-green-600 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Expanded Controls */}
              {isExpanded && (
                <div className={`p-4 border-t ${defense.borderColor} ${defense.bgGlow} animate-expandDown`}>
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">Temporarily disable for:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {DISABLE_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleDefense(defense.id, option.value)}
                          className="text-xs hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {option.label}
                        </Button>
                      ))}
                    </div>

                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-xs text-red-700 dark:text-red-300">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        Warning: Disabling reduces system protection. Enable as soon as possible.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Activity Log */}
      {auditLog.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Log
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {auditLog.slice(-10).map((log, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-900 rounded animate-fadeIn"
              >
                <div>
                  <span className="font-semibold capitalize">{log.module}</span>
                  <span className={`ml-2 font-bold ${log.action === "ENABLED" ? "text-green-600" : "text-red-600"}`}>
                    {log.action}
                  </span>
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

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, Info, Zap } from "lucide-react";

export default function ErrorDashboard() {
  const { data: errorsData, isLoading } = useQuery({
    queryKey: ['/api/errors/logs'],
    queryFn: () => fetch('/api/errors/logs?limit=100').then(r => r.json()),
    refetchInterval: 10000,
  });

  const errors = errorsData?.errors || [];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'HIGH':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'MEDIUM':
        return <Zap className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'HIGH':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const criticalCount = errors.filter((e: any) => e.severity === 'CRITICAL').length;
  const highCount = errors.filter((e: any) => e.severity === 'HIGH').length;
  const mediumCount = errors.filter((e: any) => e.severity === 'MEDIUM').length;

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-3xl font-bold">Error Dashboard</h1>

      {/* Error Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Errors</p>
          <p className="text-3xl font-bold">{errors.length}</p>
        </Card>
        <Card className="p-4 border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">Critical</p>
          <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
        </Card>
        <Card className="p-4 border-orange-200 dark:border-orange-800">
          <p className="text-sm text-orange-600 dark:text-orange-400">High</p>
          <p className="text-3xl font-bold text-orange-600">{highCount}</p>
        </Card>
        <Card className="p-4 border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">Medium</p>
          <p className="text-3xl font-bold text-yellow-600">{mediumCount}</p>
        </Card>
      </div>

      {/* Error List */}
      <div>
        <h2 className="text-xl font-bold mb-4">Recent Errors</h2>
        {isLoading ? (
          <p>Loading errors...</p>
        ) : errors.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            No errors logged
          </Card>
        ) : (
          <div className="space-y-3">
            {errors.slice().reverse().map((error: any, idx: number) => (
              <Card
                key={error.errorId || idx}
                className={`p-4 border ${getSeverityBg(error.severity)}`}
                data-testid={`error-card-${error.severity}`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(error.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{error.errorType}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        error.severity === 'CRITICAL' ? 'bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100' :
                        error.severity === 'HIGH' ? 'bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100' :
                        error.severity === 'MEDIUM' ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100' :
                        'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100'
                      }`}>
                        {error.severity}
                      </span>
                      <span className="text-xs text-gray-500">Status: {error.status}</span>
                    </div>
                    <p className="text-sm mt-2">{error.message}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Component: {error.component} • ID: {error.errorId}
                    </p>
                    {error.clientId && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Client: {error.clientId}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(error.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

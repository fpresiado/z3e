import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Cpu, Smartphone, AlertCircle, CheckCircle, Zap } from "lucide-react";

export default function FleetDashboard() {
  const { data: status, isLoading: loadingStatus } = useQuery({
    queryKey: ['/api/mainframe/ai/status'],
    queryFn: () => fetch('/api/mainframe/ai/status').then(r => r.json()),
    refetchInterval: 5000,
  });

  const { data: clientsData, isLoading: loadingClients } = useQuery({
    queryKey: ['/api/mainframe/ai/clients'],
    queryFn: () => fetch('/api/mainframe/ai/clients').then(r => r.json()),
    refetchInterval: 10000,
  });

  const { data: updatesData } = useQuery({
    queryKey: ['/api/mainframe/ai/updates-required'],
    queryFn: () => fetch('/api/mainframe/ai/updates-required').then(r => r.json()),
    refetchInterval: 30000,
  });

  const clients = clientsData?.clients || [];
  const updates = updatesData?.clients || [];

  const getStatusIcon = (healthStatus: string) => {
    switch (healthStatus) {
      case 'HEALTHY':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'DEGRADED':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'CRITICAL':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Cpu className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'desktop':
        return <Cpu className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-3xl font-bold">Fleet Management</h1>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Clients</p>
          <p className="text-3xl font-bold">{status?.totalClients || 0}</p>
        </Card>
        <Card className="p-4 border-green-200 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400">Healthy</p>
          <p className="text-3xl font-bold text-green-600">{status?.healthy || 0}</p>
        </Card>
        <Card className="p-4 border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">Degraded</p>
          <p className="text-3xl font-bold text-yellow-600">{status?.degraded || 0}</p>
        </Card>
        <Card className="p-4 border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">Critical</p>
          <p className="text-3xl font-bold text-red-600">{status?.critical || 0}</p>
        </Card>
        <Card className="p-4 border-orange-200 dark:border-orange-800">
          <p className="text-sm text-orange-600 dark:text-orange-400">Updates</p>
          <p className="text-3xl font-bold text-orange-600">{updates.length}</p>
        </Card>
      </div>

      {/* Clients List */}
      <div>
        <h2 className="text-xl font-bold mb-4">Connected Clients</h2>
        {loadingClients ? (
          <p>Loading clients...</p>
        ) : clients.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            No remote AI clients registered yet
          </Card>
        ) : (
          <div className="space-y-3">
            {clients.map((client: any) => (
              <Card key={client.clientId} className="p-4 hover-elevate">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(client.healthStatus)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(client.platform)}
                        <p className="font-semibold text-sm truncate">{client.name}</p>
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                          {client.platform}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        v{client.version} • {client.clientId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-semibold">{client.healthStatus}</p>
                    <p className="text-gray-500">Errors: {client.errorCount}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Updates Required */}
      {updates.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 text-red-600">Updates Required</h2>
          <div className="space-y-3">
            {updates.map((client: any) => (
              <Card key={client.clientId} className="p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-600">{client.name}</p>
                    <p className="text-xs text-red-500">
                      {client.errorCount} errors • Status: {client.healthStatus}
                    </p>
                  </div>
                  <button className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                    Send Update
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

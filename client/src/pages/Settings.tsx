import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Save, AlertCircle } from "lucide-react";

export default function Settings() {
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const [formState, setFormState] = useState({
    theme: 'system',
    notifications: true,
    offlineMode: true,
    autoSave: true,
    language: 'en',
  });
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/settings/save', 'POST', { userId, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings', userId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleChange = (key: string, value: any) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveMutation.mutate(formState);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card className="p-6 space-y-6">
        {saved && (
          <div className="p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded flex items-center gap-2">
            <span>✓</span>
            <span>Settings saved successfully</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-semibold">Theme</label>
          <select
            value={formState.theme}
            onChange={(e) => handleChange('theme', e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:text-white"
            data-testid="select-theme"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold">Language</label>
          <select
            value={formState.language}
            onChange={(e) => handleChange('language', e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:text-white"
            data-testid="select-language"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="zh">Chinese</option>
          </select>
        </div>

        <div className="space-y-3 border-t pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formState.notifications}
              onChange={(e) => handleChange('notifications', e.target.checked)}
              className="w-4 h-4 rounded"
              data-testid="checkbox-notifications"
            />
            <span>Enable Notifications</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formState.offlineMode}
              onChange={(e) => handleChange('offlineMode', e.target.checked)}
              className="w-4 h-4 rounded"
              data-testid="checkbox-offline"
            />
            <span>Offline Mode</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formState.autoSave}
              onChange={(e) => handleChange('autoSave', e.target.checked)}
              className="w-4 h-4 rounded"
              data-testid="checkbox-autosave"
            />
            <span>Auto-Save Progress</span>
          </label>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            data-testid="button-save-settings"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

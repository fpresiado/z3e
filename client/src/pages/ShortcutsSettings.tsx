import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Keyboard, RotateCcw, Edit2, Check, X, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface Shortcut {
  action: string;
  label: string;
  description: string;
  defaultKeyCombo: string;
  keyCombo: string;
  category: string;
  enabled: boolean;
  customized: boolean;
}

export default function ShortcutsSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = localStorage.getItem("userId");
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [pendingCombo, setPendingCombo] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: shortcuts = [], isLoading } = useQuery<Shortcut[]>({
    queryKey: ["/api/shortcuts", userId],
    enabled: !!userId,
  });

  const setShortcutMutation = useMutation({
    mutationFn: async ({ action, keyCombo }: { action: string; keyCombo: string }) => {
      const response = await axios.post("/api/shortcuts/set", { userId, action, keyCombo });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shortcuts", userId] });
      setEditingAction(null);
      setPendingCombo("");
      setError("");
      toast({ title: "Shortcut updated", description: "Your keyboard shortcut has been saved." });
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || "Failed to set shortcut");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ action, enabled }: { action: string; enabled: boolean }) => {
      await axios.post("/api/shortcuts/toggle", { userId, action, enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shortcuts", userId] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      await axios.post("/api/shortcuts/reset", { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shortcuts", userId] });
      toast({ title: "Shortcuts reset", description: "All shortcuts have been reset to defaults." });
    },
  });

  useEffect(() => {
    if (editingAction && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingAction]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push("ctrl");
    if (e.altKey) parts.push("alt");
    if (e.shiftKey) parts.push("shift");

    const key = e.key.toLowerCase();
    if (!["control", "alt", "shift", "meta"].includes(key)) {
      parts.push(key === " " ? "space" : key);
    }

    if (parts.length > 0) {
      setPendingCombo(parts.join("+"));
      setError("");
    }
  };

  const handleSave = () => {
    if (!editingAction || !pendingCombo) return;
    setShortcutMutation.mutate({ action: editingAction, keyCombo: pendingCombo });
  };

  const handleCancel = () => {
    setEditingAction(null);
    setPendingCombo("");
    setError("");
  };

  const startEditing = (shortcut: Shortcut) => {
    setEditingAction(shortcut.action);
    setPendingCombo(shortcut.keyCombo);
    setError("");
  };

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading shortcuts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Keyboard Shortcuts</h1>
          <p className="text-muted-foreground">Customize your keyboard shortcuts for faster navigation</p>
        </div>
        <Button variant="outline" onClick={() => resetMutation.mutate()} data-testid="button-reset-shortcuts">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>

      <Card className="p-4 bg-muted/50">
        <div className="flex items-start gap-3">
          <Keyboard className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">How to set a shortcut</p>
            <p>Click the edit button next to a shortcut, then press your desired key combination. Use Ctrl, Alt, or Shift as modifiers.</p>
          </div>
        </div>
      </Card>

      {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
        <Card key={category} className="p-6">
          <h2 className="text-lg font-semibold mb-4">{category}</h2>
          <div className="space-y-4">
            {categoryShortcuts.map((shortcut) => (
              <div
                key={shortcut.action}
                className="flex items-center justify-between py-2 border-b last:border-0"
                data-testid={`shortcut-${shortcut.action}`}
              >
                <div className="flex-1">
                  <p className="font-medium">{shortcut.label}</p>
                  <p className="text-sm text-muted-foreground">{shortcut.description}</p>
                </div>

                <div className="flex items-center gap-4">
                  {editingAction === shortcut.action ? (
                    <div className="flex items-center gap-2">
                      <Input
                        ref={inputRef}
                        value={pendingCombo}
                        onKeyDown={handleKeyDown}
                        readOnly
                        placeholder="Press keys..."
                        className="w-32 text-center font-mono text-sm"
                        data-testid={`input-shortcut-${shortcut.action}`}
                      />
                      <Button size="icon" variant="ghost" onClick={handleSave} data-testid="button-save-shortcut">
                        <Check className="w-4 h-4 text-green-500" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={handleCancel} data-testid="button-cancel-shortcut">
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">
                          {shortcut.keyCombo}
                        </kbd>
                        {shortcut.customized && (
                          <span className="text-xs text-muted-foreground">(custom)</span>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditing(shortcut)}
                        data-testid={`button-edit-${shortcut.action}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}

                  <Switch
                    checked={shortcut.enabled}
                    onCheckedChange={(enabled) =>
                      toggleMutation.mutate({ action: shortcut.action, enabled })
                    }
                    data-testid={`switch-${shortcut.action}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {error && (
        <Card className="p-4 border-red-500 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}
    </div>
  );
}

import { db } from "../db";
import { userShortcuts } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface ShortcutDefinition {
  action: string;
  label: string;
  description: string;
  defaultKeyCombo: string;
  category: string;
}

const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
  {
    action: "go-dashboard",
    label: "Go to Dashboard",
    description: "Navigate to the main dashboard",
    defaultKeyCombo: "ctrl+d",
    category: "Navigation",
  },
  {
    action: "go-learning",
    label: "Go to Learning",
    description: "Navigate to learning section",
    defaultKeyCombo: "ctrl+l",
    category: "Navigation",
  },
  {
    action: "go-analytics",
    label: "Go to Analytics",
    description: "Navigate to analytics section",
    defaultKeyCombo: "ctrl+a",
    category: "Navigation",
  },
  {
    action: "go-achievements",
    label: "Go to Achievements",
    description: "Navigate to achievements",
    defaultKeyCombo: "ctrl+shift+a",
    category: "Navigation",
  },
  {
    action: "go-settings",
    label: "Go to Settings",
    description: "Navigate to settings",
    defaultKeyCombo: "ctrl+,",
    category: "Navigation",
  },
  {
    action: "toggle-theme",
    label: "Toggle Theme",
    description: "Switch between light and dark mode",
    defaultKeyCombo: "ctrl+t",
    category: "Interface",
  },
  {
    action: "toggle-sidebar",
    label: "Toggle Sidebar",
    description: "Show or hide the sidebar",
    defaultKeyCombo: "ctrl+b",
    category: "Interface",
  },
  {
    action: "open-search",
    label: "Open Search",
    description: "Open the global search",
    defaultKeyCombo: "ctrl+/",
    category: "Interface",
  },
  {
    action: "open-chat",
    label: "Open Chat",
    description: "Open Zeus chat assistant",
    defaultKeyCombo: "ctrl+k",
    category: "Actions",
  },
  {
    action: "start-session",
    label: "Start Learning Session",
    description: "Begin a new learning session",
    defaultKeyCombo: "ctrl+enter",
    category: "Actions",
  },
  {
    action: "show-shortcuts",
    label: "Show Shortcuts",
    description: "Display keyboard shortcuts help",
    defaultKeyCombo: "?",
    category: "Help",
  },
];

const RESERVED_KEYS = [
  "ctrl+c",
  "ctrl+v",
  "ctrl+x",
  "ctrl+z",
  "ctrl+y",
  "ctrl+s",
  "ctrl+f",
  "ctrl+p",
  "ctrl+w",
  "ctrl+n",
  "ctrl+tab",
  "alt+tab",
  "alt+f4",
  "f5",
  "f11",
  "f12",
];

class ShortcutService {
  getDefaultShortcuts(): ShortcutDefinition[] {
    return DEFAULT_SHORTCUTS;
  }

  async getUserShortcuts(userId: string) {
    const shortcuts = await db
      .select()
      .from(userShortcuts)
      .where(eq(userShortcuts.userId, userId));

    const defaultsMap = new Map(
      DEFAULT_SHORTCUTS.map((s) => [s.action, s])
    );

    const result = DEFAULT_SHORTCUTS.map((def) => {
      const userShortcut = shortcuts.find((s) => s.action === def.action);
      return {
        ...def,
        keyCombo: userShortcut?.keyCombo || def.defaultKeyCombo,
        enabled: userShortcut?.enabled ?? true,
        customized: !!userShortcut,
      };
    });

    return result;
  }

  async setShortcut(
    userId: string,
    action: string,
    keyCombo: string
  ): Promise<{ success: boolean; error?: string }> {
    const normalizedCombo = this.normalizeKeyCombo(keyCombo);

    if (RESERVED_KEYS.includes(normalizedCombo)) {
      return { success: false, error: "This key combination is reserved by the browser" };
    }

    const existing = await db
      .select()
      .from(userShortcuts)
      .where(
        and(
          eq(userShortcuts.userId, userId),
          eq(userShortcuts.keyCombo, normalizedCombo)
        )
      );

    if (existing.length > 0 && existing[0].action !== action) {
      return {
        success: false,
        error: `This key combination is already used for "${existing[0].action}"`,
      };
    }

    const existingAction = await db
      .select()
      .from(userShortcuts)
      .where(
        and(eq(userShortcuts.userId, userId), eq(userShortcuts.action, action))
      );

    if (existingAction.length > 0) {
      await db
        .update(userShortcuts)
        .set({ keyCombo: normalizedCombo, updatedAt: new Date() })
        .where(eq(userShortcuts.id, existingAction[0].id));
    } else {
      await db.insert(userShortcuts).values({
        userId,
        action,
        keyCombo: normalizedCombo,
        enabled: true,
      });
    }

    return { success: true };
  }

  async toggleShortcut(userId: string, action: string, enabled: boolean) {
    const existing = await db
      .select()
      .from(userShortcuts)
      .where(
        and(eq(userShortcuts.userId, userId), eq(userShortcuts.action, action))
      );

    if (existing.length > 0) {
      await db
        .update(userShortcuts)
        .set({ enabled, updatedAt: new Date() })
        .where(eq(userShortcuts.id, existing[0].id));
    } else {
      const def = DEFAULT_SHORTCUTS.find((s) => s.action === action);
      if (def) {
        await db.insert(userShortcuts).values({
          userId,
          action,
          keyCombo: def.defaultKeyCombo,
          enabled,
        });
      }
    }
  }

  async resetToDefaults(userId: string) {
    await db.delete(userShortcuts).where(eq(userShortcuts.userId, userId));
  }

  private normalizeKeyCombo(combo: string): string {
    return combo
      .toLowerCase()
      .split("+")
      .map((k) => k.trim())
      .sort((a, b) => {
        const order = ["ctrl", "alt", "shift", "meta"];
        const aIdx = order.indexOf(a);
        const bIdx = order.indexOf(b);
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return 0;
      })
      .join("+");
  }
}

export const shortcutService = new ShortcutService();

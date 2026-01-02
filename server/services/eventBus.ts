/**
 * EventBus
 * Typed event system for all Zeus components to publish/subscribe to system events
 * Enables loose coupling and event-driven architecture
 */

type EventHandler<T = any> = (data: T) => void | Promise<void>;

interface EventSubscription {
  unsubscribe: () => void;
}

export class EventBus {
  private static instance: EventBus;
  private subscriptions: Map<string, Set<EventHandler>> = new Map();

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event
   */
  subscribe<T = any>(eventName: string, handler: EventHandler<T>): EventSubscription {
    if (!this.subscriptions.has(eventName)) {
      this.subscriptions.set(eventName, new Set());
    }
    
    this.subscriptions.get(eventName)!.add(handler);
    
    return {
      unsubscribe: () => {
        this.subscriptions.get(eventName)?.delete(handler);
      },
    };
  }

  /**
   * Subscribe to an event once, then unsubscribe
   */
  once<T = any>(eventName: string, handler: EventHandler<T>): EventSubscription {
    const wrapper = async (data: T) => {
      await handler(data);
      subscription.unsubscribe();
    };
    
    const subscription = this.subscribe(eventName, wrapper);
    return subscription;
  }

  /**
   * Emit an event
   */
  async emit<T = any>(eventName: string, data?: T): Promise<void> {
    const handlers = this.subscriptions.get(eventName);
    if (!handlers) return;
    
    await Promise.all(Array.from(handlers).map((handler) => handler(data)));
  }

  /**
   * Clear all subscribers for an event
   */
  clear(eventName: string): void {
    this.subscriptions.delete(eventName);
  }

  /**
   * Clear all subscribers
   */
  clearAll(): void {
    this.subscriptions.clear();
  }

  /**
   * Get subscriber count for an event
   */
  getSubscriberCount(eventName: string): number {
    return this.subscriptions.get(eventName)?.size ?? 0;
  }
}

// ============= TYPED EVENT DEFINITIONS =============

export const ZEUS_EVENTS = {
  // System
  "system:boot": "system:boot",
  "system:safe-mode": "system:safe-mode",
  "system:shutdown": "system:shutdown",
  "system:error": "system:error",

  // Learning
  "learning:started": "learning:started",
  "learning:answer-correct": "learning:answer-correct",
  "learning:answer-incorrect": "learning:answer-incorrect",
  "learning:level-completed": "learning:level-completed",
  "learning:mastery-reached": "learning:mastery-reached",

  // Skills
  "skill:executing": "skill:executing",
  "skill:executed": "skill:executed",
  "skill:failed": "skill:failed",

  // Achievements
  "achievement:unlocked": "achievement:unlocked",

  // Streaks
  "streak:updated": "streak:updated",
  "streak:broken": "streak:broken",

  // Notifications
  "notification:created": "notification:created",

  // Provider
  "provider:error": "provider:error",
  "provider:slow": "provider:slow",

  // Leaderboard
  "leaderboard:updated": "leaderboard:updated",
} as const;

export type ZeusEvent = keyof typeof ZEUS_EVENTS;

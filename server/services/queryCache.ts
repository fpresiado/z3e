// Simple in-memory cache implementation
const cache = new Map<string, { value: any; expiry: number }>();

export class QueryCache {
  get<T>(key: string): T | undefined {
    const item = cache.get(key);
    if (!item) return undefined;
    if (item.expiry < Date.now()) {
      cache.delete(key);
      return undefined;
    }
    return item.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    cache.set(key, { value, expiry: Date.now() + ttlSeconds * 1000 });
  }

  invalidate(pattern: string): void {
    const keysToDelete: string[] = [];
    cache.forEach((_, k) => {
      if (k.includes(pattern)) keysToDelete.push(k);
    });
    keysToDelete.forEach((k) => cache.delete(k));
  }

  clear(): void {
    cache.clear();
  }

  static async memo<T>(key: string, fn: () => Promise<T>, ttl: number = 300): Promise<T> {
    const cached = cache.get(key);
    if (cached && cached.expiry > Date.now()) return cached.value as T;

    const result = await fn();
    cache.set(key, result, ttl);
    return result;
  }
}

export const queryCache = new QueryCache();

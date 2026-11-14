import crypto from "crypto";

/**
 * Deterministically serializes any JavaScript object or primitive
 * by recursively sorting object keys. Ensures identical objects with different
 * key order always produce the exact same serialized string and hash.
 */
export function canonicalStringify(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalStringify).join(",") + "]";
  }
  const record = obj as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort();
  const entries = sortedKeys.map(k => `${JSON.stringify(k)}:${canonicalStringify(record[k])}`);
  return "{" + entries.join(",") + "}";
}

export class PayloadLRUCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;

  constructor(maxEntries = 50, ttlMs = 5 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
  }

  /**
   * Computes a canonical SHA-256 hash of the input object
   * with deterministic recursive key sorting.
   */
  public computeHash(payload: unknown): string {
    const serialized = typeof payload === "string" ? payload : canonicalStringify(payload);
    return crypto.createHash("sha256").update(serialized).digest("hex");
  }

  /**
   * Retrieves a cached entry if present and not expired past TTL.
   * Refreshes LRU position on cache hits.
   */
  public get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Active TTL expiration check
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    // Refresh LRU position (delete and re-insert at end of Map)
    this.cache.delete(key);
    this.cache.set(key, { value: entry.value, timestamp: entry.timestamp });
    return entry.value;
  }

  public set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxEntries) {
      // Evict oldest entry (first key in map iteration)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  public size(): number {
    // Return count of non-expired entries
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const briefingCache = new PayloadLRUCache<unknown>(50, 5 * 60 * 1000);

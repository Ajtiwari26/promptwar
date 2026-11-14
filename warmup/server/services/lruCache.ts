import crypto from "crypto";

export class PayloadLRUCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private readonly maxEntries: number;

  constructor(maxEntries = 50) {
    this.maxEntries = maxEntries;
  }

  /**
   * Computes a SHA-256 hash of the input object
   */
  public computeHash(payload: unknown): string {
    const serialized = typeof payload === "string" ? payload : JSON.stringify(payload);
    return crypto.createHash("sha256").update(serialized).digest("hex");
  }

  public get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Refresh LRU position
    this.cache.delete(key);
    this.cache.set(key, { value: entry.value, timestamp: Date.now() });
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
    return this.cache.size;
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const briefingCache = new PayloadLRUCache<unknown>(50);

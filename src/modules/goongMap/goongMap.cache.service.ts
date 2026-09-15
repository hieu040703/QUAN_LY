import RedisConfig from "@/config/redis";
import redisHelper from "@/shared/utils/redis.helper";
import { injectable } from "inversify";

type MemoryEntry<T> = {
  value: T;
  expiresAt: number;
};

@injectable()
export class GoongMapCacheService {
  private readonly memoryCache = new Map<string, MemoryEntry<string>>();
  private readonly memoryCounters = new Map<string, MemoryEntry<number>>();

  private getSecondsUntilEndOfDay(): number {
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    return Math.max(1, Math.ceil((endOfDay.getTime() - Date.now()) / 1000));
  }

  private getMemoryValue<T>(store: Map<string, MemoryEntry<T>>, key: string): T | null {
    const entry = store.get(key);
    if (!entry) return null;

    if (entry.expiresAt <= Date.now()) {
      store.delete(key);
      return null;
    }

    return entry.value;
  }

  async getJson<T>(key: string): Promise<T | null> {
    const cached = await redisHelper.get(key);
    if (cached) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        await redisHelper.del(key);
      }
    }

    const memoryValue = this.getMemoryValue(this.memoryCache, key);
    return memoryValue ? (JSON.parse(memoryValue) as T) : null;
  }

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const payload = JSON.stringify(value);
    const writtenToRedis = await redisHelper.set(key, payload, ttlSeconds);

    if (!writtenToRedis) {
      this.memoryCache.set(key, {
        value: payload,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    }
  }

  async incrementDailyCounter(key: string): Promise<number> {
    const client = RedisConfig.getClient();

    if (client && client.status === "ready") {
      const currentValue = await client.incr(key);
      if (currentValue === 1) {
        await client.expire(key, this.getSecondsUntilEndOfDay());
      }
      return currentValue;
    }

    const cachedValue = this.getMemoryValue(this.memoryCounters, key) ?? 0;
    const nextValue = cachedValue + 1;
    this.memoryCounters.set(key, {
      value: nextValue,
      expiresAt: Date.now() + this.getSecondsUntilEndOfDay() * 1000,
    });
    return nextValue;
  }
}


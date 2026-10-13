import { Injectable } from "@nestjs/common";

import { RateLimitExceededError } from "./api-error";

interface Bucket {
  count: number;
  resetAt: number;
}

const SWEEP_THRESHOLD = 10_000;

/**
 * Limitador de ventana fija en memoria. Valido para una sola instancia del backend;
 * con varias replicas debera moverse a un almacen compartido (ver DEC-006).
 */
@Injectable()
export class RateLimiterService {
  private readonly buckets = new Map<string, Bucket>();

  /** Registra un evento y lanza 429 si la clave supero `limit` dentro de la ventana. */
  consume(key: string, limit: number, windowMs: number, now = Date.now()) {
    const bucket = this.hit(key, windowMs, now);

    if (bucket.count > limit) {
      throw new RateLimitExceededError(this.retryAfterSeconds(bucket, now));
    }
  }

  /** Lanza 429 si la clave ya alcanzo `limit` en la ventana vigente; no registra nada. */
  assertAvailable(key: string, limit: number, now = Date.now()) {
    const bucket = this.buckets.get(key);

    if (bucket && bucket.resetAt > now && bucket.count >= limit) {
      throw new RateLimitExceededError(this.retryAfterSeconds(bucket, now));
    }
  }

  /** Registra un evento (por ejemplo, un intento fallido) sin evaluar el limite. */
  hit(key: string, windowMs: number, now = Date.now()) {
    if (this.buckets.size > SWEEP_THRESHOLD) {
      this.sweep(now);
    }

    let bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      this.buckets.set(key, bucket);
    }

    bucket.count += 1;

    return bucket;
  }

  reset(key: string) {
    this.buckets.delete(key);
  }

  private retryAfterSeconds(bucket: Bucket, now: number) {
    return Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  }

  private sweep(now: number) {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}

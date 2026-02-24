type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function applyRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || now > current.resetAt) {
    buckets.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });

    return {
      allowed: true,
      remaining: config.limit - 1,
      retryAfterSeconds: Math.ceil(config.windowMs / 1000),
    };
  }

  current.count += 1;

  const allowed = current.count <= config.limit;
  const remaining = Math.max(config.limit - current.count, 0);
  const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);

  return {
    allowed,
    remaining,
    retryAfterSeconds,
  };
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

// For local/dev demos. In production use Redis or other distributed stores.
export function clearRateLimitStore() {
  buckets.clear();
}

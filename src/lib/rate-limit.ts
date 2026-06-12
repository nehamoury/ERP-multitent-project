const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

export function rateLimit(ip: string, maxAttempts: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();

  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [key, val] of ipRequestCounts) {
      if (now > val.resetAt) ipRequestCounts.delete(key);
    }
    lastCleanup = now;
  }

  const record = ipRequestCounts.get(ip);

  if (!record || now > record.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: maxAttempts - record.count, resetAt: record.resetAt };
}

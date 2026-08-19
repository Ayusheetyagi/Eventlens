import "server-only";

/** Transient Gemini errors worth retrying: 429 (Requests Per Minute bursts, not the
 *  daily quota) and 503 (Google's own servers temporarily overloaded). Schema/parse
 *  failures are deterministic — retrying wastes a paid call — so those are never
 *  retried here. */
const RETRYABLE_STATUSES = new Set([429, 503]);

export async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = (err as { status?: number })?.status;
      const isNetworkError = err instanceof TypeError || (err as { name?: string })?.name === "TimeoutError";
      const retryable = (status !== undefined && RETRYABLE_STATUSES.has(status)) || isNetworkError;
      if (!retryable || attempt === maxAttempts - 1) throw err;
      // Base delay is deliberately a few seconds, not milliseconds: a 429 here is a
      // per-minute RPM cap, and retrying within the same second just burns another
      // attempt against the same window.
      const delayMs = 4000 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

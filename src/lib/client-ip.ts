/**
 * Best-effort client IP for rate limiting.
 *
 * The app runs behind a single reverse proxy, which appends the address it saw
 * to the END of `X-Forwarded-For`. Earlier entries are whatever the client sent,
 * so they can be faked — we take the last entry instead of the first.
 */
export function getClientIp(request: Request): string {
    return getClientIpFromHeaders(request.headers);
}

/** Same as getClientIp, for server actions (`await headers()` from next/headers). */
export function getClientIpFromHeaders(headers: Headers): string {
    const forwarded = headers.get("x-forwarded-for");
    if (forwarded) {
        const parts = forwarded.split(",").map((p) => p.trim()).filter(Boolean);
        const last = parts[parts.length - 1];
        if (last) return last;
    }
    return headers.get("x-real-ip")?.trim() || "anonymous";
}

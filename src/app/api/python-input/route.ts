import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // 1. UUID validation to prevent id guessing
    if (!id || !UUID_REGEX.test(id)) {
        return new NextResponse('Invalid or missing UUID id', { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "anonymous";
    const rateLimitKey = `rate_limit:python_input_get:${ip}`;

    const redis = await getRedis();

    // 2. Rate limit GETs per IP (Max 30 pending requests per minute per IP)
    try {
        const currentRequests = await redis.incr(rateLimitKey);
        if (currentRequests === 1) {
            await redis.expire(rateLimitKey, 60);
        }
        if (currentRequests > 30) {
            return new NextResponse('Rate limit exceeded', { status: 429 });
        }
    } catch {
        // Fail open if Redis rate limit check fails
    }

    const redisKey = `python-input:${id}`;

    // 3. Blocking Redis read (BLPOP) using an isolated client to avoid busy polling loops
    const blockingClient = redis.duplicate();
    await blockingClient.connect();

    try {
        if (request.signal.aborted) {
            return new NextResponse('Client disconnected', { status: 499 });
        }

        const onAbort = () => {
            blockingClient.disconnect().catch(() => {});
        };
        request.signal.addEventListener("abort", onAbort, { once: true });

        // Block for up to 30 seconds waiting for user input
        const result = await blockingClient.blPop(redisKey, 30);
        request.signal.removeEventListener("abort", onAbort);

        if (result && result.element !== undefined) {
            return new NextResponse(result.element, { status: 200 });
        }

        return new NextResponse('Timeout', { status: 408 });
    } catch {
        if (request.signal.aborted) {
            return new NextResponse('Client disconnected', { status: 499 });
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    } finally {
        await blockingClient.disconnect().catch(() => {});
    }
}

export async function POST(request: Request) {
    try {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "anonymous";
        const rateLimitKey = `rate_limit:python_input:${ip}`;
        
        const redis = await getRedis();
        try {
            const currentRequests = await redis.incr(rateLimitKey);
            if (currentRequests === 1) {
                await redis.expire(rateLimitKey, 60);
            }
            if (currentRequests > 60) { // Max 60 inputs per minute per IP
                return new NextResponse('Rate limit exceeded', { status: 429 });
            }
        } catch {
            // Ignore rate limit redis errors
        }

        const { id, text } = await request.json();
        
        // Validate UUID and payload
        if (!id || !UUID_REGEX.test(id) || typeof text !== 'string') {
            return new NextResponse('Invalid payload', { status: 400 });
        }

        const redisKey = `python-input:${id}`;
        
        // Push to Redis list for BLPOP with a short expiration (60s) to prevent memory leaks
        await redis.rPush(redisKey, text);
        await redis.expire(redisKey, 60);
        
        return new NextResponse('OK', { status: 200 });
    } catch {
        return new NextResponse('Bad Request', { status: 400 });
    }
}

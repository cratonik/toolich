import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return new NextResponse('Missing id', { status: 400 });

    const redis = await getRedis();
    const redisKey = `python-input:${id}`;

    // Long poll until input is received (max 60 seconds)
    // Redis is shared across all Next.js worker threads
    let attempts = 0;
    while (attempts < 600) {
        if (request.signal.aborted) {
            return new NextResponse('Client disconnected', { status: 499 });
        }
        const text = await redis.get(redisKey);
        if (text !== null) {
            await redis.del(redisKey);
            return new NextResponse(text, { status: 200 });
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    return new NextResponse('Timeout', { status: 408 });
}

export async function POST(request: Request) {
    try {
        const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
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
        } catch (e) {
            // Ignore rate limit redis errors
        }

        const { id, text } = await request.json();
        
        if (!id || typeof text !== 'string') {
            return new NextResponse('Invalid payload', { status: 400 });
        }

        const redisKey = `python-input:${id}`;
        
        // Store the input with a short expiration (60s) to prevent memory leaks
        await redis.set(redisKey, text, { EX: 60 });
        
        return new NextResponse('OK', { status: 200 });
    } catch (error) {
        return new NextResponse('Bad Request', { status: 400 });
    }
}

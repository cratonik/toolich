import { createClient } from "redis";
import { NextResponse } from "next/server";

// Create client using the Vercel Redis URL
const redis = await createClient({
    url: process.env.TOOLICH_STORAGE_REDIS_URL,
}).connect();

export async function POST() {
    try {
        // Fetch data from Redis
        const result = await redis.get("item");

        // Return the result in the response
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.error("Redis test error:", error);
        return NextResponse.json({ error: "Failed to connect to Redis" }, { status: 500 });
    }
}

import { getRedis } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const redis = await getRedis();
        // Fetch data from Redis
        const result = await redis.get("item");

        // Return the result in the response
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.error("Redis test error:", error);
        return NextResponse.json({ error: "Failed to connect to Redis" }, { status: 500 });
    }
}

import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedis() {
    if (!redisClient) {
        const client: ReturnType<typeof createClient> = createClient({
            url: process.env.TOOLICH_STORAGE_REDIS_URL,
        });
        await client.connect();
        redisClient = client;
    }
    return redisClient!;
}

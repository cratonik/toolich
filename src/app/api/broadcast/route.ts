import { NextResponse } from "next/server";
import * as emoji from "node-emoji";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

interface BroadcastData {
    text?: string;
    timestamp?: number;
}

// Helper to read broadcast from Redis
async function readBroadcast(): Promise<BroadcastData> {
    try {
        const redis = await getRedis();
        const dataStr = await redis.get("toolich:broadcast");
        if (dataStr) {
            return JSON.parse(dataStr);
        }
    } catch (e) {
        console.error("Error reading broadcast from Redis:", e);
    }
    return {};
}

// Helper to write broadcast to Redis
async function writeBroadcast(data: BroadcastData) {
    try {
        const redis = await getRedis();
        if (!data.text || !data.timestamp) {
            // Delete the key to free up Redis memory
            await redis.del("toolich:broadcast");
        } else {
            const dataStr = JSON.stringify(data);
            // Automatically expire the key after 24 hours (86400 seconds)
            await redis.set("toolich:broadcast", dataStr, {
                EX: 86400,
            });
        }
    } catch (e) {
        console.error("Error writing broadcast to Redis:", e);
    }
}

// GET active broadcast
export async function GET() {
    try {
        const broadcast = await readBroadcast();

        const noCacheHeaders = {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        };

        if (!broadcast.text || !broadcast.timestamp) {
            return NextResponse.json({ active: false }, { headers: noCacheHeaders });
        }

        // Check if 24 hours have passed
        const ageInMs = Date.now() - broadcast.timestamp;
        const oneDayInMs = 24 * 60 * 60 * 1000;

        if (ageInMs > oneDayInMs) {
            // Expired, clear it
            await writeBroadcast({});
            return NextResponse.json({ active: false }, { headers: noCacheHeaders });
        }

        return NextResponse.json({
            active: true,
            text: broadcast.text,
            timestamp: broadcast.timestamp,
        }, { headers: noCacheHeaders });
    } catch (error) {
        console.error("Error reading broadcast route:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST new broadcast from Slack Webhook
export async function POST(request: Request) {
    try {
        const url = new URL(request.url);
        const queryToken = url.searchParams.get("token");
        const configuredToken = process.env.BROADCAST_TOKEN;

        console.log("\n--- INCOMING POST TO /api/broadcast ---");
        console.log("Configured Token:", configuredToken);
        console.log("Query Token:", queryToken);

        // Security check
        if (configuredToken && queryToken !== configuredToken) {
            console.warn("Unauthorized: Tokens do not match!");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        console.log("Payload Body:", JSON.stringify(body, null, 2));

        // 1. Handle Slack Webhook challenge verification
        if (body.type === "url_verification") {
            console.log("Responding to Slack challenge verification");
            return new Response(body.challenge, {
                status: 200,
                headers: { "Content-Type": "text/plain" },
            });
        }

        // 2. Handle Slack Event (message posted)
        const event = body.event;
        if (event && event.type === "message") {
            console.log("Received a message event:", event);

            // Ignore messages sent by bots to prevent feedback loops
            if (event.bot_id) {
                console.log("Ignored: Message is from a bot (bot_id present)");
                return NextResponse.json({ success: true, ignored: "bot_message" });
            }

            const rawText = event.text?.trim() || "";

            // Check if text is "done" or "close" to clear
            if (rawText.toLowerCase() === "done" || rawText.toLowerCase() === "close") {
                await writeBroadcast({});
                forwardRequest(body);
                return NextResponse.json({ success: true, cleared: true });
            }

            // Emojify Slack shortcodes (e.g. :fire:, :warning:) to Unicode emojis
            const emojifiedText = emoji.emojify(rawText);

            // Save new broadcast
            const broadcast = {
                text: emojifiedText,
                timestamp: Date.now(),
            };
            await writeBroadcast(broadcast);

            forwardRequest(body);

            return NextResponse.json({ success: true, updated: true });
        }

        return NextResponse.json({ success: true, ignored: "unsupported_event" });
    } catch (error) {
        console.error("Error writing broadcast route:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Helper to forward the webhook payload to a dev/preview environment (e.g., netlify app)
function forwardRequest(body: unknown) {
    const forwardUrl = process.env.FORWARD_BROADCAST_URL;
    if (forwardUrl) {
        console.log("Forwarding broadcast event to:", forwardUrl);
        fetch(forwardUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        }).catch((err) => {
            console.error("Failed to forward broadcast event:", err);
        });
    }
}

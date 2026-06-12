import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "src/data");
const FILE_PATH = path.join(DATA_DIR, "broadcast.json");

// Helper to ensure data directory exists
function ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

// GET active broadcast
export async function GET() {
    try {
        ensureDirectory();
        if (!fs.existsSync(FILE_PATH)) {
            return NextResponse.json({ active: false });
        }

        const dataStr = fs.readFileSync(FILE_PATH, "utf-8");
        const broadcast = JSON.parse(dataStr);

        if (!broadcast.text || !broadcast.timestamp) {
            return NextResponse.json({ active: false });
        }

        // Check if 24 hours have passed
        const ageInMs = Date.now() - broadcast.timestamp;
        const oneDayInMs = 24 * 60 * 60 * 1000;

        if (ageInMs > oneDayInMs) {
            // Expired, clear it
            fs.writeFileSync(FILE_PATH, JSON.stringify({}));
            return NextResponse.json({ active: false });
        }

        return NextResponse.json({
            active: true,
            text: broadcast.text,
            timestamp: broadcast.timestamp,
        });
    } catch (error) {
        console.error("Error reading broadcast file:", error);
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

            ensureDirectory();

            // Check if text is "done" or "close" to clear
            if (rawText.toLowerCase() === "done" || rawText.toLowerCase() === "close") {
                fs.writeFileSync(FILE_PATH, JSON.stringify({}));
                return NextResponse.json({ success: true, cleared: true });
            }

            // Save new broadcast
            const broadcast = {
                text: rawText,
                timestamp: Date.now(),
            };
            fs.writeFileSync(FILE_PATH, JSON.stringify(broadcast, null, 2));

            return NextResponse.json({ success: true, updated: true });
        }

        return NextResponse.json({ success: true, ignored: "unsupported_event" });
    } catch (error) {
        console.error("Error writing broadcast file:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

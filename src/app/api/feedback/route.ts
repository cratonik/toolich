import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { category, message, email, timestamp } = body;

        if (!category || !message) {
            return NextResponse.json(
                { error: "Category and message are required" },
                { status: 400 }
            );
        }

        const formattedText = `*New Toolich Feedback Received* 🚀\n` +
            `*Category:* ${category}\n` +
            `*Message:* ${message}\n` +
            `*Email:* ${email || "Not provided"}\n` +
            `*Time:* ${new Date(timestamp || Date.now()).toLocaleString()}`;

        let sent = false;

        // 1. Telegram Integration
        const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramChatId = process.env.TELEGRAM_CHAT_ID;
        if (telegramToken && telegramChatId) {
            try {
                const tgUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
                const res = await fetch(tgUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: telegramChatId,
                        text: formattedText,
                        parse_mode: "Markdown",
                    }),
                });
                if (res.ok) sent = true;
            } catch (err) {
                console.error("Telegram send error:", err);
            }
        }

        // 2. Slack Integration
        const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
        if (slackWebhookUrl) {
            try {
                const res = await fetch(slackWebhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        text: formattedText,
                    }),
                });
                if (res.ok) sent = true;
            } catch (err) {
                console.error("Slack send error:", err);
            }
        }

        // 3. Persist feedback list in Redis
        try {
            const redis = await getRedis();
            await redis.lPush(
                "toolich:feedback_list",
                JSON.stringify({
                    category,
                    message,
                    email,
                    timestamp: timestamp || Date.now(),
                })
            );
            // Keep only the most recent 100 entries to prevent database memory bloating
            await redis.lTrim("toolich:feedback_list", 0, 99);
        } catch (err) {
            console.error("Redis feedback persistence error:", err);
        }

        // Log locally if no external notifications are configured
        if (!sent) {
            console.log("\n=== Feedback Received (Local Development Logging) ===");
            console.log(formattedText);
            console.log("======================================================\n");
        }

        return NextResponse.json({ success: true, forwarded: sent });
    } catch (error: unknown) {
        console.error("Feedback API error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

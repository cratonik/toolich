import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import { getClientIp } from "@/lib/client-ip";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_FIELD_LENGTH = 200;

function escapeTelegramMarkdown(text: string): string {
    return text.replace(/([*_`\[])/g, "\\$1");
}

/**
 * Slack treats <...> as control sequences (<!channel>, <!here>, <@U123>,
 * <https://evil|Click here>). Escaping &, < and > makes user text inert.
 * https://api.slack.com/reference/surfaces/formatting#escaping
 */
function escapeSlack(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(request: Request) {
    try {
        // Rate limiting check using client IP and Redis
        const ip = getClientIp(request);
        const rateLimitKey = `rate_limit:feedback:${ip}`;
        
        try {
            const redis = await getRedis();
            const currentRequests = await redis.incr(rateLimitKey);
            if (currentRequests === 1) {
                await redis.expire(rateLimitKey, 60);
            }
            if (currentRequests > 5) {
                return NextResponse.json(
                    { error: "Too many feedback requests. Please try again in a minute." },
                    { status: 429 }
                );
            }
        } catch (err) {
            console.error("Redis rate limit error:", err);
        }

        const body = await request.json();
        const { category, message, email, timestamp } = body;

        if (typeof category !== "string" || typeof message !== "string" || !category.trim() || !message.trim()) {
            return NextResponse.json(
                { error: "Category and message are required" },
                { status: 400 }
            );
        }
        if (email !== undefined && email !== null && typeof email !== "string") {
            return NextResponse.json({ error: "Invalid email" }, { status: 400 });
        }
        if (
            message.length > MAX_MESSAGE_LENGTH ||
            category.length > MAX_FIELD_LENGTH ||
            (email && email.length > MAX_FIELD_LENGTH)
        ) {
            return NextResponse.json(
                { error: `Message must be under ${MAX_MESSAGE_LENGTH} characters` },
                { status: 400 }
            );
        }
        const time = new Date(typeof timestamp === "number" ? timestamp : Date.now());
        const timeStr = isNaN(time.getTime()) ? new Date().toLocaleString() : time.toLocaleString();

        const escapedCategory = escapeTelegramMarkdown(category);
        const escapedMessage = escapeTelegramMarkdown(message);
        const escapedEmail = escapeTelegramMarkdown(email || "");

        const formattedText = `*New Toolich Feedback Received* 🚀\n` +
            `*Category:* ${escapedCategory}\n` +
            `*Message:* ${escapedMessage}\n` +
            `*Email:* ${escapedEmail || "Not provided"}\n` +
            `*Time:* ${timeStr}`;

        const slackText = `*New Toolich Feedback Received* 🚀\n` +
            `*Category:* ${escapeSlack(category)}\n` +
            `*Message:* ${escapeSlack(message)}\n` +
            `*Email:* ${escapeSlack(email || "") || "Not provided"}\n` +
            `*Time:* ${timeStr}`;

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
                        text: slackText,
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

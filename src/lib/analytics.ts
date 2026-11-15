/**
 * Google Analytics (GA4) event tracker helper.
 */

declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
        dataLayer?: any[];
    }
}

/**
 * Send a generic event to Google Analytics
 */
export function trackEvent(
    eventName: string,
    params?: Record<string, string | number | boolean | null | undefined>
) {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("event", eventName, params);
    }
}

/**
 * Track tool usage action (e.g. format, encode, decode, copy, generate)
 * Custom dimension `tool_name` can be registered in GA4 Admin.
 */
export function trackToolUsageEvent(toolName: string, action: string) {
    trackEvent("tool_used", {
        tool_name: toolName,
        action: action,
    });
}


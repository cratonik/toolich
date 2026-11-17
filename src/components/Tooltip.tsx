import type { ReactNode } from "react";

type TooltipProps = {
    label: string;
    children: ReactNode;
    /** Where the bubble appears relative to the trigger. */
    side?: "top" | "bottom";
    /** "end" right-aligns the bubble, for triggers near the right edge of the screen. */
    align?: "center" | "end";
    /** Hide the bubble (e.g. while the trigger's own panel is open). */
    disabled?: boolean;
    /** Extra classes for the wrapper (e.g. "hidden md:inline-flex" to match the trigger). */
    className?: string;
};

/**
 * Instant hover/focus tooltip for icon buttons. Pure CSS, so it shows
 * immediately instead of after the browser's ~1s `title` delay. Only appears
 * on devices that can hover (no sticky tooltips after a tap on touch screens),
 * and on keyboard focus.
 */
export function Tooltip({ label, children, side = "top", align = "center", disabled = false, className = "inline-flex" }: TooltipProps) {
    const position = side === "top" ? "bottom-full mb-2" : "top-full mt-2";
    const alignment = align === "end" ? "right-0" : "left-1/2 -translate-x-1/2";

    return (
        <span className={`group/tip relative ${className}`}>
            {children}
            {!disabled && (
                <span
                    role="tooltip"
                    className={`pointer-events-none absolute ${position} ${alignment} z-[60] whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-100 dark:bg-zinc-100 dark:text-zinc-900 [@media(hover:hover)]:group-hover/tip:opacity-100 group-has-[:focus-visible]/tip:opacity-100`}
                >
                    {label}
                </span>
            )}
        </span>
    );
}

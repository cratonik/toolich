"use client";

import { useCallback, useEffect, useRef } from "react";

type SplitDividerProps = {
    ratio: number;
    onRatioChange: (ratio: number) => void;
};

export function SplitDivider({ onRatioChange }: SplitDividerProps) {
    const dragging = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            dragging.current = true;
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        },
        [],
    );

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!dragging.current) return;
            const container = containerRef.current?.parentElement;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const newRatio = Math.min(0.7, Math.max(0.3, x / rect.width));
            onRatioChange(newRatio);
        };

        const onMouseUp = () => {
            if (!dragging.current) return;
            dragging.current = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, [onRatioChange]);

    return (
        <div
            ref={containerRef}
            className="group relative flex w-2 shrink-0 cursor-col-resize items-center justify-center"
            onMouseDown={onMouseDown}
        >
            {/* Visual bar */}
            <div className="h-full w-px bg-zinc-200 transition-colors group-hover:w-0.5 group-hover:bg-indigo-400 dark:bg-zinc-700 dark:group-hover:bg-indigo-500" />
            {/* Grab handle dots */}
            <div className="absolute flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="h-1 w-1 rounded-full bg-indigo-400 dark:bg-indigo-500" />
                <div className="h-1 w-1 rounded-full bg-indigo-400 dark:bg-indigo-500" />
                <div className="h-1 w-1 rounded-full bg-indigo-400 dark:bg-indigo-500" />
            </div>
        </div>
    );
}

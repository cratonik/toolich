"use client";

import { useState, useEffect, useCallback } from "react";
import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Copy, Check, Clock, Calendar, Globe, Trash2, CornerDownRight } from "lucide-react";
import { useSessionState } from "@/lib/use-session-state";

const TIMEZONES = [
    { label: "Local Time", value: "local" },
    { label: "UTC (Coordinated Universal Time)", value: "UTC" },
    { label: "America/New_York (EST/EDT)", value: "America/New_York" },
    { label: "America/Los_Angeles (PST/PDT)", value: "America/Los_Angeles" },
    { label: "America/Chicago (CST/CDT)", value: "America/Chicago" },
    { label: "Europe/London (GMT/BST)", value: "Europe/London" },
    { label: "Europe/Paris (CET/CEST)", value: "Europe/Paris" },
    { label: "Asia/Kolkata (IST)", value: "Asia/Kolkata" },
    { label: "Asia/Tokyo (JST)", value: "Asia/Tokyo" },
    { label: "Asia/Shanghai (CST)", value: "Asia/Shanghai" },
    { label: "Australia/Sydney (AEST/AEDT)", value: "Australia/Sydney" },
];

export default function TimestampConverter() {
    const [localTz, setLocalTz] = useState("UTC");
    const [currentTime, setCurrentTime] = useState(new Date());

    const [timestampInput, setTimestampInput] = useSessionState("timestamp-converter:timestamp", "");
    const [dateInput, setDateInput] = useSessionState("timestamp-converter:date", "");
    const [timezone, setTimezone] = useSessionState("timestamp-converter:timezone", "local");
    const [unit, setUnit] = useSessionState<"s" | "ms" | "auto">("timestamp-converter:unit", "auto");

    const [parsedDate, setParsedDate] = useState<Date | null>(null);
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

    // Init local timezone safely on client
    useEffect(() => {
        try {
            setLocalTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
        } catch {
            setLocalTz("UTC");
        }
    }, []);

    // Live ticker
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Parse the input date/timestamp
    useEffect(() => {
        if (!timestampInput && !dateInput) {
            setParsedDate(null);
            return;
        }

        // Try to parse from whatever was last edited...
        // Actually, we should keep them in sync bidirectionally.
        // For simplicity, whenever timestamp changes, we can try to make sense of it.
        // But doing it robustly:
        const tryParseTs = (tsStr: string) => {
            if (!/^-?\d+$/.test(tsStr)) return null;
            let num = parseInt(tsStr, 10);
            
            let isSeconds = false;
            if (unit === "s") isSeconds = true;
            else if (unit === "auto") {
                // Auto detect: if < 10000000000 (year 2286), assume seconds
                if (Math.abs(num) < 10000000000) isSeconds = true;
            }

            if (isSeconds) num *= 1000;
            const d = new Date(num);
            return isValid(d) ? d : null;
        };

        const d1 = tryParseTs(timestampInput);
        if (d1) {
            setParsedDate(d1);
        } else if (dateInput) {
            const d2 = new Date(dateInput); // Try native parsing
            if (isValid(d2)) {
                setParsedDate(d2);
            } else {
                setParsedDate(null);
            }
        } else {
            setParsedDate(null);
        }
    }, [timestampInput, dateInput, unit]);


    const handleTimestampChange = (val: string) => {
        setTimestampInput(val);
        // Sync the date input
        if (!/^-?\d+$/.test(val)) {
            setDateInput("");
            return;
        }
        let num = parseInt(val, 10);
        let isSeconds = false;
        if (unit === "s") isSeconds = true;
        else if (unit === "auto") {
            if (Math.abs(num) < 10000000000) isSeconds = true;
        }
        if (isSeconds) num *= 1000;
        
        const d = new Date(num);
        if (isValid(d)) {
            // format standard ISO for the input
            try {
                const tzToUse = timezone === "local" ? localTz : timezone;
                setDateInput(formatInTimeZone(d, tzToUse, "yyyy-MM-dd'T'HH:mm:ss"));
            } catch {
                setDateInput(format(d, "yyyy-MM-dd'T'HH:mm:ss"));
            }
        }
    };

    const handleDateChange = (val: string) => {
        setDateInput(val);
        const d = new Date(val);
        if (isValid(d)) {
            let ms = d.getTime();
            if (unit === "s") {
                setTimestampInput(Math.floor(ms / 1000).toString());
            } else if (unit === "auto") {
                // If it was auto, we generally generate ms unless it's perfectly round seconds? 
                // Let's output seconds if auto to be clean.
                setTimestampInput(Math.floor(ms / 1000).toString());
            } else {
                setTimestampInput(ms.toString());
            }
        }
    };

    const handleUseCurrent = () => {
        const now = new Date();
        const ms = now.getTime();
        if (unit === "ms") {
            setTimestampInput(ms.toString());
        } else {
            setTimestampInput(Math.floor(ms / 1000).toString());
        }
        // update date box as well
        const tzToUse = timezone === "local" ? localTz : timezone;
        try {
            setDateInput(formatInTimeZone(now, tzToUse, "yyyy-MM-dd'T'HH:mm:ss"));
        } catch {
            setDateInput(format(now, "yyyy-MM-dd'T'HH:mm:ss"));
        }
    };

    const handleClear = () => {
        setTimestampInput("");
        setDateInput("");
    };

    const handleCopy = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedStates((prev) => ({ ...prev, [id]: true }));
            setTimeout(() => {
                setCopiedStates((prev) => ({ ...prev, [id]: false }));
            }, 1500);
        } catch (err) {}
    };

    const effectiveTz = timezone === "local" ? localTz : timezone;

    // Output Formats Generation
    let formattedOutputs = [
        { id: "iso", label: "ISO 8601", value: "" },
        { id: "rfc", label: "RFC 2822", value: "" },
        { id: "relative", label: "Relative Time", value: "" },
        { id: "local-str", label: "Local string representation", value: "" },
    ];

    if (parsedDate) {
        try {
            formattedOutputs[0].value = formatInTimeZone(parsedDate, effectiveTz, "yyyy-MM-dd'T'HH:mm:ssXXX");
            formattedOutputs[1].value = formatInTimeZone(parsedDate, effectiveTz, "EEE, dd MMM yyyy HH:mm:ss xx");
            formattedOutputs[2].value = formatDistanceToNow(parsedDate, { addSuffix: true });
            formattedOutputs[3].value = formatInTimeZone(parsedDate, effectiveTz, "PPpp");
        } catch {
            formattedOutputs[0].value = "Invalid Date";
        }
    }

    return (
        <div className="space-y-8">
            {/* Live Header */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Current Local Time</div>
                <div className="mt-2 flex items-baseline gap-2 font-mono text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                    {format(currentTime, "HH:mm:ss")}
                    <span className="text-lg text-zinc-400 dark:text-zinc-500">
                        {format(currentTime, "a")}
                    </span>
                </div>
                <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {format(currentTime, "EEEE, MMMM do, yyyy")}
                </div>
            </div>

            {/* Main Converter Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Inputs */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Inputs</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={handleUseCurrent}
                                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
                            >
                                <Clock className="h-3.5 w-3.5" />
                                Now
                            </button>
                            <button
                                onClick={handleClear}
                                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Clear
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/30">
                        {/* Timestamp Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Unix Timestamp
                            </label>
                            <div className="flex rounded-lg shadow-sm">
                                <input
                                    type="text"
                                    value={timestampInput}
                                    onChange={(e) => handleTimestampChange(e.target.value)}
                                    placeholder="e.g. 1718292831"
                                    className="block w-full min-w-0 flex-1 rounded-l-lg border-zinc-200 bg-white px-3 py-2 font-mono text-sm placeholder-zinc-400 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
                                />
                                <select
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value as any)}
                                    className="block rounded-r-lg border-l-0 border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                >
                                    <option value="auto">Auto</option>
                                    <option value="s">Sec</option>
                                    <option value="ms">Ms</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-center">
                            <CornerDownRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
                        </div>

                        {/* Date String Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Date / Time String
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Calendar className="h-4 w-4 text-zinc-400" />
                                </div>
                                <input
                                    type="text"
                                    value={dateInput}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    placeholder="e.g. 2026-09-08T12:00:00"
                                    className="block w-full rounded-lg border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
                                />
                            </div>
                        </div>

                        {/* Timezone Selector */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Timezone
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Globe className="h-4 w-4 text-zinc-400" />
                                </div>
                                <select
                                    value={timezone}
                                    onChange={(e) => setTimezone(e.target.value)}
                                    className="block w-full rounded-lg border-zinc-200 bg-white py-2 pl-9 pr-10 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                                >
                                    {TIMEZONES.map((tz) => (
                                        <option key={tz.value} value={tz.value}>
                                            {tz.label} {tz.value === "local" ? `(${localTz})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Outputs */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Outputs</h2>
                    
                    {!parsedDate && (
                        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Enter a valid timestamp or date to see conversions.
                            </p>
                        </div>
                    )}

                    {parsedDate && (
                        <div className="space-y-3">
                            {formattedOutputs.map((item) => (
                                <div
                                    key={item.id}
                                    className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                                >
                                    <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                        {item.label}
                                    </div>
                                    <div className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
                                        {item.value}
                                    </div>
                                    <button
                                        onClick={() => handleCopy(item.value, item.id)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-white p-1.5 text-zinc-400 opacity-0 shadow-sm ring-1 ring-inset ring-zinc-200 transition-all hover:bg-zinc-50 hover:text-zinc-600 group-hover:opacity-100 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                                        title={`Copy ${item.label}`}
                                    >
                                        {copiedStates[item.id] ? (
                                            <Check className="h-4 w-4 text-emerald-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

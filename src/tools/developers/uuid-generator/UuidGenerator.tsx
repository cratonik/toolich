"use client";

import { useState, useCallback } from "react";
import { Copy, Check, Trash2, RefreshCw, Layers } from "lucide-react";
import { useSessionState } from "@/lib/use-session-state";

// ---------------------------------------------------------------------------
// UUID generation helpers
// ---------------------------------------------------------------------------

/** Helper: convert a byte array to a hex string */
function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

/** Helper: write a 48-bit millisecond timestamp (big-endian) into 6 bytes */
function writeTimestamp48(bytes: Uint8Array, ms: number, offset: number): void {
    // ms fits in 48 bits (safe for ~8900 years from epoch)
    bytes[offset] = (ms / 0x10000000000) & 0xFF;
    bytes[offset + 1] = (ms / 0x100000000) & 0xFF;
    bytes[offset + 2] = (ms >>> 24) & 0xFF;
    bytes[offset + 3] = (ms >>> 16) & 0xFF;
    bytes[offset + 4] = (ms >>> 8) & 0xFF;
    bytes[offset + 5] = ms & 0xFF;
}

/** UUID v4 — fully random (RFC 4122) */
function generateUUIDv4(): string {
    return crypto.randomUUID();
}

/**
 * UUID v1 — timestamp-based (RFC 4122).
 *
 * Uses 100-ns intervals since 15 Oct 1582 for the timestamp, a random
 * 14-bit clock sequence, and a random 48-bit node (with multicast bit set).
 */
function generateUUIDv1(): string {
    // Gregorian epoch offset in ms: 1582-10-15 to 1970-01-01
    const GREGORIAN_OFFSET_MS = 12219292800000;
    const nowMs = Date.now() + GREGORIAN_OFFSET_MS;

    // Convert to 100-ns intervals: ms * 10000, plus random sub-ms jitter
    // Use two 32-bit halves to avoid precision loss
    const intervalsPer = 10000;
    const low = ((nowMs % 0x100000000) * intervalsPer + Math.floor(Math.random() * intervalsPer)) >>> 0;
    const high = Math.floor((nowMs / 0x100000000) * intervalsPer) >>> 0;

    // time_low (32 bits)
    const timeLow = low >>> 0;
    // time_mid (16 bits) — lower 16 bits of high portion
    const timeMid = high & 0xFFFF;
    // time_hi_and_version (16 bits) — upper bits of high + version 1
    const timeHiAndVersion = ((high >>> 16) & 0x0FFF) | 0x1000;

    const clockSeq = Math.floor(Math.random() * 0x3FFF) | 0x8000; // variant 10xx

    // Random node with multicast bit set (RFC 4122 §4.5)
    const nodeBytes = new Uint8Array(6);
    crypto.getRandomValues(nodeBytes);
    nodeBytes[0] |= 0x01; // multicast bit

    return [
        timeLow.toString(16).padStart(8, "0"),
        timeMid.toString(16).padStart(4, "0"),
        timeHiAndVersion.toString(16).padStart(4, "0"),
        clockSeq.toString(16).padStart(4, "0"),
        bytesToHex(nodeBytes),
    ].join("-");
}

/**
 * UUID v7 — Unix-epoch timestamp + random (RFC 9562).
 *
 * Layout: 48-bit ms timestamp | 4-bit version | 12-bit rand_a |
 *         2-bit variant | 62-bit rand_b
 */
function generateUUIDv7(): string {
    const now = Date.now();
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // Write 48-bit timestamp into bytes 0–5
    writeTimestamp48(bytes, now, 0);

    // version 7
    bytes[6] = (bytes[6] & 0x0F) | 0x70;
    // variant 10xx
    bytes[8] = (bytes[8] & 0x3F) | 0x80;

    const hex = bytesToHex(bytes);

    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20, 32),
    ].join("-");
}

const GENERATORS: Record<string, () => string> = {
    v4: generateUUIDv4,
    v7: generateUUIDv7,
    v1: generateUUIDv1,
};

type UUIDVersion = "v4" | "v7" | "v1";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UuidGenerator() {
    const [version, setVersion] = useSessionState<UUIDVersion>("uuid-gen:version", "v4");
    const [count, setCount] = useSessionState("uuid-gen:count", 1);
    const [uppercase, setUppercase] = useSessionState("uuid-gen:uppercase", false);
    const [hyphens, setHyphens] = useSessionState("uuid-gen:hyphens", true);
    const [uuids, setUuids] = useSessionState<string[]>("uuid-gen:uuids", []);

    // Track which row was just copied (index → true)
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [copiedAll, setCopiedAll] = useState(false);

    // ------ generation ------
    const generate = useCallback((overrideVersion?: UUIDVersion) => {
        const gen = GENERATORS[overrideVersion ?? version];
        const next: string[] = [];
        const num = Math.max(1, Math.min(500, count));
        for (let i = 0; i < num; i++) next.push(gen());
        setUuids(next);
    }, [version, count]);

    // ------ formatting ------
    const format = useCallback(
        (uuid: string) => {
            let out = hyphens ? uuid : uuid.replace(/-/g, "");
            return uppercase ? out.toUpperCase() : out.toLowerCase();
        },
        [uppercase, hyphens],
    );

    // ------ clipboard ------
    const copyOne = async (idx: number) => {
        await navigator.clipboard.writeText(format(uuids[idx]));
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 1500);
    };

    const copyAll = async () => {
        const text = uuids.map(format).join("\n");
        await navigator.clipboard.writeText(text);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 1500);
    };

    const handleClear = () => {
        setUuids([]);
    };

    // ------ count input handling ------
    const handleCountChange = (val: string) => {
        const n = parseInt(val, 10);
        if (!isNaN(n)) setCount(Math.max(1, Math.min(500, n)));
        else if (val === "") setCount(1);
    };

    // ------ version descriptions ------
    const VERSION_INFO: Record<UUIDVersion, string> = {
        v4: "Random — most common, uses cryptographic randomness",
        v7: "Timestamp + random — sortable, modern replacement for v1",
        v1: "Timestamp-based — includes creation time and random node",
    };

    return (
        <div className="space-y-6">
            {/* ── Controls ── */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60">
                <div className="flex flex-wrap items-end gap-5">
                    {/* Version */}
                    <div className="space-y-1.5 grid col-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Version
                        </label>
                        {/* The elements should take the full space in the box */}
                        <div className="flex w-full rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                            {(["v4", "v7", "v1"] as UUIDVersion[]).map((v) => (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => { setVersion(v); generate(v); }}
                                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${version === v
                                        ? "bg-indigo-600 text-white"
                                        : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                        }`}
                                >
                                    {v.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                            {VERSION_INFO[version]}
                        </p>
                    </div>

                    {/* Count */}
                    <div className="space-y-1.5 grid col-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Count
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={500}
                            value={count}
                            onChange={(e) => handleCountChange(e.target.value)}
                            className="w-24 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-indigo-500"
                        />
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">1–500</p>
                    </div>

                    {/* Formatting toggles */}
                    <div className="space-y-1.5 grid col-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Format
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setUppercase(!uppercase)}
                                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${uppercase
                                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-600/50 dark:bg-indigo-500/10 dark:text-indigo-400"
                                    : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
                                    }`}
                            >
                                {uppercase ? "UPPERCASE" : "lowercase"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setHyphens(!hyphens)}
                                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${hyphens
                                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-600/50 dark:bg-indigo-500/10 dark:text-indigo-400"
                                    : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
                                    }`}
                            >
                                {hyphens ? "with-hyphens" : "nohyphens"}
                            </button>
                        </div>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Format of the UUIDs</p>
                    </div>
                </div>

                {/* Generate button */}
                <div className="mt-5">
                    <button
                        type="button"
                        onClick={() => generate()}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.97]"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Generate {count > 1 ? `${count} UUIDs` : "UUID"}
                    </button>
                </div>
            </div>

            {/* ── Action bar (visible when there are results) ── */}
            {uuids.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={copyAll}
                        className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                    >
                        {copiedAll ? (
                            <>
                                <Check className="h-4 w-4 text-emerald-500" />
                                Copied All!
                            </>
                        ) : (
                            <>
                                <Layers className="h-4 w-4" />
                                Copy All
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleClear}
                        className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                    >
                        <Trash2 className="h-4 w-4" />
                        Clear
                    </button>

                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {uuids.length} UUID{uuids.length !== 1 && "s"} generated
                    </span>
                </div>
            )}

            {/* ── UUID list ── */}
            {uuids.length > 0 && (
                <div className="space-y-1.5">
                    {uuids.map((uuid, idx) => (
                        <div
                            key={`${uuid}-${idx}`}
                            className="group flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 transition-colors hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:border-zinc-600"
                        >
                            <span className="min-w-[2rem] text-right text-xs font-medium text-zinc-400 dark:text-zinc-500">
                                {idx + 1}
                            </span>
                            <code className="flex-1 select-all font-mono text-sm text-zinc-900 dark:text-zinc-100">
                                {format(uuid)}
                            </code>
                            <button
                                type="button"
                                onClick={() => copyOne(idx)}
                                className="shrink-0 rounded-md p-1.5 text-zinc-400 opacity-0 transition-all hover:bg-zinc-100 hover:text-zinc-700 group-hover:opacity-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                                title="Copy UUID"
                            >
                                {copiedIdx === idx ? (
                                    <Check className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Empty state ── */}
            {uuids.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 py-16 text-sm text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
                    <RefreshCw className="h-8 w-8 opacity-40" />
                    <span>Click &quot;Generate&quot; to create UUIDs</span>
                </div>
            )}
        </div>
    );
}

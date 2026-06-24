"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Copy, Check, Trash2, Key, Clock, Calendar, Info, User, Shield, AlertTriangle, CheckCircle, ShieldAlert, Globe } from "lucide-react";
import { useSessionState } from "@/lib/use-session-state";

// ── Web Crypto Helpers ───────────────────────────────────────────────────────

function base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
        base64 += "=";
    }
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes.buffer;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function generateSignedHS256Token(payload: Record<string, unknown>, secret: string): Promise<string> {
    const header = { alg: "HS256", typ: "JWT" };
    const encoder = new TextEncoder();
    
    const headerB64 = arrayBufferToBase64Url(encoder.encode(JSON.stringify(header)));
    const payloadB64 = arrayBufferToBase64Url(encoder.encode(JSON.stringify(payload)));
    
    const key = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    
    const signatureBuffer = await window.crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(`${headerB64}.${payloadB64}`)
    );
    
    const signatureB64 = arrayBufferToBase64Url(new Uint8Array(signatureBuffer));
    return `${headerB64}.${payloadB64}.${signatureB64}`;
}

async function verifyHmac(
    headerB64: string,
    payloadB64: string,
    signatureB64: string,
    secret: string,
    algorithmName: "HS256" | "HS384" | "HS512"
): Promise<boolean> {
    try {
        const encoder = new TextEncoder();
        const secretBytes = encoder.encode(secret);
        const hashName = algorithmName === "HS256" ? "SHA-256" : algorithmName === "HS384" ? "SHA-384" : "SHA-512";

        const key = await window.crypto.subtle.importKey(
            "raw",
            secretBytes,
            { name: "HMAC", hash: hashName },
            false,
            ["verify"]
        );

        const message = encoder.encode(`${headerB64}.${payloadB64}`);
        const sigBytes = base64UrlToArrayBuffer(signatureB64);

        return await window.crypto.subtle.verify(
            "HMAC",
            key,
            sigBytes,
            message
        );
    } catch (e) {
        console.error("HMAC WebCrypto verification failed:", e);
        return false;
    }
}

function base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
        base64 += "=";
    }
    try {
        return decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
    } catch {
        try {
            return atob(base64);
        } catch {
            throw new Error("Invalid base64 encoding");
        }
    }
}

// ── Time & Date Format Helpers ───────────────────────────────────────────────

function formatEpoch(epoch: number): string {
    return new Date(epoch * 1000).toLocaleString();
}

function getRelativeTime(epoch: number, now: number): { text: string; isPast: boolean } {
    const diff = epoch - now;
    const isPast = diff < 0;
    const absDiff = Math.abs(diff);

    if (absDiff < 60) {
        return { text: isPast ? "just now" : "in a few seconds", isPast };
    }

    const minutes = Math.floor(absDiff / 60);
    if (minutes < 60) {
        return { text: isPast ? `${minutes}m ago` : `in ${minutes}m`, isPast };
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        const minsLeft = minutes % 60;
        const relativeStr = minsLeft > 0 ? `${hours}h ${minsLeft}m` : `${hours}h`;
        return { text: isPast ? `${relativeStr} ago` : `in ${relativeStr}`, isPast };
    }

    const days = Math.floor(hours / 24);
    return { text: isPast ? `${days}d ago` : `in ${days}d`, isPast };
}

// ── Main UI Component ────────────────────────────────────────────────────────

type ActiveTab = "claims" | "payload" | "header" | "signature";

interface ParsedJwt {
    header: Record<string, unknown>;
    payload: Record<string, unknown>;
    signature: string;
    parts: string[];
}

export default function JwtDecoder() {
    const [token, setToken] = useSessionState("jwt:token", "");
    const [secret, setSecret] = useState("");
    const [activeTab, setActiveTab] = useState<ActiveTab>("claims");
    const [verifyStatus, setVerifyStatus] = useState<"unchecked" | "valid" | "invalid">("unchecked");
    const [copiedSec, setCopiedSec] = useState<Record<string, boolean>>({});
    const [now, setNow] = useState(Math.floor(Date.now() / 1000));
    const tokenInputRef = useRef<HTMLTextAreaElement>(null);

    // Keep live counter updated
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Math.floor(Date.now() / 1000));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Parse token properties
    const { parsed, error, alg, isExpired } = useMemo(() => {
        const trimmed = token.trim();
        if (!trimmed) {
            return { parsed: null, error: null, alg: "", isExpired: false };
        }

        const parts = trimmed.split(".");
        if (parts.length !== 3) {
            return {
                parsed: null,
                error: "Invalid token: A JWT must consist of exactly 3 parts separated by dots.",
                alg: "",
                isExpired: false,
            };
        }

        try {
            const headerStr = base64UrlDecode(parts[0]);
            const payloadStr = base64UrlDecode(parts[1]);

            const header = JSON.parse(headerStr);
            const payload = JSON.parse(payloadStr);

            const algName = header.alg || "";
            const exp = typeof payload.exp === "number" ? payload.exp : 0;
            const tokenExpired = exp > 0 && now >= exp;

            return {
                parsed: { header, payload, signature: parts[2], parts },
                error: null,
                alg: algName,
                isExpired: tokenExpired,
            };
        } catch (e: any) {
            return {
                parsed: null,
                error: `Invalid token: ${e.message || "Failed to decode segment."}`,
                alg: "",
                isExpired: false,
            };
        }
    }, [token, now]);

    // Handle Signature Verification when secret changes or token changes
    useEffect(() => {
        if (!parsed || !alg) {
            setVerifyStatus("unchecked");
            return;
        }

        const isHmac = ["HS256", "HS384", "HS512"].includes(alg);
        if (!isHmac || !secret) {
            setVerifyStatus("unchecked");
            return;
        }

        let active = true;
        verifyHmac(parsed.parts[0], parsed.parts[1], parsed.parts[2], secret, alg as any).then((isValid) => {
            if (active) {
                setVerifyStatus(isValid ? "valid" : "invalid");
            }
        });

        return () => {
            active = false;
        };
    }, [parsed, secret, alg]);

    // Actions
    const handleCopyText = async (text: string, key: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedSec((prev) => ({ ...prev, [key]: true }));
        setTimeout(() => {
            setCopiedSec((prev) => ({ ...prev, [key]: false }));
        }, 1500);
    };

    const handleClear = () => {
        setToken("");
        setSecret("");
        setVerifyStatus("unchecked");
    };

    const handleLoadExample = async () => {
        const exampleSecret = "toolich_super_secret";
        const currentEpoch = Math.floor(Date.now() / 1000);
        
        const payload = {
            sub: "usr_chaitanya123",
            name: "Chaitanya Shimpi",
            email: "chaitanya@toolich.com",
            roles: ["admin", "developer"],
            iss: "https://auth.toolich.com",
            aud: "toolich-web-app",
            iat: currentEpoch - 300,  // 5 minutes ago
            exp: currentEpoch + 3600, // 1 hour from now
        };

        try {
            const signedToken = await generateSignedHS256Token(payload, exampleSecret);
            setToken(signedToken);
            setSecret(exampleSecret);
            setActiveTab("claims");
        } catch (e) {
            console.error("Failed to generate example token:", e);
        }
    };

    // Render formatted claims block
    const claimsList = useMemo(() => {
        if (!parsed) return [];
        const payload = parsed.payload;
        const list: Array<{ claim: string; label: string; value: string; relative?: string; isAlert?: boolean; icon?: any }> = [];

        // Expiration
        if (typeof payload.exp === "number") {
            const rel = getRelativeTime(payload.exp, now);
            list.push({
                claim: "exp",
                label: "Expiration Time",
                value: formatEpoch(payload.exp),
                relative: rel.isPast ? `Expired ${rel.text}` : `Expires ${rel.text}`,
                isAlert: rel.isPast,
                icon: Clock,
            });
        }

        // Issued At
        if (typeof payload.iat === "number") {
            const rel = getRelativeTime(payload.iat, now);
            list.push({
                claim: "iat",
                label: "Issued At",
                value: formatEpoch(payload.iat),
                relative: `Issued ${rel.text}`,
                icon: Calendar,
            });
        }

        // Not Before
        if (typeof payload.nbf === "number") {
            const rel = getRelativeTime(payload.nbf, now);
            list.push({
                claim: "nbf",
                label: "Not Before Time",
                value: formatEpoch(payload.nbf),
                relative: rel.isPast ? `Became valid ${rel.text}` : `Valid ${rel.text}`,
                icon: Shield,
            });
        }

        // Issuer
        if (typeof payload.iss === "string") {
            list.push({
                claim: "iss",
                label: "Issuer",
                value: payload.iss,
                icon: Info,
            });
        }

        // Subject
        if (typeof payload.sub === "string") {
            list.push({
                claim: "sub",
                label: "Subject (User ID)",
                value: payload.sub,
                icon: User,
            });
        }

        // Audience
        if (payload.aud) {
            list.push({
                claim: "aud",
                label: "Audience",
                value: Array.isArray(payload.aud) ? payload.aud.join(", ") : String(payload.aud),
                icon: Globe,
            });
        }

        return list;
    }, [parsed, now]);

    // Custom claims list (non-standard metadata fields)
    const customClaimsList = useMemo(() => {
        if (!parsed) return [];
        const standardClaims = ["exp", "iat", "nbf", "iss", "sub", "aud"];
        return Object.entries(parsed.payload)
            .filter(([key]) => !standardClaims.includes(key))
            .map(([key, val]) => ({
                key,
                value: typeof val === "object" ? JSON.stringify(val) : String(val),
            }));
    }, [parsed]);

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-12">
                {/* ── Left Column: Token Input ── */}
                <div className="flex flex-col space-y-4 lg:col-span-5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Pasted JWT Token
                        </label>
                        <div className="flex gap-2">
                            {!token.trim() && (
                                <button
                                    type="button"
                                    onClick={handleLoadExample}
                                    className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-500 transition-all hover:border-indigo-300 hover:text-indigo-600 active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-indigo-600/50 dark:hover:text-indigo-400"
                                >
                                    Load Example
                                </button>
                            )}
                            {token && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-red-500 transition-all hover:border-red-300 hover:bg-red-50 active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-800 dark:text-red-400 dark:hover:border-red-950/20"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    <textarea
                        ref={tokenInputRef}
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Paste your JWT encoded token here (header.payload.signature)..."
                        rows={22}
                        spellCheck={false}
                        className={`w-full flex-1 resize-y rounded-xl border p-4 font-mono text-xs leading-relaxed shadow-sm outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 break-all ${
                            error
                                ? "border-red-300 bg-red-50/20 text-zinc-900 focus:border-red-400 focus:ring-2 focus:ring-red-500/20 dark:border-red-900/40 dark:bg-red-950/10 dark:text-zinc-100 dark:focus:border-red-900"
                                : "border-zinc-200 bg-white text-zinc-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:focus:border-indigo-500"
                        }`}
                    />

                    {/* Expiration or Format alerts */}
                    {error && (
                        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-800 dark:border-red-950/30 dark:bg-red-950/20 dark:text-red-400 animate-fadeIn">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                            <span>{error}</span>
                        </div>
                    )}

                    {isExpired && !error && (
                        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-medium text-amber-800 dark:border-amber-950/30 dark:bg-amber-950/20 dark:text-amber-400 animate-fadeIn">
                            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500 animate-pulse" />
                            <div>
                                <p className="font-semibold text-amber-950 dark:text-amber-300">Expired Token Warning</p>
                                <p className="mt-0.5 leading-relaxed text-amber-900 dark:text-amber-400">
                                    The timestamp payload checks show this token expired in the past.
                                </p>
                            </div>
                        </div>
                    )}

                    {parsed && !error && !isExpired && (
                        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-800 dark:border-emerald-950/30 dark:bg-emerald-950/20 dark:text-emerald-400 animate-fadeIn">
                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                            <div>
                                <p className="font-semibold text-emerald-950 dark:text-emerald-300">Token Format Valid</p>
                                <p className="mt-0.5 leading-relaxed text-emerald-900 dark:text-emerald-400">
                                    Decoded header and payload parts successfully. 
                                    {alg && ` Signature algorithm: ${alg}.`}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Right Column: Decoded Panels ── */}
                <div className="flex flex-col lg:col-span-7">
                    {/* Tab Navigation */}
                    <div className="flex items-center gap-1.5 border-b border-zinc-200 pb-3 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={() => setActiveTab("claims")}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                activeTab === "claims"
                                    ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-white"
                                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-white"
                            }`}
                        >
                            Claims Info
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("payload")}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                activeTab === "payload"
                                    ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-white"
                                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-white"
                            }`}
                        >
                            Payload JSON
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("header")}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                activeTab === "header"
                                    ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-white"
                                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-white"
                            }`}
                        >
                            Header JSON
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("signature")}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                activeTab === "signature"
                                    ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-white"
                                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-white"
                            }`}
                        >
                            Signature & Verification
                        </button>
                    </div>

                    {/* Tab Panels */}
                    <div className="flex-1 mt-4">
                        {!parsed ? (
                            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-zinc-200 border-dashed p-8 text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
                                <Shield className="mb-2.5 h-10 w-10 text-zinc-300 dark:text-zinc-700" />
                                <span className="text-sm font-medium">Please enter a token on the left to inspect properties</span>
                            </div>
                        ) : (
                            <>
                                {/* TAB 1: Claims List */}
                                {activeTab === "claims" && (
                                    <div className="space-y-6">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {claimsList.map((item) => {
                                                const ClaimIcon = item.icon || Info;
                                                return (
                                                    <div
                                                        key={item.claim}
                                                        className={`rounded-xl border p-4 shadow-xs transition-colors ${
                                                            item.isAlert
                                                                ? "border-red-100 bg-red-50/20 dark:border-red-950/20 dark:bg-red-950/10"
                                                                : "border-zinc-150 bg-white dark:border-zinc-850 dark:bg-zinc-900/40"
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex gap-2.5">
                                                                <div className={`mt-0.5 rounded-lg p-1.5 ${
                                                                    item.isAlert
                                                                        ? "bg-red-100/55 text-red-600 dark:bg-red-950 dark:text-red-400"
                                                                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-850 dark:text-zinc-400"
                                                                }`}>
                                                                    <ClaimIcon className="h-4 w-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                                                        {item.label}
                                                                    </p>
                                                                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 break-all">
                                                                        {item.value}
                                                                    </p>
                                                                    {item.relative && (
                                                                        <span className={`inline-block text-[10px] font-bold mt-1.5 rounded-full px-2 py-0.5 ${
                                                                            item.isAlert
                                                                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                                                : "bg-emerald-55 bg-opacity-10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                                                        }`}>
                                                                            {item.relative}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Custom claims */}
                                        {customClaimsList.length > 0 && (
                                            <div className="space-y-2.5">
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                                    Custom Claims
                                                </h3>
                                                <div className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-850 dark:bg-zinc-900/20">
                                                    <div className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
                                                        {customClaimsList.map((claim) => (
                                                            <div key={claim.key} className="flex flex-col text-xs">
                                                                <span className="font-bold text-zinc-500 dark:text-zinc-400">
                                                                    {claim.key}:
                                                                </span>
                                                                <span className="font-mono text-zinc-800 dark:text-zinc-200 break-all mt-0.5">
                                                                    {claim.value}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TAB 2: Payload JSON */}
                                {activeTab === "payload" && (
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => handleCopyText(JSON.stringify(parsed.payload, null, 2), "payload")}
                                            className="absolute right-4 top-4 z-10 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-all hover:bg-zinc-50 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                                        >
                                            {copiedSec["payload"] ? (
                                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                            ) : (
                                                <Copy className="h-3.5 w-3.5" />
                                            )}
                                        </button>
                                        <pre className="max-h-[480px] overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs leading-relaxed text-zinc-800 dark:border-zinc-850 dark:bg-zinc-900/30 dark:text-zinc-300">
                                            {JSON.stringify(parsed.payload, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {/* TAB 3: Header JSON */}
                                {activeTab === "header" && (
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => handleCopyText(JSON.stringify(parsed.header, null, 2), "header")}
                                            className="absolute right-4 top-4 z-10 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-all hover:bg-zinc-50 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                                        >
                                            {copiedSec["header"] ? (
                                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                            ) : (
                                                <Copy className="h-3.5 w-3.5" />
                                            )}
                                        </button>
                                        <pre className="max-h-[480px] overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs leading-relaxed text-zinc-800 dark:border-zinc-850 dark:bg-zinc-900/30 dark:text-zinc-300">
                                            {JSON.stringify(parsed.header, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {/* TAB 4: Signature details */}
                                {activeTab === "signature" && (
                                    <div className="space-y-5">
                                        {/* Algorithm Explanation */}
                                        <div className="rounded-xl border border-zinc-150 bg-white/70 p-4 dark:border-zinc-850 dark:bg-zinc-900/20 text-xs text-zinc-600 dark:text-zinc-400">
                                            <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                                                Algorithm: {alg || "None"}
                                            </h4>
                                            <p className="leading-relaxed">
                                                {["HS256", "HS384", "HS512"].includes(alg) ? (
                                                    <>
                                                        This token is signed with a symmetric key using HMAC-SHA. You can verify it below by entering the shared secret key.
                                                    </>
                                                ) : ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"].includes(alg) ? (
                                                    <>
                                                        This token is signed using asymmetric private/public keys (RSA or ECDSA). Signature verification requires the matching public key certificate.
                                                    </>
                                                ) : (
                                                    <>
                                                        No signature algorithm identified. This token is unsigned.
                                                    </>
                                                )}
                                            </p>
                                        </div>

                                        {/* Signature verification control */}
                                        {["HS256", "HS384", "HS512"].includes(alg) && (
                                            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-1.5">
                                                    <Key className="h-3.5 w-3.5 text-indigo-500" />
                                                    HMAC Signature Verification
                                                </h4>
                                                
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                                                            HMAC Secret Key (pasted client-side only)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={secret}
                                                            onChange={(e) => setSecret(e.target.value)}
                                                            placeholder="Enter signature secret key to verify..."
                                                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 outline-none transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-indigo-500"
                                                        />
                                                    </div>

                                                    {/* Verification outcome status */}
                                                    {secret && verifyStatus === "valid" && (
                                                        <div className="flex items-center gap-2.5 rounded-lg border border-emerald-250 bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-800 dark:border-emerald-950/20 dark:bg-emerald-950/15 dark:text-emerald-400 animate-fadeIn">
                                                            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                                                            <span>Signature successfully verified! The payload has not been tampered with.</span>
                                                        </div>
                                                    )}

                                                    {secret && verifyStatus === "invalid" && (
                                                        <div className="flex items-center gap-2.5 rounded-lg border border-red-250 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-800 dark:border-red-950/20 dark:bg-red-950/15 dark:text-red-400 animate-fadeIn">
                                                            <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />
                                                            <span>Signature mismatch! The key is incorrect or the payload has been altered.</span>
                                                        </div>
                                                    )}

                                                    {!secret && (
                                                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                                                            <Info className="h-3 w-3" />
                                                            <span>Enter the HMAC secret above to run the cryptographic verify operation.</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Raw Signature string */}
                                        <div className="space-y-2">
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                                Raw Signature
                                            </h4>
                                            <pre className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-[10px] text-zinc-500 dark:border-zinc-850 dark:bg-zinc-900/30 dark:text-zinc-500 break-all leading-normal">
                                                {parsed.signature || "No Signature found"}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

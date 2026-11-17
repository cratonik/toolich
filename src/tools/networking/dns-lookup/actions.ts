"use server";

import dns from "node:dns/promises";
import { headers } from "next/headers";
import { getRedis } from "@/lib/redis";
import { getClientIpFromHeaders } from "@/lib/client-ip";

const SUPPORTED_TYPES = new Set(["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA"]);
const LOOKUPS_PER_MINUTE = 30;

// Names that only exist on private networks. Resolving them from the server would
// reveal internal addresses (e.g. Docker service names like "redis").
const PRIVATE_SUFFIXES = ["localhost", "local", "localdomain", "internal", "intranet", "lan", "home", "corp", "home.arpa", "arpa"];

/**
 * Normalise user input to a public hostname, or return null.
 * Accepts pasted URLs ("https://example.com/path") and trailing dots.
 * Requires at least two labels and an alphabetic TLD, which rules out IP
 * literals and single-label internal names.
 */
function normalizeDomain(input: string): string | null {
    let host = input.trim().toLowerCase();
    if (host.includes("://")) {
        try {
            host = new URL(host).hostname;
        } catch {
            return null;
        }
    }
    host = host.split("/")[0].replace(/\.$/, "");
    if (!host || host.length > 253) return null;

    const labels = host.split(".");
    if (labels.length < 2) return null;
    const labelOk = (l: string) => /^[a-z0-9_]([a-z0-9_-]{0,61}[a-z0-9_])?$/.test(l);
    if (!labels.every(labelOk)) return null;
    const tld = labels[labels.length - 1];
    if (!/^([a-z]{2,63}|xn--[a-z0-9-]{1,59})$/.test(tld)) return null;
    if (PRIVATE_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`))) return null;
    return host;
}

/** Returns true when this client is over the limit. Fails open if Redis is down. */
async function isRateLimited(): Promise<boolean> {
    try {
        const ip = getClientIpFromHeaders(await headers());
        const redis = await getRedis();
        const key = `rate_limit:dns:${ip}`;
        const count = await redis.incr(key);
        if (count === 1) await redis.expire(key, 60);
        return count > LOOKUPS_PER_MINUTE;
    } catch (err) {
        console.error("DNS rate limit error:", err);
        return false;
    }
}

export type DnsRecord = {
    type: string;
    value: string;
    ttl?: number;
    priority?: number; // for MX
    exchange?: string; // for MX
    admin?: string; // for SOA
    hostmaster?: string; // for SOA
    serial?: number; // for SOA
    refresh?: number; // for SOA
    retry?: number; // for SOA
    expire?: number; // for SOA
    minttl?: number; // for SOA
};

export async function queryDns(domain: string, type: string): Promise<{ records: DnsRecord[]; error?: string }> {
    if (typeof domain !== "string" || typeof type !== "string" || !domain.trim()) return { records: [] };

    const recordType = type.toUpperCase();
    if (!SUPPORTED_TYPES.has(recordType)) {
        return { records: [], error: `Unsupported record type: ${type}` };
    }
    const host = normalizeDomain(domain);
    if (!host) {
        return { records: [], error: "Enter a valid public domain name, e.g. example.com" };
    }
    if (await isRateLimited()) {
        return { records: [], error: "Too many lookups. Please wait a minute and try again." };
    }
    domain = host;

    try {
        switch (recordType) {
            case "A": {
                const aRecords = await dns.resolve4(domain, { ttl: true });
                return { records: aRecords.map((r) => ({ type: "A", value: r.address, ttl: r.ttl })) };
            }
            case "AAAA": {
                const aaaaRecords = await dns.resolve6(domain, { ttl: true });
                return { records: aaaaRecords.map((r) => ({ type: "AAAA", value: r.address, ttl: r.ttl })) };
            }
            case "MX": {
                const mxRecords = await dns.resolveMx(domain);
                return {
                    records: mxRecords.map((r) => ({
                        type: "MX",
                        value: `${r.priority} ${r.exchange}`,
                        priority: r.priority,
                        exchange: r.exchange,
                    })),
                };
            }
            case "TXT": {
                const txtChunks = await dns.resolveTxt(domain);
                return { records: txtChunks.map((r) => ({ type: "TXT", value: r.join(" ") })) };
            }
            case "NS": {
                const nsRecords = await dns.resolveNs(domain);
                return { records: nsRecords.map((r) => ({ type: "NS", value: r })) };
            }
            case "CNAME": {
                const cnameRecords = await dns.resolveCname(domain);
                return { records: cnameRecords.map((r) => ({ type: "CNAME", value: r })) };
            }
            case "SOA":
                const soa = await dns.resolveSoa(domain);
                return {
                    records: [{
                        type: "SOA",
                        value: `${soa.nsname} ${soa.hostmaster} ${soa.serial} ${soa.refresh} ${soa.retry} ${soa.expire} ${soa.minttl}`,
                        admin: soa.nsname,
                        hostmaster: soa.hostmaster,
                        serial: soa.serial,
                        refresh: soa.refresh,
                        retry: soa.retry,
                        expire: soa.expire,
                        minttl: soa.minttl
                    }]
                };
            default:
                return { records: [], error: `Unsupported record type: ${type}` };
        }
    } catch (err: unknown) {
        const code =
            err && typeof err === "object" && "code" in err ? String((err as { code?: string }).code) : "";
        if (code === "ENOTFOUND" || code === "ENODATA") {
            return { records: [], error: "No records found for this domain." };
        }
        const message = err instanceof Error ? err.message : "An error occurred during DNS lookup.";
        return { records: [], error: message };
    }
}

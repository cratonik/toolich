"use server";

import dns from "node:dns/promises";

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
    if (!domain) return { records: [] };

    try {
        switch (type.toUpperCase()) {
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

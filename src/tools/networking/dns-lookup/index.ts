import type { ToolMeta } from "@/lib/tool-registry";

export const toolMeta: ToolMeta = {
    name: "DNS Lookup",
    slug: "dns-lookup",
    description: "Query DNS records for any domain name, displaying A, AAAA, CNAME, MX, TXT, NS, and SOA records.",
    category: "networking",
    keywords: [
        "dns", "lookup", "resolver", "domain", "records",
        "a", "aaaa", "cname", "mx", "txt", "ns", "soa",
        "ttl", "network", "networking",
    ],
};

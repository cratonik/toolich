import type { ToolMetaWithPath } from "@/lib/tool-registry";

const SITE_URL = "https://toolich.com";

/** Serialise JSON-LD safely for inline <script> (a literal "</script>" can't break out). */
function JsonLd({ data }: { data: Record<string, unknown> }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
        />
    );
}

export function ToolStructuredData({ tool }: { tool: ToolMetaWithPath }) {
    return (
        <JsonLd
            data={{
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": tool.name,
                "description": tool.description,
                "applicationCategory": "DeveloperApplication",
                "operatingSystem": "All",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD",
                },
                "url": `${SITE_URL}${tool.path}`,
            }}
        />
    );
}

export function CollectionStructuredData({
    name,
    description,
    path,
    tools,
}: {
    name: string;
    description: string;
    path: string;
    tools: ToolMetaWithPath[];
}) {
    return (
        <JsonLd
            data={{
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                "name": name,
                "description": description,
                "url": `${SITE_URL}${path}`,
                "mainEntity": {
                    "@type": "ItemList",
                    "itemListElement": tools.map((tool, i) => ({
                        "@type": "ListItem",
                        "position": i + 1,
                        "name": tool.name,
                        "url": `${SITE_URL}${tool.path}`,
                    })),
                },
            }}
        />
    );
}

export function HomeStructuredData() {
    // No SearchAction: the site has no server-side ?q= search to point it at.
    return (
        <JsonLd
            data={{
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "Toolich",
                "url": SITE_URL,
            }}
        />
    );
}

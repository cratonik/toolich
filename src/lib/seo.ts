import type { Metadata } from "next";

interface MetadataInput {
    title: string;
    description: string;
    path: string;
    keywords?: string[];
}

export function constructMetadata({
    title,
    description,
    path,
    keywords = [],
}: MetadataInput): Metadata {
    const siteUrl = "https://toolich.com";
    const fullUrl = `${siteUrl}${path}`;

    return {
        title: `${title} | Toolich`,
        description,
        keywords: [
            ...keywords,
            "developer tools",
            "online utilities",
            "free web tools",
            "DevOps helpers",
            "programming tools",
            "code formatters",
        ],
        alternates: {
            canonical: fullUrl,
        },
        openGraph: {
            type: "website",
            title: `${title} | Toolich`,
            description,
            url: fullUrl,
            siteName: "Toolich",
            locale: "en_US",
        },
        twitter: {
            card: "summary_large_image",
            title: `${title} | Toolich`,
            description,
        },
    };
}

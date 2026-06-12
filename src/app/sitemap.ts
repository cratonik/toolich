import { MetadataRoute } from "next";
import { allTools } from "@/lib/tool-registry";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://toolich.com";

    // 1. Static base pages
    const staticPages = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 1.0,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.3,
        },
    ];

    // 2. Category pages
    const categories = ["developers", "devops", "security", "networking", "managers"];
    const categoryPages = categories.map((cat) => ({
        url: `${baseUrl}/tools/${cat}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    // 3. Dynamic tool pages from the central registry
    const toolPages = allTools.map((tool) => ({
        url: `${baseUrl}${tool.path}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.8,
    }));

    return [...staticPages, ...categoryPages, ...toolPages];
}

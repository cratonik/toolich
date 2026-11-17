import { MetadataRoute } from "next";
import { allTools } from "@/lib/tool-registry";
import { fetchBlogs } from "@/lib/blog-api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.5,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.5,
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

    // 4. Blog pages
    const blogPages: MetadataRoute.Sitemap = [];
    const blogs = await fetchBlogs();
    if (blogs && blogs.length > 0) {
        // Add the main /blogs page
        blogPages.push({
            url: `${baseUrl}/blogs`,
            lastModified: new Date(blogs[0].createdAt),
            changeFrequency: "weekly" as const,
            priority: 0.9,
        });

        // Individual posts are not listed: they are copies of the cratonik.com
        // originals and declare those as canonical, so listing them here would
        // send Google conflicting signals.
    }

    return [...staticPages, ...categoryPages, ...toolPages, ...blogPages];
}

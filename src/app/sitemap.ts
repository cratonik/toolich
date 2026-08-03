import { MetadataRoute } from "next";
import { allTools } from "@/lib/tool-registry";

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
    let blogPages: MetadataRoute.Sitemap = [];
    try {
        const res = await fetch('https://www.cratonik.com/api/blog', { next: { revalidate: 3600 } });
        if (res.ok) {
            const blogs = await res.json();
            
            // Add the main /blogs page
            blogPages.push({
                url: `${baseUrl}/blogs`,
                lastModified: blogs.length > 0 ? new Date(blogs[0].createdAt) : new Date(),
                changeFrequency: "weekly" as const,
                priority: 0.9,
            });

            // Add individual blogs
            for (const blog of blogs) {
                const slug = encodeURIComponent(blog.title.replace(/\s+/g, '-').toLowerCase());
                blogPages.push({
                    url: `${baseUrl}/blogs/${slug}`,
                    lastModified: new Date(blog.createdAt),
                    changeFrequency: "monthly" as const,
                    priority: 0.8,
                });
            }
        }
    } catch (e) {
        console.error("Failed to fetch blogs for sitemap", e);
    }

    return [...staticPages, ...categoryPages, ...toolPages, ...blogPages];
}

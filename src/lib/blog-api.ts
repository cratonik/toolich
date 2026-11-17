/**
 * Blog posts are served by cratonik.com. Every caller goes through here so a
 * slow or failing upstream never crashes a page: we time out quickly and
 * return null instead of throwing.
 */

/** Shape returned by cratonik.com/api/blog (all fields are strings). */
export type BlogPost = {
    title: string;
    createdAt: string;
    author: string;
    image: string;
    para1: string;
    [key: string]: string;
};

const BLOG_API_URL = "https://www.cratonik.com/api/blog";
const TIMEOUT_MS = 5000;

/** Cached for 5 minutes by Next's fetch cache. Returns null when the blog API is unavailable. */
export async function fetchBlogs(): Promise<BlogPost[] | null> {
    try {
        const res = await fetch(BLOG_API_URL, {
            next: { revalidate: 300 },
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!res.ok) return null;
        const data: unknown = await res.json();
        return Array.isArray(data) ? (data as BlogPost[]) : null;
    } catch {
        return null;
    }
}

/** URL slug used for /blogs/<slug> (must stay in sync with existing links). */
export function blogSlug(title: string): string {
    return encodeURIComponent(title.replace(/\s+/g, "-").toLowerCase());
}

export function findBlogBySlug(blogs: BlogPost[], slug: string): BlogPost | undefined {
    let decoded = slug;
    try {
        decoded = decodeURIComponent(slug);
    } catch {
        // malformed escape sequence; compare raw
    }
    return blogs.find(
        (b) =>
            blogSlug(b.title) === slug ||
            b.title.replace(/\s+/g, "-").toLowerCase() === decoded,
    );
}

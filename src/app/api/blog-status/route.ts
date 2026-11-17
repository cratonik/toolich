import { NextResponse } from "next/server";
import { fetchBlogs } from "@/lib/blog-api";

// Lets the client hide blog links while cratonik.com's blog API is down.
export const dynamic = "force-dynamic";

export async function GET() {
    const blogs = await fetchBlogs();
    return NextResponse.json(
        { available: blogs !== null && blogs.length > 0 },
        { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } },
    );
}

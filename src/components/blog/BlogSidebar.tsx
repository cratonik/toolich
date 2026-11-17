import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, LayoutGrid, UserRound, Wrench } from "lucide-react";
import type { ToolMetaWithPath } from "@/lib/tool-registry";
import { CATEGORY_LABELS } from "@/lib/routes";
import { blogSlug, type BlogPost } from "@/lib/blog-api";
import { ShareButtons } from "./ShareButtons";

const CARD = "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900";
const HEADING = "mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400";

export function formatBlogDate(iso: string): string {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function readingMinutes(blog: BlogPost): number {
    const words = [blog.para1, blog.para2, blog.para3].join(" ").trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
}

type Props = {
    blog: BlogPost;
    url: string;
    tool: ToolMetaWithPath | null;
    relatedTools: ToolMetaWithPath[];
    moreBlogs: BlogPost[];
};

export function BlogSidebar({ blog, url, tool, relatedTools, moreBlogs }: Props) {
    const topics = (blog.keywords ?? "")
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
        .slice(0, 6);

    return (
        <aside className="space-y-5">
            {/* Try the tool the article is about */}
            {tool ? (
                <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm dark:border-indigo-500/30 dark:from-indigo-500/10 dark:to-zinc-900">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        <Wrench className="h-3.5 w-3.5" />
                        Try it now
                    </div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{tool.name}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{tool.description}</p>
                    <Link
                        href={tool.path}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
                    >
                        Open {tool.name}
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                    <p className="mt-2 text-center text-[11px] text-zinc-500 dark:text-zinc-400">Free · runs in your browser</p>
                </div>
            ) : (
                <div className={CARD}>
                    <div className={HEADING}>Explore Toolich</div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Free developer tools for everyday work.</p>
                    <Link
                        href="/tools"
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
                    >
                        <LayoutGrid className="h-4 w-4" />
                        Browse all tools
                    </Link>
                </div>
            )}

            {/* Article details + share */}
            <div className={CARD}>
                <div className={HEADING}>About this article</div>
                <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <li className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-zinc-400" />
                        {readingMinutes(blog)} min read
                    </li>
                    <li className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-zinc-400" />
                        {formatBlogDate(blog.createdAt)}
                    </li>
                    {blog.author && (
                        <li className="flex items-center gap-2">
                            <UserRound className="h-4 w-4 text-zinc-400" />
                            {blog.author}
                        </li>
                    )}
                </ul>
                <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                    <div className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Share</div>
                    <ShareButtons url={url} title={blog.title} />
                </div>
            </div>

            {/* Related tools in the same category */}
            {relatedTools.length > 0 && tool && (
                <div className={CARD}>
                    <div className={HEADING}>More {CATEGORY_LABELS[tool.category] ?? ""} tools</div>
                    <ul className="space-y-1">
                        {relatedTools.map((t) => (
                            <li key={t.path}>
                                <Link
                                    href={t.path}
                                    className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-indigo-600 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-indigo-400"
                                >
                                    {t.name}
                                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Topics from the post's keywords */}
            {topics.length > 0 && (
                <div className={CARD}>
                    <div className={HEADING}>Topics</div>
                    <div className="flex flex-wrap gap-1.5">
                        {topics.map((t) => (
                            <span
                                key={t}
                                className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* More articles */}
            {moreBlogs.length > 0 && (
                <div className={CARD}>
                    <div className={HEADING}>More articles</div>
                    <ul className="space-y-3">
                        {moreBlogs.map((b) => (
                            <li key={b.id ?? b.title}>
                                <Link href={`/blogs/${blogSlug(b.title)}`} className="group flex gap-3">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`https://www.cratonik.com${b.image}`}
                                        alt=""
                                        loading="lazy"
                                        className="h-12 w-16 shrink-0 rounded-md bg-zinc-100 object-cover dark:bg-zinc-800"
                                    />
                                    <div className="min-w-0">
                                        <p className="line-clamp-2 text-sm font-medium leading-snug text-zinc-800 group-hover:text-indigo-600 dark:text-zinc-200 dark:group-hover:text-indigo-400">
                                            {b.title}
                                        </p>
                                        <p className="mt-0.5 text-xs text-zinc-500">{formatBlogDate(b.createdAt)}</p>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <Link
                        href="/blogs"
                        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                        All articles <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            )}
        </aside>
    );
}

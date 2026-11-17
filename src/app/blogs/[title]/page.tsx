import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import Footer from '@/components/Footer';
import { StaticFloatingDock } from "@/components/StaticFloatingDock";
import { fetchBlogs, findBlogBySlug, blogSlug, originalBlogUrl } from "@/lib/blog-api";
import { allTools, getToolsByCategory } from "@/lib/tool-registry";
import { findToolForBlog } from "@/lib/blog-tool-match";
import { BlogSidebar, formatBlogDate, readingMinutes } from "@/components/blog/BlogSidebar";

type Props = {
  params: Promise<{ title: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { title } = await params;
  const titleSlug = title;
  
  const blogs = await fetchBlogs();
  if (!blogs) return { title: 'Blog' };

  const blog = findBlogBySlug(blogs, titleSlug);
  if (!blog) return { title: 'Not Found' };
  
  const imageUrl = `https://www.cratonik.com${blog.image}`;
  
  return {
    title: blog.title,
    description: blog.para1,
    // Same post is published on cratonik.com; point search engines at the original.
    alternates: { canonical: originalBlogUrl(blog.title) },
    openGraph: {
      title: blog.title,
      description: blog.para1,
      type: "article",
      publishedTime: blog.createdAt,
      authors: [blog.author],
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.para1,
      images: [imageUrl],
    }
  };
}

export default async function BlogDetail({ params }: Props) {
  const { title } = await params;
  const titleSlug = title;
  
  const blogs = await fetchBlogs();
  if (!blogs) return notFound();

  const blog = findBlogBySlug(blogs, titleSlug);

  if (!blog) return notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.title,
    "image": `https://www.cratonik.com${blog.image}`,
    "author": {
      "@type": "Person",
      "name": blog.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Toolich",
      "logo": {
        "@type": "ImageObject",
        "url": "https://toolich.com/icon-512.png"
      }
    },
    "datePublished": blog.createdAt,
    "mainEntityOfPage": originalBlogUrl(blog.title),
    "description": blog.para1,
  };

  const url = `https://toolich.com/blogs/${blogSlug(blog.title)}`;
  const tool = findToolForBlog(blog, allTools);
  const relatedTools = tool
    ? getToolsByCategory(tool.category).filter((t) => t.slug !== tool.slug).slice(0, 4)
    : [];
  const moreBlogs = blogs
    .filter((b) => b.title !== blog.title)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  return (
    <>
      <div className="min-h-[calc(100vh-80px)] bg-zinc-50 dark:bg-zinc-950 pt-20 pb-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to blogs
          </Link>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="min-w-0">
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
              />
              <header className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl mb-4">
                  {blog.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <span>{formatBlogDate(blog.createdAt)}</span>
                  <span>•</span>
                  <span>{blog.author}</span>
                  <span>•</span>
                  <span>{readingMinutes(blog)} min read</span>
                </div>
              </header>

              <div className="mb-10 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://www.cratonik.com${blog.image}`}
                  alt={blog.title}
                  className="h-full w-full object-cover object-center"
                />
              </div>

              <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300">
                <p className="text-lg leading-relaxed mb-6 font-medium text-zinc-900 dark:text-zinc-100">
                  {blog.para1}
                </p>
                {blog.para2 && <p className="leading-relaxed mb-6">{blog.para2}</p>}
                {blog.para3 && <p className="leading-relaxed mb-6">{blog.para3}</p>}
              </div>
            </article>

            <BlogSidebar blog={blog} url={url} tool={tool} relatedTools={relatedTools} moreBlogs={moreBlogs} />
          </div>
        </div>
      </div>
      <Footer />
      <StaticFloatingDock />
    </>
  );
}

import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';
import { StaticFloatingDock } from "@/components/StaticFloatingDock";

export const metadata: Metadata = {
  title: 'Blog | Toolich',
  description: 'Read the latest tutorials, updates, and developer guides from Toolich.',
  openGraph: {
    title: 'Blog | Toolich',
    description: 'Read the latest tutorials, updates, and developer guides from Toolich.',
    url: 'https://toolich.com/blogs',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Toolich',
    description: 'Read the latest tutorials, updates, and developer guides from Toolich.',
  }
};

export default async function BlogsPage() {
  const res = await fetch('https://www.cratonik.com/api/blog', { next: { revalidate: 3600 } });
  
  if (!res.ok) {
    return (
      <div className="min-h-screen bg-zinc-50 pt-20 dark:bg-zinc-950">
        <div className="p-8 text-center text-zinc-500">Failed to load blogs.</div>
      </div>
    );
  }
  
  const blogs = await res.json();

  return (
    <>
      <div className="min-h-[calc(100vh-80px)] bg-zinc-50 dark:bg-zinc-950 pt-20 pb-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8">
            Blog
          </h1>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog: any) => {
            const slug = encodeURIComponent(blog.title.replace(/\s+/g, '-').toLowerCase());
            return (
              <Link 
                key={blog.id} 
                href={`/blogs/${slug}`} 
                className="group flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/50"
              >
                <div className="aspect-[16/9] w-full overflow-hidden rounded-t-2xl bg-zinc-100 dark:bg-zinc-800">
                  <img 
                    src={`https://www.cratonik.com${blog.image}`} 
                    alt={blog.title} 
                    className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-center text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                    <span className="mx-2">•</span>
                    <span>{blog.author}</span>
                  </div>
                  <h2 className="mb-3 text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {blog.title}
                  </h2>
                  <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {blog.para1}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
          </div>
        </div>
      <Footer />
      <StaticFloatingDock />
    </>
  );
}

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import Footer from '@/components/Footer';
import { StaticFloatingDock } from "@/components/StaticFloatingDock";

type Props = {
  params: Promise<{ title: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { title } = await params;
  const titleSlug = title;
  
  const res = await fetch('https://www.cratonik.com/api/blog');
  if (!res.ok) return { title: 'Not Found' };
  
  const blogs = await res.json();
  const blog = blogs.find((b: any) => 
    encodeURIComponent(b.title.replace(/\s+/g, '-').toLowerCase()) === titleSlug || 
    b.title.replace(/\s+/g, '-').toLowerCase() === decodeURIComponent(titleSlug)
  );
  
  if (!blog) return { title: 'Not Found' };
  
  const imageUrl = `https://www.cratonik.com${blog.image}`;
  
  return { 
    title: blog.title, 
    description: blog.para1,
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
  
  const res = await fetch('https://www.cratonik.com/api/blog', { next: { revalidate: 3600 } });
  if (!res.ok) return notFound();
  
  const blogs = await res.json();
  const blog = blogs.find((b: any) => 
    encodeURIComponent(b.title.replace(/\s+/g, '-').toLowerCase()) === titleSlug || 
    b.title.replace(/\s+/g, '-').toLowerCase() === decodeURIComponent(titleSlug)
  );

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
        "url": "https://toolich.com/icon-192.svg"
      }
    },
    "datePublished": blog.createdAt,
    "description": blog.para1,
  };

  return (
    <>
      <div className="min-h-[calc(100vh-80px)] bg-zinc-50 dark:bg-zinc-950 pt-20 pb-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link 
          href="/blogs" 
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to blogs
        </Link>
        
        <article>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <header className="mb-10 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl mb-4">
              {blog.title}
            </h1>
            <div className="flex items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
              <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
              <span className="mx-2">•</span>
              <span>{blog.author}</span>
            </div>
          </header>
          
          <div className="mb-10 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 shadow-md">
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
      </div>
    </div>
    <Footer />
    <StaticFloatingDock />
    </>
  );
}

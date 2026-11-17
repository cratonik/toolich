import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Server-level 308s for legacy URLs (page-level redirects on static pages only
  // redirect client-side and still return 200; `__all__` is a private folder name
  // in the App Router, so a page there is never routed at all).
  redirects: async () => [
    {
      source: "/tools/manager/markdown-editor",
      destination: "/tools/managers/markdown-editor",
      permanent: true,
    },
    {
      source: "/tools/__all__",
      destination: "/tools",
      permanent: true,
    },
  ],
  headers: async () => [
    // Mirrors of the site (toolich.vercel.app, toolich.netlify.app, preview
    // deploys…) must not be indexed: they are full duplicates of toolich.com.
    {
      source: "/:path*",
      // Matched on the Host header. Production sits behind Nginx Proxy Manager,
      // which forwards the original Host (proxy_set_header Host $host). After
      // deploying, `curl -sI https://toolich.com` must show no X-Robots-Tag.
      missing: [{ type: "host", value: "(www\\.)?toolich\\.com" }],
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    },
    {
      source: "/sw.js",
      headers: [
        {
          key: "Service-Worker-Allowed",
          value: "/",
        },
        {
          key: "Cache-Control",
          value: "no-cache, no-store, must-revalidate",
        },
      ],
    },
  ],
};

export default nextConfig;

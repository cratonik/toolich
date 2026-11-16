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

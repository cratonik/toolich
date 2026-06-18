import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { SearchProvider } from "@/components/SpotlightSearch";
import { TabProvider } from "@/lib/tab-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ToastProvider } from "@/components/Toast";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://toolich.com"),
  title: {
    default: "Toolich — Developer Tools & Utilities",
    template: "%s | Toolich"
  },
  description: "A fast, minimal, and secure collection of everyday developer tools, DevOps helpers, networking tools, and code formatters.",
  keywords: [
    "developer tools",
    "JSON formatter",
    "Base64 encoder",
    "YAML to JSON",
    "diff checker",
    "UUID generator",
    "subnet calculator",
    "cron parser",
    "regex tester",
    "hash generator",
    "DNS lookup",
    "markdown editor",
    "networking utilities"
  ],
  authors: [{ name: "Chaitanya Shimpi", url: "https://chaitany.com" }],
  creator: "Chaitanya Shimpi",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://toolich.com",
    title: "Toolich — Developer Tools & Utilities",
    description: "Fast, minimal, and secure online utilities built for developers, engineers, and DevOps managers.",
    siteName: "Toolich"
  },
  twitter: {
    card: "summary_large_image",
    title: "Toolich — Developer Tools & Utilities",
    description: "Fast, minimal, and secure online utilities built for developers, engineers, and DevOps managers."
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Inline script to apply the saved theme BEFORE React hydrates, preventing
// a flash of the wrong theme. Runs synchronously in <head>.
const themeScript = `(function(){try{var t=localStorage.getItem('toolich-theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`;

// Register service worker for PWA support
const swScript = `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js')})}`;

// Microsoft Clarity analytics
const clarityScript = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "x917gspjef");`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-Q4GXZK2JXF"></script>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5052542306758700" crossOrigin="anonymous"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-Q4GXZK2JXF');
            `,
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <meta name="google-adsense-account" content="ca-pub-5052542306758700" />
        <script dangerouslySetInnerHTML={{ __html: swScript }} />
        <script dangerouslySetInnerHTML={{ __html: clarityScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <TabProvider>
            <SearchProvider>
              <ToastProvider>
                <Header />
                {children}
                <SpeedInsights />
              </ToastProvider>
            </SearchProvider>
          </TabProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { SearchProvider } from "@/components/SpotlightSearch";
import { TabProvider } from "@/lib/tab-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ShortcutHelp } from "@/components/ShortcutHelp";
import { ToastProvider } from "@/components/Toast";

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
  title: "Toolich — Developer Tools",
  description:
    "A platform to help you with development and day-to-day corporate work.",
};

// Inline script to apply the saved theme BEFORE React hydrates, preventing
// a flash of the wrong theme. Runs synchronously in <head>.
const themeScript = `(function(){try{var t=localStorage.getItem('toolich-theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
                <ShortcutHelp />
              </ToastProvider>
            </SearchProvider>
          </TabProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

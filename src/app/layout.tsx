import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { SearchProvider } from "@/components/SpotlightSearch";
import { TabProvider } from "@/lib/tab-context";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} antialiased`}
        suppressHydrationWarning
      >
        <TabProvider>
          <SearchProvider>
            <ToastProvider>
              <Header />
              {children}
              <ShortcutHelp />
            </ToastProvider>
          </SearchProvider>
        </TabProvider>
      </body>
    </html>
  );
}

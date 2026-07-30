"use client";

import Image from "next/image";
import Link from "next/link";
import { SearchTrigger, SearchModal } from "./SpotlightSearch";
import { ThemeToggle } from "./ThemeToggle";
import { GlobalTasksPopover } from "./GlobalTasksPopover";
import { useTabContext } from "@/lib/tab-context";
import { ShieldCheck } from "lucide-react";

type HeaderProps = {
  githubUrl?: string;
};

export default function Header({
  githubUrl = "https://github.com/cratonik/toolich",
}: HeaderProps) {
  const { isWide, goHome } = useTabContext();

  return (
    <>
      <header className="fixed w-full top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <div className={`mx-auto flex h-14 ${isWide ? "max-w-[94%]" : "max-w-5xl"} items-center justify-between px-4 sm:px-6 transition-all duration-300`}>
          <Link
            href="/"
            onClick={(e) => {
              e.preventDefault();
              goHome();
            }}
            className="flex items-center gap-2.5 text-zinc-900 no-underline transition-opacity hover:opacity-80 dark:text-zinc-50"
            aria-label="Toolich – Home"
          >
            <span className="relative flex h-8 w-8 shrink-0 text-zinc-900 dark:text-zinc-50">
              <Image
                src="/logo.svg"
                alt=""
                width={32}
                height={32}
                className="object-contain dark:invert"
                priority
              />
            </span>
            <span className="font-brand text-xl font-semibold tracking-tight">
              Toolich
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Tasks Popover */}
            <GlobalTasksPopover />

            {/* Privacy indicator */}
            <div className="relative group flex items-center justify-center">
              <div
                className="flex h-8 w-8 cursor-help items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-emerald-600 shadow-sm transition-colors hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-emerald-400"
                aria-label="Secure & Local processing indicator"
              >
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              
              {/* Tooltip Card */}
              <div className="pointer-events-none absolute right-0 top-10 w-72 origin-top-right scale-95 rounded-xl border border-zinc-200 bg-white/95 p-3.5 text-xs text-zinc-600 opacity-0 shadow-2xl backdrop-blur-xl transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-400 z-50">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-0.5">100% Local & Secure</h4>
                    <p className="leading-relaxed">All utility tools process your data entirely in your browser. No inputs or files are ever sent to a server.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search trigger */}
            <SearchTrigger />

            {/* Theme toggle */}
            <ThemeToggle />

            {/* GitHub link */}
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-zinc-700 no-underline transition-opacity hover:opacity-80 dark:text-zinc-300"
              aria-label="View on GitHub"
            >
              <svg
                className="h-6 w-6 fill-zinc-900 dark:fill-zinc-50"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span className="hidden text-sm font-medium sm:inline">
                GitHub
              </span>
            </a>
          </div>
        </div>
      </header>

      {/* Global search modal */}
      <SearchModal />
    </>
  );
}

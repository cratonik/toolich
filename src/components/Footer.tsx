"use client";

import Link from "next/link";
import { useTabContext } from "@/lib/tab-context";

export default function Footer() {
    const { isWide } = useTabContext();

    return (
        <footer className="w-full border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 transition-colors duration-300">
            <div className={`mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 sm:px-6 sm:flex-row text-sm text-zinc-600 dark:text-zinc-400 ${
                isWide ? "max-w-[94%]" : "max-w-5xl"
            } transition-all duration-300`}>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span>
                        © {new Date().getFullYear()} Toolich by{" "}
                        <a
                            href="https://cratonik.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold hover:text-zinc-900 dark:hover:text-zinc-200"
                        >
                            Cratonik
                        </a>
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <Link
                        href="/privacy"
                        className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-200"
                    >
                        Privacy
                    </Link>
                    <Link
                        href="/terms"
                        className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-200"
                    >
                        Terms
                    </Link>
                    <a
                        href="https://github.com/cratonik/toolich"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-200"
                    >
                        GitHub
                    </a>
                </div>
                <div className="text-zinc-600 dark:text-zinc-400">
                    Built for engineers by{" "}
                    <a
                        href="https://chaitany.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold hover:text-zinc-900 dark:hover:text-zinc-200"
                    >
                        Chaitanya Shimpi
                    </a>
                </div>
            </div>
        </footer>
    );
}

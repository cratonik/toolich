"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTabContext } from "@/lib/tab-context";
import Footer from "@/components/Footer";

export default function TermsPageClient() {
    const { goHome } = useTabContext();

    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
            <div className="mx-auto w-full max-w-3xl flex-1 px-4 pt-20 pb-16 sm:px-6">
                <Link
                    href="/"
                    onClick={(e) => {
                        e.preventDefault();
                        goHome();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 mb-6"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Home
                </Link>

                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Terms of Service
                </h1>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Last updated: February 2026
                </p>

                <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    <section>
                        <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            Acceptance of Terms
                        </h2>
                        <p>
                            By using Toolich, you agree to these terms. Toolich is provided
                            &quot;as is&quot; without any warranties, express or implied.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            Use of Service
                        </h2>
                        <p>
                            Toolich provides client-side developer utilities. You may use the
                            tools for any lawful purpose. All data processing happens locally
                            in your browser.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            Limitation of Liability
                        </h2>
                        <p>
                            Toolich and its contributors shall not be liable for any damages
                            arising from the use of these tools. You are responsible for
                            verifying the output of any tool before using it in production.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            Open Source
                        </h2>
                        <p>
                            Toolich is open-source software. You can view, fork, and
                            contribute to the codebase on{" "}
                            <a
                                href="https://github.com/cratonik/toolich"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 underline hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                GitHub
                            </a>
                            .
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            Changes
                        </h2>
                        <p>
                            We reserve the right to update these terms at any time. Continued
                            use of Toolich after changes constitutes acceptance of the new
                            terms.
                        </p>
                    </section>
                </div>
            </div>
            <Footer />
        </div>
    );
}

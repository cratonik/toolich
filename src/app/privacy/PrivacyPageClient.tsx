"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTabContext } from "@/lib/tab-context";
import Footer from "@/components/Footer";

export default function PrivacyPageClient() {
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
                    Privacy Policy
                </h1>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Last updated: February 2026
                </p>

                <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    <section>
                        <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            Overview
                        </h2>
                        <p>
                            Toolich is a client-side developer tool platform. All data processing
                            happens entirely in your browser — we do not send your data to any
                            server.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            Data Collection
                        </h2>
                        <p>
                            We do not collect, store, or transmit any personal data or tool
                            input/output. Your JSON, Base64 strings, and all other data stay
                            in your browser&apos;s memory and sessionStorage.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            Local Storage
                        </h2>
                        <p>
                            Toolich uses <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">sessionStorage</code> to
                            persist tool state across soft reloads and <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">localStorage</code> for
                            recent tools history. This data never leaves your browser.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            Cookies
                        </h2>
                        <p>
                            Toolich does not use cookies for tracking or analytics. We may use
                            essential cookies for basic functionality in the future.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            Contact
                        </h2>
                        <p>
                            If you have questions about this privacy policy, please open an
                            issue on our{" "}
                            <a
                                href="https://github.com/cratonik/toolich"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 underline hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                GitHub repository
                            </a>
                            .
                        </p>
                    </section>
                </div>
            </div>
            <Footer />
        </div>
    );
}

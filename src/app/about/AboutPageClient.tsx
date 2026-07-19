"use client";

import Link from "next/link";
import { ArrowLeft, Cpu, Shield, Zap, Sparkles } from "lucide-react";
import { useTabContext } from "@/lib/tab-context";
import Footer from "@/components/Footer";

export default function AboutPageClient() {
    const { goHome } = useTabContext();

    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
            <div className="mx-auto w-full max-w-5xl flex-1 px-4 pt-20 pb-16 sm:px-6">
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
                    About Toolich
                </h1>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Modern, secure, and client-side developer utility workspace.
                </p>

                <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            Our Mission
                        </h2>
                        <p>
                            Developers and managers use helper tools (Base64 converters, JSON formatters, pass generators) daily. However, many online tools are slow, full of intrusive ads, or send your sensitive data to external servers. 
                        </p>
                        <p>
                            <strong>Toolich</strong> was built to solve this. Our mission is to provide a sleek, lighting-fast workspace where all processes are executed directly in your browser. Your data never leaves your computer, ensuring absolute confidentiality and security.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            Core Pillars
                        </h2>
                        
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 mb-2">
                                    <Shield className="h-4.5 w-4.5" />
                                </div>
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 text-xs mb-1">
                                    Privacy First
                               </h3>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                                    Operations run client-side. No databases, logs, or uploads of your inputs.
                                </p>
                            </div>

                            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 mb-2">
                                    <Zap className="h-4.5 w-4.5" />
                                </div>
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 text-xs mb-1">
                                    High Performance
                                </h3>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                                    Powered by Next.js, WebAssembly, and local calculations for instant responses.
                                </p>
                            </div>

                            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 mb-2">
                                    <Cpu className="h-4.5 w-4.5" />
                                </div>
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 text-xs mb-1">
                                    Offline Capable
                                </h3>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                                    Runs fully offline as a PWA, allowing you to use all tools without internet.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            Open Source
                        </h2>
                        <p>
                            We believe in transparency. The code for Toolich is fully open-source and reviewable on GitHub. If you want to request a feature, submit a bug, or contribute a new tool, please visit our repository.
                        </p>
                        <p>
                            Contributions and feedback are always welcome! You can find us on{" "}
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
                </div>
            </div>
            <Footer />
        </div>
    );
}

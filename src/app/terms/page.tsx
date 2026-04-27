import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service | Toolich",
    description: "Toolich terms of service.",
};

export default function TermsPage() {
    return (
        <div className="mx-auto max-w-3xl px-4 pt-20 pb-16 sm:px-6">
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
    );
}

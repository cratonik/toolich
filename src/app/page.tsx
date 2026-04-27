export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 px-6 dark:from-zinc-950 dark:to-zinc-900">
      <main className="mx-auto flex flex-1 max-w-2xl flex-col items-center justify-center text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          Coming soon
        </p>
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          A platform built for how you work
        </h1>
        <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-xl">
          We&apos;re building something that will help you with your{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            development
          </span>{" "}
          and{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            day-to-day corporate work
          </span>
          —so you can focus on what matters.
        </p>
        <div className="mt-12 flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          In the works. Stay tuned.
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        © {new Date().getFullYear()} by{" "}
        <a
          href="https://chaitany.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline transition-colors hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          Cratonik
        </a>
      </footer>
    </div>
  );
}

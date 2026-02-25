import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed w-full top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
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
      </div>
    </header>
  );
}

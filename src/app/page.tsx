import { Code, Server, Shield, Network, BarChart3 } from "lucide-react";
import { ToolCategoryCard } from "@/components/ToolCategoryCard";
import { RecentToolPill } from "@/components/RecentToolPill";
import { SpotlightSearch } from "@/components/SpotlightSearch";
import type { LucideIcon } from "lucide-react";

type ToolCategory = {
  title: string;
  description: string;
  tags: string[];
  icon: LucideIcon;
  iconClassName: string;
  cardClassName?: string;
  glowColor?: "indigo" | "emerald" | "rose" | "violet" | "amber" | "zinc";
};

const TOOL_CATEGORIES: ToolCategory[] = [
  {
    title: "Developers",
    description: "Code formatters, converters, validators, and generators.",
    tags: ["JSON", "Base64", "UUID", "Hash"],
    icon: Code,
    iconClassName:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
    glowColor: "indigo",
  },
  {
    title: "DevOps",
    description: "Docker, Kubernetes, CI/CD, and infrastructure helpers.",
    tags: ["YAML", "Cron", "ENV", "Docker"],
    icon: Server,
    iconClassName:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    glowColor: "emerald",
  },
  {
    title: "Security",
    description: "Encryption, password tools, JWT, and security checkers.",
    tags: ["JWT", "Encrypt", "Password", "SSL"],
    icon: Shield,
    iconClassName:
      "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    glowColor: "rose",
  },
  {
    title: "Networking",
    description: "IP tools, DNS lookup, URL utilities, and network testing.",
    tags: ["IP", "DNS", "URL", "Ping"],
    icon: Network,
    iconClassName:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    glowColor: "violet",
  },
  {
    title: "Managers",
    description: "Sprint calculators, time zone helpers, and productivity tools.",
    tags: ["Time Zone", "Sprint", "Date Calc", "Diff"],
    icon: BarChart3,
    iconClassName:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    cardClassName: "md:col-span-2",
    glowColor: "amber",
  },
];

const RECENT_TOOLS: string[] = [
  "JSON Formatter",
  "UUID Generator",
  "Base64 Encode",
  "JWT Decoder",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 pt-24 pb-10 dark:bg-zinc-950 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-5xl space-y-10">
        {/* Hero */}
        <section className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Simple tools for everyday developer tasks
          </h1>
          <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
            Fast, minimal, zero-config utilities built to help you ship code and
            run your day-to-day work with less friction.
          </p>
        </section>

        {/* Tool categories */}
        <section className="grid gap-6 md:grid-cols-2">
          {TOOL_CATEGORIES.map(
            ({ title, description, tags, icon, iconClassName, cardClassName, glowColor }) => (
              <ToolCategoryCard
                key={title}
                title={title}
                description={description}
                tags={tags}
                icon={icon}
                iconClassName={iconClassName}
                cardClassName={cardClassName}
                glowColor={glowColor}
              />
            ),
          )}
        </section>

        {/* Recently used */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Recently used
          </h2>
          <div className="flex flex-wrap gap-2">
            {RECENT_TOOLS.map((label) => (
              <RecentToolPill key={label} label={label} />
            ))}
          </div>
        </section>

        {/* Search */}
        <section>
          <SpotlightSearch />
        </section>

        {/* Footer */}
        <footer className="flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-6 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400 sm:flex-row">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>© {new Date().getFullYear()} Toolich by Cratonik</span>

          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a
              href="/privacy"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-200"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-200"
            >
              Terms
            </a>
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
            Built for engineers
          </div>
        </footer>
      </main>
    </div>
  );
}

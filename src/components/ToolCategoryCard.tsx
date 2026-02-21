"use client";

import type { LucideIcon } from "lucide-react";
import { TagPill } from "./TagPill";
import { useTabContext } from "@/lib/tab-context";

type ToolCategoryCardProps = {
  title: string;
  description: string;
  tags: string[];
  icon: LucideIcon;
  iconClassName: string;
  cardClassName?: string;
  glowColor?: string;
  categorySlug: string;
};

export function ToolCategoryCard({
  title,
  description,
  tags,
  icon: Icon,
  iconClassName,
  cardClassName,
  glowColor = "zinc",
  categorySlug,
}: ToolCategoryCardProps) {
  const { openCategoryInCurrentTab } = useTabContext();

  const glowClasses = {
    indigo: "hover:shadow-indigo-500/20 hover:ring-1 hover:ring-indigo-500/20",
    emerald:
      "hover:shadow-emerald-500/20 hover:ring-1 hover:ring-emerald-500/20",
    rose: "hover:shadow-rose-500/20 hover:ring-1 hover:ring-rose-500/20",
    violet:
      "hover:shadow-violet-500/20 hover:ring-1 hover:ring-violet-500/20",
    amber: "hover:shadow-amber-500/20 hover:ring-1 hover:ring-amber-500/20",
    zinc: "hover:shadow-zinc-500/20 hover:ring-1 hover:ring-zinc-500/20",
  };

  const handleClick = () => {
    openCategoryInCurrentTab(categorySlug, `${title} Tools`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group block w-full rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:border-zinc-300 hover:shadow-xl hover:-translate-y-1 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 ${glowClasses[glowColor as keyof typeof glowClasses] ?? glowClasses.zinc
        } ${cardClassName ?? ""}`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full ${iconClassName}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((label) => (
          <TagPill key={label} label={label} />
        ))}
      </div>
    </button>
  );
}

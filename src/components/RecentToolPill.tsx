type RecentToolPillProps = {
  label: string;
};

export function RecentToolPill({ label }: RecentToolPillProps) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm transition-colors hover:border-zinc-300 hover:text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
    >
      {label}
    </button>
  );
}


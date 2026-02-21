type TagPillProps = {
  label: string;
};

export function TagPill({ label }: TagPillProps) {
  return (
    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
      {label}
    </span>
  );
}


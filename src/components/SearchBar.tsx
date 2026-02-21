import { Search } from "lucide-react";

type SearchBarProps = {
  placeholder?: string;
  keyHint?: string;
};

export function SearchBar({
  placeholder = "Quick search tools... (press / to focus)",
  keyHint = "/",
}: SearchBarProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-3 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-1 items-center gap-3">
        <Search className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
        <input
          type="text"
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          aria-label="Search tools"
        />
      </div>
      {keyHint ? (
        <kbd className="ml-3 inline-flex h-6 items-center rounded border border-zinc-200 bg-zinc-50 px-2 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          {keyHint}
        </kbd>
      ) : null}
    </div>
  );
}


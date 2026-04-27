import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { CATEGORY_LABELS } from "@/lib/routes";

type Breadcrumb = {
    label: string;
    href?: string;
};

type ToolPageHeaderProps = {
    toolName: string;
    description: string;
    category: string;
};

export function ToolPageHeader({
    toolName,
    description,
    category,
}: ToolPageHeaderProps) {
    const breadcrumbs: Breadcrumb[] = [
        { label: "Home", href: ROUTES.home },
        { label: CATEGORY_LABELS[category] ?? category },
        { label: toolName },
    ];

    return (
        <div className="mb-8 space-y-3">
            {/* Breadcrumb */}
            <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400"
            >
                {breadcrumbs.map((crumb, i) => (
                    <span key={crumb.label} className="flex items-center gap-1">
                        {i > 0 && <ChevronRight className="h-3 w-3" />}
                        {crumb.href ? (
                            <Link
                                href={crumb.href}
                                className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-200"
                            >
                                {crumb.label}
                            </Link>
                        ) : (
                            <span
                                className={
                                    i === breadcrumbs.length - 1
                                        ? "text-zinc-900 dark:text-zinc-100"
                                        : ""
                                }
                            >
                                {crumb.label}
                            </span>
                        )}
                    </span>
                ))}
            </nav>

            {/* Title + description */}
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                {toolName}
            </h1>
            <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
                {description}
            </p>
        </div>
    );
}

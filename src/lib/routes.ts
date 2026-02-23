/**
 * Centralized route definitions for Toolich.
 * Every link, breadcrumb, and navigation in the app should reference this file.
 */

export const ROUTES = {
    home: "/",
    categories: {
        developers: "/tools/developers",
        devops: "/tools/devops",
        security: "/tools/security",
        networking: "/tools/networking",
        managers: "/tools/managers",
    },
    tools: {
        developers: {
            base64Encode: "/tools/developers/base64-encode",
            base64Decode: "/tools/developers/base64-decode",
        },
    },
} as const;

/** Build a category path */
export function categoryPath(category: string): string {
    return `/tools/${category}`;
}

/** Build a tool path from category slug + tool slug */
export function toolPath(category: string, slug: string): string {
    return `/tools/${category}/${slug}`;
}

/** Category display names mapped from slug */
export const CATEGORY_LABELS: Record<string, string> = {
    developers: "Developers",
    devops: "DevOps",
    security: "Security",
    networking: "Networking",
    managers: "Managers",
};

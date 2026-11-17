import { getToolsByCategory } from "@/lib/tool-registry";
import { constructMetadata } from "@/lib/seo";
import { CollectionStructuredData } from "@/components/StructuredData";

export const metadata = constructMetadata({
    title: "Manager Tools",
    description: "Markdown editor, side-by-side text diff checkers, and productivity tools for project managers and developers.",
    path: "/tools/managers",
    keywords: ["manager tools", "markdown editor", "diff checker", "productivity utilities"],
});

// The tools layout renders the visible UI through the tab system, so this page
// only contributes metadata and JSON-LD to the server-rendered HTML.
export default function ManagersPage() {
    return (
        <CollectionStructuredData
            name="Manager Tools"
            description="Markdown editor, side-by-side text diff checkers, and productivity tools for project managers and developers."
            path="/tools/managers"
            tools={getToolsByCategory("managers")}
        />
    );
}

import { allTools } from "@/lib/tool-registry";
import { constructMetadata } from "@/lib/seo";
import { CollectionStructuredData } from "@/components/StructuredData";

export const metadata = constructMetadata({
    title: "All Tools",
    description: "Browse every free online developer tool, converter, validator, and generator across all categories.",
    path: "/tools",
    keywords: ["all developer tools", "online utilities", "code formatters", "validators", "base64", "json schema"],
});

// The tools layout renders the visible UI through the tab system, so this page
// only contributes metadata and JSON-LD to the server-rendered HTML.
export default function AllToolsPage() {
    return (
        <CollectionStructuredData
            name="All Tools"
            description="Browse every free online developer tool, converter, validator, and generator across all categories."
            path="/tools"
            tools={allTools}
        />
    );
}

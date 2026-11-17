import { getToolsByCategory } from "@/lib/tool-registry";
import { constructMetadata } from "@/lib/seo";
import { CollectionStructuredData } from "@/components/StructuredData";

export const metadata = constructMetadata({
    title: "Developer Tools",
    description: "Code formatters, base64 converters, schema validators, and UUID generators.",
    path: "/tools/developers",
    keywords: ["developer tools", "code formatters", "validators", "base64", "json schema"],
});

// The tools layout renders the visible UI through the tab system, so this page
// only contributes metadata and JSON-LD to the server-rendered HTML.
export default function DevelopersPage() {
    return (
        <CollectionStructuredData
            name="Developer Tools"
            description="Code formatters, base64 converters, schema validators, and UUID generators."
            path="/tools/developers"
            tools={getToolsByCategory("developers")}
        />
    );
}

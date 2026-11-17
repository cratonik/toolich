import { getToolsByCategory } from "@/lib/tool-registry";
import { constructMetadata } from "@/lib/seo";
import { CollectionStructuredData } from "@/components/StructuredData";

export const metadata = constructMetadata({
    title: "DevOps Tools",
    description: "YAML formatter and converter, cron parser, environment variable editor, and regex tester.",
    path: "/tools/devops",
    keywords: ["devops tools", "cron parser", "dotenv editor", "regex tester", "infrastructure helper"],
});

// The tools layout renders the visible UI through the tab system, so this page
// only contributes metadata and JSON-LD to the server-rendered HTML.
export default function DevOpsPage() {
    return (
        <CollectionStructuredData
            name="DevOps Tools"
            description="YAML formatter and converter, cron parser, environment variable editor, and regex tester."
            path="/tools/devops"
            tools={getToolsByCategory("devops")}
        />
    );
}

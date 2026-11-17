import { constructMetadata } from "@/lib/seo";
import { ToolStructuredData } from "@/components/StructuredData";
import { getToolBySlug } from "@/lib/tool-registry";

const meta = getToolBySlug("devops", "yaml-formatter")!;

export const metadata = constructMetadata({
    title: meta.name,
    description: meta.description,
    path: meta.path,
    keywords: meta.keywords,
});

// The tools layout renders the visible UI through the tab system, so this page
// only contributes metadata and JSON-LD to the server-rendered HTML.
export default function YamlFormatterPage() {
    return <ToolStructuredData tool={meta} />;
}

import { ToolPageHeader } from "@/components/ToolPageHeader";
import JsonToSchema from "@/tools/developers/json-to-schema/JsonToSchema";
import { toolMeta } from "@/tools/developers/json-to-schema";
import { constructMetadata } from "@/lib/seo";
import { ToolStructuredData } from "@/components/StructuredData";
import { allTools } from "@/lib/tool-registry";

const meta = allTools.find((t) => t.slug === toolMeta.slug)!;

export const metadata = constructMetadata({
    title: meta.name,
    description: meta.description,
    path: meta.slug === "markdown-editor" && toolMeta.category === "manager" ? "/tools/managers/markdown-editor" : meta.path,
    keywords: meta.keywords,
});

export default function JsonToSchemaPage() {
    return (
        <>
            <ToolStructuredData tool={meta} />
            <ToolPageHeader
                toolName={meta.name}
                description={meta.description}
                category={meta.category}
                slug={meta.slug}
            />
            <JsonToSchema />
        </>
    );
}

import { ToolPageHeader } from "@/components/ToolPageHeader";
import MarkdownEditor from "@/tools/managers/markdown-editor/MarkdownEditor";
import { toolMeta } from "@/tools/managers/markdown-editor";
import { constructMetadata } from "@/lib/seo";
import { ToolStructuredData } from "@/components/StructuredData";
import { allTools } from "@/lib/tool-registry";

const meta = allTools.find((t) => t.slug === toolMeta.slug)!;

export const metadata = constructMetadata({
    title: meta.name,
    description: meta.description,
    path: meta.path,
    keywords: meta.keywords,
});

export default function MarkdownEditorPage() {
    return (
        <>
            <ToolStructuredData tool={meta} />
            <ToolPageHeader
                toolName={meta.name}
                description={meta.description}
                category={meta.category}
                slug={meta.slug}
            />
            <MarkdownEditor />
        </>
    );
}

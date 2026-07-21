import { getToolBySlug } from "@/lib/tool-registry";
import { notFound } from "next/navigation";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import { TabContent } from "@/components/TabContent";
import { constructMetadata } from "@/lib/seo";
import type { Metadata } from "next";

const tool = getToolBySlug("developers", "python-compiler");

export const metadata: Metadata = constructMetadata({
    title: tool?.name,
    description: tool?.description,
});

export default function PythonCompilerPage() {
    if (!tool) return notFound();

    return (
        <div className="flex flex-col gap-6">
            <ToolPageHeader tool={tool} />
            <TabContent category={tool.category} slug={tool.slug} />
        </div>
    );
}

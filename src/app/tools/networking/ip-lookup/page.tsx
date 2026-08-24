import { ToolPageHeader } from "@/components/ToolPageHeader";
import IpLookup from "@/tools/networking/ip-lookup/IpLookup";
import { toolMeta } from "@/tools/networking/ip-lookup";
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

export default function IpLookupPage() {
    return (
        <>
            <ToolStructuredData tool={meta} />
            <ToolPageHeader
                toolName={meta.name}
                description={meta.description}
                category={meta.category}
                slug={meta.slug}
            />
            <IpLookup />
        </>
    );
}

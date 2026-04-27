import { ToolPageHeader } from "@/components/ToolPageHeader";
import DnsLookup from "@/tools/networking/dns-lookup/DnsLookup";
import { toolMeta } from "@/tools/networking/dns-lookup";

export const metadata = {
    title: `${toolMeta.name} | Toolich`,
    description: toolMeta.description,
};

export default function DnsLookupPage() {
    return (
        <>
            <ToolPageHeader
                toolName={toolMeta.name}
                description={toolMeta.description}
                category={toolMeta.category}
            />
            <DnsLookup />
        </>
    );
}

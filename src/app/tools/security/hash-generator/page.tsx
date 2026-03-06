import { ToolPageHeader } from "@/components/ToolPageHeader";
import HashGenerator from "@/tools/security/hash-generator/HashGenerator";
import { toolMeta } from "@/tools/security/hash-generator";

export const metadata = {
    title: `${toolMeta.name} | Toolich`,
    description: toolMeta.description,
};

export default function HashGeneratorPage() {
    return (
        <>
            <ToolPageHeader
                toolName={toolMeta.name}
                description={toolMeta.description}
                category={toolMeta.category}
            />
            <HashGenerator />
        </>
    );
}

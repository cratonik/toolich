import { ToolPageHeader } from "@/components/ToolPageHeader";
import UuidGenerator from "@/tools/developers/uuid-generator/UuidGenerator";
import { toolMeta } from "@/tools/developers/uuid-generator";

export const metadata = {
    title: `${toolMeta.name} | Toolich`,
    description: toolMeta.description,
};

export default function UuidGeneratorPage() {
    return (
        <>
            <ToolPageHeader
                toolName={toolMeta.name}
                description={toolMeta.description}
                category={toolMeta.category}
            />
            <UuidGenerator />
        </>
    );
}

import { ToolPageHeader } from "@/components/ToolPageHeader";
import Base64Encoder from "@/tools/developers/base64-encode/Base64Encoder";
import { toolMeta } from "@/tools/developers/base64-encode";

export const metadata = {
    title: `${toolMeta.name} | Toolich`,
    description: toolMeta.description,
};

export default function Base64EncodePage() {
    return (
        <>
            <ToolPageHeader
                toolName={toolMeta.name}
                description={toolMeta.description}
                category={toolMeta.category}
            />
            <Base64Encoder />
        </>
    );
}

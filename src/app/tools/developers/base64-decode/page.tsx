import { ToolPageHeader } from "@/components/ToolPageHeader";
import Base64Decoder from "@/tools/developers/base64-decode/Base64Decoder";
import { toolMeta } from "@/tools/developers/base64-decode";

export const metadata = {
    title: `${toolMeta.name} | Toolich`,
    description: toolMeta.description,
};

export default function Base64DecodePage() {
    return (
        <>
            <ToolPageHeader
                toolName={toolMeta.name}
                description={toolMeta.description}
                category={toolMeta.category}
            />
            <Base64Decoder />
        </>
    );
}

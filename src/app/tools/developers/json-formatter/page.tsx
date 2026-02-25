import { ToolPageHeader } from "@/components/ToolPageHeader";
import JsonFormatter from "@/tools/developers/json-formatter/JsonFormatter";
import { toolMeta } from "@/tools/developers/json-formatter";

export const metadata = {
    title: `${toolMeta.name} | Toolich`,
    description: toolMeta.description,
};

export default function JsonFormatterPage() {
    return (
        <>
            <ToolPageHeader
                toolName={toolMeta.name}
                description={toolMeta.description}
                category={toolMeta.category}
            />
            <JsonFormatter />
        </>
    );
}

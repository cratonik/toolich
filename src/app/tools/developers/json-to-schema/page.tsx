import { ToolPageHeader } from "@/components/ToolPageHeader";
import JsonToSchema from "@/tools/developers/json-to-schema/JsonToSchema";
import { toolMeta } from "@/tools/developers/json-to-schema";

export const metadata = {
    title: `${toolMeta.name} | Toolich`,
    description: toolMeta.description,
};

export default function JsonToSchemaPage() {
    return (
        <>
            <ToolPageHeader
                toolName={toolMeta.name}
                description={toolMeta.description}
                category={toolMeta.category}
            />
            <JsonToSchema />
        </>
    );
}

import { ToolPageHeader } from "@/components/ToolPageHeader";
import EnvEditor from "@/tools/devops/env-editor/EnvEditor";
import { toolMeta } from "@/tools/devops/env-editor";

export const metadata = {
    title: `${toolMeta.name} | Toolich`,
    description: toolMeta.description,
};

export default function EnvEditorPage() {
    return (
        <>
            <ToolPageHeader
                toolName={toolMeta.name}
                description={toolMeta.description}
                category={toolMeta.category}
            />
            <EnvEditor />
        </>
    );
}

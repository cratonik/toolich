import { ToolPageHeader } from "@/components/ToolPageHeader";
import MarkdownEditor from "@/tools/managers/markdown-editor/MarkdownEditor";
import { toolMeta } from "@/tools/managers/markdown-editor";

export const metadata = {
    title: `${toolMeta.name} | Toolich`,
    description: toolMeta.description,
};

export default function MarkdownEditorPageSingular() {
    return (
        <>
            <ToolPageHeader
                toolName={toolMeta.name}
                description={toolMeta.description}
                category="manager"
            />
            <MarkdownEditor />
        </>
    );
}

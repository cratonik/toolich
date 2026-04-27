import { ToolPageHeader } from "@/components/ToolPageHeader";
import DiffChecker from "@/tools/managers/diff-checker/DiffChecker";
import { toolMeta } from "@/tools/managers/diff-checker";

export const metadata = {
    title: `${toolMeta.name} | Toolich`,
    description: toolMeta.description,
};

export default function DiffCheckerPage() {
    return (
        <>
            <ToolPageHeader
                toolName={toolMeta.name}
                description={toolMeta.description}
                category={toolMeta.category}
            />
            <DiffChecker />
        </>
    );
}

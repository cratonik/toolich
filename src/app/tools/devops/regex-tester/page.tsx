import { ToolPageHeader } from "@/components/ToolPageHeader";
import RegexTester from "@/tools/devops/regex-tester/RegexTester";
import { toolMeta } from "@/tools/devops/regex-tester";

export const metadata = {
    title: `${toolMeta.name} | Toolich`,
    description: toolMeta.description,
};

export default function RegexTesterPage() {
    return (
        <>
            <ToolPageHeader
                toolName={toolMeta.name}
                description={toolMeta.description}
                category={toolMeta.category}
            />
            <RegexTester />
        </>
    );
}

import { ToolPageHeader } from "@/components/ToolPageHeader";
import CronParser from "@/tools/devops/cron-parser/CronParser";
import { toolMeta } from "@/tools/devops/cron-parser";

export const metadata = {
    title: `${toolMeta.name} | Toolich`,
    description: toolMeta.description,
};

export default function CronParserPage() {
    return (
        <>
            <ToolPageHeader
                toolName={toolMeta.name}
                description={toolMeta.description}
                category={toolMeta.category}
            />
            <CronParser />
        </>
    );
}

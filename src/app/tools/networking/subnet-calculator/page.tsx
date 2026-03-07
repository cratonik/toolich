import { ToolPageHeader } from "@/components/ToolPageHeader";
import SubnetCalculator from "@/tools/networking/subnet-calculator/SubnetCalculator";
import { toolMeta } from "@/tools/networking/subnet-calculator";

export const metadata = {
    title: `${toolMeta.name} | Toolich`,
    description: toolMeta.description,
};

export default function SubnetCalculatorPage() {
    return (
        <>
            <ToolPageHeader
                toolName={toolMeta.name}
                description={toolMeta.description}
                category={toolMeta.category}
            />
            <SubnetCalculator />
        </>
    );
}

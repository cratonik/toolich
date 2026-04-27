import { ToolPageHeader } from "@/components/ToolPageHeader";
import PasswordGenerator from "@/tools/security/password-generator/PasswordGenerator";
import { toolMeta } from "@/tools/security/password-generator";

export const metadata = {
    title: `${toolMeta.name} | Toolich`,
    description: toolMeta.description,
};

export default function PasswordGeneratorPage() {
    return (
        <>
            <ToolPageHeader
                toolName={toolMeta.name}
                description={toolMeta.description}
                category={toolMeta.category}
            />
            <PasswordGenerator />
        </>
    );
}

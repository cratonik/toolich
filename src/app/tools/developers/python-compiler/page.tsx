import { getToolBySlug } from "@/lib/tool-registry";
import { notFound } from "next/navigation";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import PythonCompiler from "@/tools/developers/python-compiler/PythonCompiler";
import { constructMetadata } from "@/lib/seo";
import type { Metadata } from "next";

const tool = getToolBySlug("developers", "python-compiler");

export const metadata: Metadata = constructMetadata({
    title: tool?.name || "Python Compiler",
    description: tool?.description || "Write and execute Python 3 code entirely in your browser using Pyodide.",
    path: tool?.path || "/tools/developers/python-compiler",
});

export default function PythonCompilerPage() {
    if (!tool) return notFound();

    return (
        <>
            <ToolPageHeader 
                toolName={tool.name}
                description={tool.description}
                category={tool.category}
                slug={tool.slug}
            />
            <div className="mt-8">
                <PythonCompiler />
            </div>
        </>
    );
}

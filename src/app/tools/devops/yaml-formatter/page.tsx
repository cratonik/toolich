import { Metadata } from "next";
import { getToolBySlug } from "@/lib/tool-registry";
import YamlFormatter from "@/tools/devops/yaml-formatter/YamlFormatter";

const meta = getToolBySlug("devops", "yaml-formatter");

export const metadata: Metadata = {
    title: meta?.name ?? "YAML Formatter",
    description: meta?.description,
    keywords: meta?.keywords,
};

export default function YamlFormatterPage() {
    return <YamlFormatter />;
}

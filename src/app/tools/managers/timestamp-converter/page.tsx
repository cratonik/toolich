import { Metadata } from "next";
import { getToolBySlug } from "@/lib/tool-registry";
import TimestampConverter from "@/tools/managers/timestamp-converter/TimestampConverter";

const meta = getToolBySlug("managers", "timestamp-converter");

export const metadata: Metadata = {
    title: `${meta?.name} | Toolich`,
    description: meta?.description,
    keywords: meta?.keywords,
};

export default function TimestampConverterPage() {
    return <TimestampConverter />;
}

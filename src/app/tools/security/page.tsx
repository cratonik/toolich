import { getToolsByCategory } from "@/lib/tool-registry";
import { constructMetadata } from "@/lib/seo";
import { CollectionStructuredData } from "@/components/StructuredData";

export const metadata = constructMetadata({
    title: "Security Tools",
    description: "Cryptographic hash generators, secure password generators, and client-side encryption utility tools.",
    path: "/tools/security",
    keywords: ["security tools", "hash generator", "password generator", "encryption", "cryptography"],
});

// The tools layout renders the visible UI through the tab system, so this page
// only contributes metadata and JSON-LD to the server-rendered HTML.
export default function SecurityPage() {
    return (
        <CollectionStructuredData
            name="Security Tools"
            description="Cryptographic hash generators, secure password generators, and client-side encryption utility tools."
            path="/tools/security"
            tools={getToolsByCategory("security")}
        />
    );
}

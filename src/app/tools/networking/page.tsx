import { getToolsByCategory } from "@/lib/tool-registry";
import { constructMetadata } from "@/lib/seo";
import { CollectionStructuredData } from "@/components/StructuredData";

export const metadata = constructMetadata({
    title: "Networking Tools",
    description: "IP address lookup, DNS record lookup, subnet calculator, and HTTP status code reference.",
    path: "/tools/networking",
    keywords: ["networking tools", "subnet calculator", "dns lookup", "ip tools", "network utility"],
});

// The tools layout renders the visible UI through the tab system, so this page
// only contributes metadata and JSON-LD to the server-rendered HTML.
export default function NetworkingPage() {
    return (
        <CollectionStructuredData
            name="Networking Tools"
            description="IP address lookup, DNS record lookup, subnet calculator, and HTTP status code reference."
            path="/tools/networking"
            tools={getToolsByCategory("networking")}
        />
    );
}

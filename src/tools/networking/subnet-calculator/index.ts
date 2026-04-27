import type { ToolMeta } from "@/lib/tool-registry";

export const toolMeta: ToolMeta = {
    name: "Subnet Calculator",
    slug: "subnet-calculator",
    description: "Calculate subnet details from an IP address and CIDR prefix or subnet mask.",
    category: "networking",
    keywords: [
        "subnet", "cidr", "ip", "ipv4", "network", "mask",
        "broadcast", "host", "calculator", "wildcard",
    ],
};

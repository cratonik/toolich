import PrivacyPageClient from "./PrivacyPageClient";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
    title: "Privacy Policy",
    description: "Toolich privacy policy — how we handle your data.",
    path: "/privacy",
});

export default function PrivacyPage() {
    return <PrivacyPageClient />;
}

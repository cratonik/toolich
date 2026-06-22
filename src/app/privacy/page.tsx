import type { Metadata } from "next";
import PrivacyPageClient from "./PrivacyPageClient";

export const metadata: Metadata = {
    title: "Privacy Policy | Toolich",
    description: "Toolich privacy policy — how we handle your data.",
};

export default function PrivacyPage() {
    return <PrivacyPageClient />;
}

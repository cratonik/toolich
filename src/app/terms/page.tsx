import type { Metadata } from "next";
import TermsPageClient from "./TermsPageClient";

export const metadata: Metadata = {
    title: "Terms of Service | Toolich",
    description: "Toolich terms of service.",
};

export default function TermsPage() {
    return <TermsPageClient />;
}

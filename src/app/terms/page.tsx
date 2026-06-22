import TermsPageClient from "./TermsPageClient";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
    title: "Terms of Service",
    description: "Toolich terms of service and conditions of use.",
    path: "/terms",
});

export default function TermsPage() {
    return <TermsPageClient />;
}

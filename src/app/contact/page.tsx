import ContactPageClient from "./ContactPageClient";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
    title: "Contact Support",
    description: "Get in touch with the Toolich team for queries, support, feedback, or feature requests.",
    path: "/contact",
});

export default function ContactPage() {
    return <ContactPageClient />;
}

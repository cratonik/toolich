import AboutPageClient from "./AboutPageClient";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
    title: "About Us",
    description: "Learn more about Toolich — a comprehensive client-side utilities directory for developers, DevOps, and managers.",
    path: "/about",
});

export default function AboutPage() {
    return <AboutPageClient />;
}

import { permanentRedirect } from "next/navigation";

export default function LegacyAllToolsRedirect() {
    permanentRedirect("/tools");
}


import type { ToolMeta } from "@/lib/tool-registry";

export const toolMeta: ToolMeta = {
    name: "SSL Certificate Decoder",
    slug: "ssl-decoder",
    description: "Decode PEM formatted X.509 SSL/TLS certificates to view details like subject, issuer, validity, and extensions.",
    category: "security",
    keywords: [
        "ssl", "tls", "certificate", "decode", "x509", "pem", "crt", "cer", "cert",
        "subject", "issuer", "validity", "san", "public key"
    ],
};

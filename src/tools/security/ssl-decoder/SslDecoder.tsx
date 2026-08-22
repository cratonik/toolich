"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Copy, Check, Trash2, Upload, AlertCircle, ShieldCheck, ShieldAlert, CheckCircle2, Info } from "lucide-react";
import forge from "node-forge";
import { useSessionState } from "@/lib/use-session-state";
import { useTabContext } from "@/lib/tab-context";

// Helper to format Date objects nicely
function formatDate(date: Date) {
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'long',
    }).format(date);
}

// Helper to format attributes (like Subject and Issuer)
function formatAttributes(attrs: any[]) {
    if (!attrs || !Array.isArray(attrs)) return [];
    return attrs.map(attr => ({
        name: attr.shortName || attr.name || "Unknown",
        value: attr.value || "",
    }));
}

export default function SslDecoder() {
    const [input, setInput] = useSessionState("ssl-decoder:input", "");
    const [copied, setCopied] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Decode logic
    const { cert, error, expirationStatus, daysRemaining } = useMemo(() => {
        if (!input.trim()) return { cert: null, error: null, expirationStatus: null, daysRemaining: null };

        try {
            // Find the PEM block
            const pemRegex = /-----BEGIN CERTIFICATE-----[^-]+-----END CERTIFICATE-----/g;
            const matches = input.match(pemRegex);
            
            let pemString = input;
            if (matches && matches.length > 0) {
                pemString = matches[0];
            } else if (!input.includes("-----BEGIN CERTIFICATE-----")) {
                // Try wrapping it if the user just pasted the base64 payload
                const cleanB64 = input.replace(/\s+/g, "");
                pemString = `-----BEGIN CERTIFICATE-----\n${cleanB64.match(/.{1,64}/g)?.join("\n")}\n-----END CERTIFICATE-----`;
            }

            const decodedCert = forge.pki.certificateFromPem(pemString);
            
            // Calculate expiration status
            const now = new Date();
            const notAfter = decodedCert.validity.notAfter;
            const diffTime = notAfter.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let status: "valid" | "expiring_soon" | "expired" = "valid";
            if (diffDays < 0) {
                status = "expired";
            } else if (diffDays <= 30) {
                status = "expiring_soon";
            }

            return { cert: decodedCert, error: null, expirationStatus: status, daysRemaining: diffDays };
        } catch (err: any) {
            return { cert: null, error: "Invalid Certificate Format. Please paste a valid PEM encoded X.509 certificate.", expirationStatus: null, daysRemaining: null };
        }
    }, [input]);

    const handleCopy = async () => {
        if (!cert) return;
        const subjectName = cert.subject.attributes.map((a: any) => `${a.shortName || a.name}=${a.value}`).join(', ');
        const details = `Subject: ${subjectName}\nIssuer: ${cert.issuer.attributes.map((a: any) => `${a.shortName || a.name}=${a.value}`).join(', ')}\nValid From: ${formatDate(cert.validity.notBefore)}\nValid To: ${formatDate(cert.validity.notAfter)}\nSerial Number: ${cert.serialNumber}`;
        await navigator.clipboard.writeText(details);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        setInput("");
    };

    const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                setInput(reader.result);
            }
        };
        reader.readAsText(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!cert}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                >
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    Copy Summary
                </button>

                <button
                    type="button"
                    onClick={handleClear}
                    disabled={!input}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                >
                    <Trash2 className="h-4 w-4 text-rose-500" />
                    Clear
                </button>

                <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                >
                    <Upload className="h-4 w-4" />
                    Upload .pem / .crt
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pem,.crt,.cer,.txt"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                        if (e.target) e.target.value = '';
                    }}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Input Panel */}
                <div className="flex flex-col space-y-2 h-full">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        PEM Certificate String
                    </label>
                    <div 
                        className={`relative flex-1 rounded-xl border transition-colors ${
                            dragActive 
                                ? "border-indigo-500 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-900/20" 
                                : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900/60"
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={handleDrop}
                    >
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="-----BEGIN CERTIFICATE-----\nMIIDxTCCAq2gAwIBAgIQAqxcJmoV/nQqTtjNxVKOTDANBgkqhkiG9w0BAQsFADBh\n...\n-----END CERTIFICATE-----"
                            className="w-full h-full min-h-[400px] resize-none rounded-xl bg-transparent p-4 font-mono text-[13px] leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                            spellCheck={false}
                        />
                    </div>
                </div>

                {/* Output Panel */}
                <div className="flex flex-col space-y-2 h-full">
                    <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        <span>Decoded Details</span>
                        {cert && expirationStatus && (
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                expirationStatus === "valid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                                expirationStatus === "expiring_soon" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                                "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                            }`}>
                                {expirationStatus === "valid" ? <ShieldCheck className="h-3 w-3" /> :
                                 expirationStatus === "expiring_soon" ? <AlertCircle className="h-3 w-3" /> :
                                 <ShieldAlert className="h-3 w-3" />}
                                {expirationStatus === "valid" ? `Valid (${daysRemaining} days left)` :
                                 expirationStatus === "expiring_soon" ? `Expiring Soon (${daysRemaining} days)` :
                                 "Expired"}
                            </span>
                        )}
                    </label>
                    <div className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 p-0 shadow-sm overflow-hidden dark:border-zinc-700 dark:bg-zinc-900/40 relative">
                        {error ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-900/10">
                                <AlertCircle className="mb-2 h-8 w-8 opacity-50" />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        ) : !cert ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-zinc-400 dark:text-zinc-500">
                                <Info className="mb-2 h-8 w-8 opacity-20" />
                                <p className="text-sm">Paste a certificate to view details</p>
                            </div>
                        ) : (
                            <div className="absolute inset-0 overflow-y-auto p-4 space-y-6">
                                {/* Subject & Issuer */}
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="space-y-3 bg-white dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/50">
                                        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-700/50 pb-2">Subject</h3>
                                        <div className="space-y-1.5">
                                            {formatAttributes(cert.subject.attributes).map((attr, i) => (
                                                <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                                                    <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 w-12 shrink-0">{attr.name}</span>
                                                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 break-words">{attr.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3 bg-white dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/50">
                                        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-700/50 pb-2">Issuer</h3>
                                        <div className="space-y-1.5">
                                            {formatAttributes(cert.issuer.attributes).map((attr, i) => (
                                                <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                                                    <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 w-12 shrink-0">{attr.name}</span>
                                                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 break-words">{attr.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Validity */}
                                <div className="bg-white dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/50 space-y-3">
                                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-700/50 pb-2">Validity</h3>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <span className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-0.5">Not Before</span>
                                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatDate(cert.validity.notBefore)}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-0.5">Not After</span>
                                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatDate(cert.validity.notAfter)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="bg-white dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/50 space-y-3">
                                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-700/50 pb-2">Technical Details</h3>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <span className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Serial Number</span>
                                            <code className="px-2 py-1 bg-zinc-100 dark:bg-zinc-900 rounded text-xs font-mono text-zinc-800 dark:text-zinc-200 break-all border border-zinc-200 dark:border-zinc-700">
                                                {cert.serialNumber?.match(/.{1,2}/g)?.join(":")?.toUpperCase()}
                                            </code>
                                        </div>
                                        
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <span className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Signature Algorithm</span>
                                                <span className="text-sm text-zinc-900 dark:text-zinc-100">
                                                    {(forge.pki.oids as any)[cert.signatureOid] || cert.signatureOid}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Public Key</span>
                                                <span className="text-sm text-zinc-900 dark:text-zinc-100">
                                                    {(cert.publicKey as any)?.n ? `RSA (${(cert.publicKey as any).n.bitLength()} bits)` : "Unknown Algorithm"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Extensions */}
                                {cert.extensions && cert.extensions.length > 0 && (
                                    <div className="bg-white dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/50 space-y-4">
                                        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-700/50 pb-2">Extensions</h3>
                                        
                                        <div className="space-y-4">
                                            {cert.extensions.map((ext: any, idx: number) => {
                                                const extName = ext.name || (forge.pki.oids as any)[ext.id] || ext.id;
                                                
                                                if (ext.name === "subjectAltName") {
                                                    return (
                                                        <div key={idx} className="space-y-1">
                                                            <span className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Subject Alternative Names (SANs)</span>
                                                            <div className="flex flex-wrap gap-2 pt-1">
                                                                {ext.altNames.map((san: any, i: number) => (
                                                                    <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 rounded text-xs font-mono border border-indigo-100 dark:border-indigo-500/20">
                                                                        {san.type === 7 ? san.ip : san.value}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                if (ext.name === "keyUsage") {
                                                    return (
                                                        <div key={idx} className="space-y-1">
                                                            <span className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Key Usages</span>
                                                            <div className="flex flex-wrap gap-2 pt-1">
                                                                {["digitalSignature", "nonRepudiation", "keyEncipherment", "dataEncipherment", "keyAgreement", "keyCertSign", "cRLSign"].map(usage => (
                                                                    ext[usage] && (
                                                                        <span key={usage} className="px-2 py-1 bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 rounded text-xs border border-zinc-200 dark:border-zinc-700">
                                                                            {usage.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                                        </span>
                                                                    )
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                if (ext.name === "extKeyUsage") {
                                                    return (
                                                        <div key={idx} className="space-y-1">
                                                            <span className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Extended Key Usages</span>
                                                            <div className="flex flex-wrap gap-2 pt-1">
                                                                {Object.keys(ext).filter(k => k !== 'name' && k !== 'id' && k !== 'critical' && k !== 'value').map((usage: string) => (
                                                                    ext[usage] && (
                                                                        <span key={usage} className="px-2 py-1 bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 rounded text-xs border border-zinc-200 dark:border-zinc-700">
                                                                            {usage.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                                        </span>
                                                                    )
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return null;
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Send, CheckCircle2, MessageSquare } from "lucide-react";
import { useTabContext } from "@/lib/tab-context";
import Footer from "@/components/Footer";

export default function ContactPageClient() {
    const { goHome } = useTabContext();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [category, setCategory] = useState("Support");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: `Contact: ${category}`,
                    message: `Name: ${name}\n\nMessage:\n${message}`,
                    email,
                    timestamp: Date.now(),
                }),
            });

            if (res.ok) {
                setSubmitted(true);
                setName("");
                setEmail("");
                setMessage("");
            } else {
                throw new Error("Failed to send message.");
            }
        } catch (err) {
            setError("Something went wrong. Please try again or email us directly.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
            <div className="mx-auto w-full max-w-5xl flex-1 px-4 pt-20 pb-16 sm:px-6">
                <Link
                    href="/"
                    onClick={(e) => {
                        e.preventDefault();
                        goHome();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 mb-6"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Home
                </Link>

                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Contact Us
                </h1>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Have feedback, a feature request, or need help? Send us a message.
                </p>

                <div className="mt-8 grid gap-8 md:grid-cols-3">
                    {/* Sidebar info */}
                    <div className="md:col-span-1 space-y-4">
                        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 text-xs flex items-center gap-1.5 mb-2">
                                <Mail className="h-3.5 w-3.5 text-indigo-500" />
                                Email Us
                            </h3>
                            <a
                                href="mailto:support@toolich.com"
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                            >
                                support@toolich.com
                            </a>
                        </div>

                        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 text-xs flex items-center gap-1.5 mb-2">
                                <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
                                Open Source
                            </h3>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2">
                                Report bugs or contribute tools on GitHub.
                            </p>
                            <a
                                href="https://github.com/cratonik/toolich/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                                Open an Issue ➔
                            </a>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="md:col-span-2">
                        {submitted ? (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/20 p-6 dark:border-emerald-900/20 dark:bg-emerald-950/5 text-center space-y-3">
                                <div className="flex justify-center text-emerald-500">
                                    <CheckCircle2 className="h-10 w-10" />
                                </div>
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm">
                                    Message Sent Successfully!
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                    Thank you for getting in touch. We will review your message and get back to you if necessary.
                                </p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Your Name"
                                            className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                        Topic
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                                    >
                                        <option value="Support">Support Request</option>
                                        <option value="Feedback">Feedback</option>
                                        <option value="Feature Request">Feature Request</option>
                                        <option value="General">General Inquiry</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                        Message
                                    </label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Type your message here..."
                                        className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                                    />
                                </div>

                                {error && (
                                    <p className="text-[11px] text-red-500 font-medium">
                                        {error}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    {isSubmitting ? "Sending..." : "Send Message"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}

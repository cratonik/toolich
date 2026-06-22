"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Bot, User, CornerDownLeft, Megaphone } from "lucide-react";
import { useTabContext } from "@/lib/tab-context";
import { searchTools } from "@/lib/tool-registry";
import { renderSlackText } from "@/lib/slack-format";

type Message = {
    id: string;
    sender: "bot" | "user";
    text: string;
    options?: string[];
    toolLink?: { name: string; slug: string; category: string };
    toolLinks?: { name: string; slug: string; category: string }[];
    timestamp: number;
};

type FeedbackCategory = "bug" | "feature" | "feedback" | null;

const getTimestamp = () => Date.now();



interface FeedbackChatbotProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    activeBroadcast?: { text: string; timestamp: number } | null;
    onSeeBroadcast?: () => void;
}

export function FeedbackChatbot({ isOpen, setIsOpen, activeBroadcast, onSeeBroadcast }: FeedbackChatbotProps) {
    const { openTab } = useTabContext();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    // Auto-mark broadcast as seen when chatbot is open
    useEffect(() => {
        if (isOpen && activeBroadcast && onSeeBroadcast) {
            onSeeBroadcast();
        }
    }, [isOpen, activeBroadcast, onSeeBroadcast]);
    
    // Conversation State
    const [step, setStep] = useState<"initial" | "bug_desc" | "feature_desc" | "feedback_desc" | "email" | "completed">("initial");
    const [category, setCategory] = useState<FeedbackCategory>(null);
    const [feedbackText, setFeedbackText] = useState("");

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Initial greeting on load
    useEffect(() => {
        if (messages.length === 0) {
            const timer = setTimeout(() => {
                setMessages([
                    {
                        id: "init-1",
                        sender: "bot",
                        text: "Hi! I'm the Toolich Assistant. 👋 How can I help you today? Please choose an option or type your question below:",
                        options: [
                            "🐛 Report a Bug",
                            "💡 Suggest a Feature",
                            "💬 General Feedback",
                            "🔍 Ask about Tools"
                        ],
                        timestamp: getTimestamp(),
                    }
                ]);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [messages.length]);

    // Scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isTyping, isOpen, scrollToBottom]);

    const addBotMessage = useCallback((
        text: string,
        options?: string[],
        toolLink?: { name: string; slug: string; category: string },
        toolLinks?: { name: string; slug: string; category: string }[]
    ) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages((prev) => [
                ...prev,
                {
                    id: `bot-${Math.random().toString(36).substring(2, 9)}`,
                    sender: "bot",
                    text,
                    options,
                    toolLink,
                    toolLinks,
                    timestamp: getTimestamp(),
                }
            ]);
        }, 850);
    }, []);


    // Handle feedback submission to backend
    const submitFeedback = async (emailAddr: string) => {
        const payload = {
            category,
            message: feedbackText,
            email: emailAddr === "Skipped" ? "" : emailAddr,
            timestamp: getTimestamp()
        };

        // 1. Local Storage fallback
        try {
            const saved = localStorage.getItem("toolich-feedback");
            const feedbackList = saved ? JSON.parse(saved) : [];
            feedbackList.push(payload);
            localStorage.setItem("toolich-feedback", JSON.stringify(feedbackList));
        } catch (err) {
            console.error("Local feedback storage error:", err);
        }

        // 2. POST to our secure server-side API route
        try {
            await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.error("Server feedback dispatch error:", err);
        }
    };

    const handleOptionSelect = (option: string) => {
        // Add user response to chat logs
        setMessages((prev) => [
            ...prev,
            {
                id: `user-${Math.random().toString(36).substring(2, 9)}`,
                sender: "user",
                text: option,
                timestamp: getTimestamp()
            }
        ]);

        if (option === "🐛 Report a Bug") {
            setStep("bug_desc");
            setCategory("bug");
            addBotMessage("Oh no! 😢 I'm sorry about that. Please describe the bug or issue you encountered in detail:");
        } else if (option === "💡 Suggest a Feature") {
            setStep("feature_desc");
            setCategory("feature");
            addBotMessage("Excellent! 💡 We love feedback. What feature or tool would you like to see added to Toolich?");
        } else if (option === "💬 General Feedback") {
            setStep("feedback_desc");
            setCategory("feedback");
            addBotMessage("We'd love to hear your thoughts! 💖 Please tell us about your experience using Toolich:");
        } else if (option === "🔍 Ask about Tools") {
            addBotMessage("I can help locate tools. Simply type a task you want to do (e.g. 'formatting json', 'compare texts', or 'generate password')!");
        } else if (option === "Skip") {
            if (step === "email") {
                submitFeedback("Skipped");
                setStep("completed");
                addBotMessage("All set! 🎉 Your feedback has been recorded securely. Thank you for helping us improve Toolich!", ["Start Over", "Close Chat"]);
            }
        } else if (option === "Start Over") {
            setStep("initial");
            setCategory(null);
            setFeedbackText("");
            addBotMessage("How else can I assist you?", [
                "🐛 Report a Bug",
                "💡 Suggest a Feature",
                "💬 General Feedback",
                "🔍 Ask about Tools"
            ]);
        } else if (option === "Close Chat") {
            setIsOpen(false);
        }
    };

    const handleSend = () => {
        const text = inputValue.trim();
        if (!text) return;

        setMessages((prev) => [
            ...prev,
            {
                id: `user-${Math.random().toString(36).substring(2, 9)}`,
                sender: "user",
                text,
                timestamp: getTimestamp()
            }
        ]);
        setInputValue("");

        // Guided flows
        if (step === "bug_desc" || step === "feature_desc" || step === "feedback_desc") {
            setFeedbackText(text);
            setStep("email");
            addBotMessage("Got it! Please share your email address if you'd like our developers to follow up (otherwise, click 'Skip'):", ["Skip"]);
        } else if (step === "email") {
            submitFeedback(text);
            setStep("completed");
            addBotMessage("All set! 🎉 Your feedback has been recorded securely. Thank you for helping us improve Toolich!", ["Start Over", "Close Chat"]);
        } else {
            // Search all tools in the registry
            const matchedTools = searchTools(text);

            if (matchedTools.length > 0) {
                if (matchedTools.length === 1) {
                    const tool = matchedTools[0];
                    addBotMessage(
                        `I found a matching tool! Check out the ${tool.name}. Click below to open it directly:`,
                        [],
                        undefined,
                        [{ name: tool.name, slug: tool.slug, category: tool.category }]
                    );
                } else {
                    addBotMessage(
                        `I found ${matchedTools.length} tools matching "${text}":`,
                        [],
                        undefined,
                        matchedTools.map((t) => ({ name: t.name, slug: t.slug, category: t.category }))
                    );
                }
            } else {
                addBotMessage(
                    `I couldn't find any tools matching "${text}". I can help guide you to our tools or collect feedback. Please choose an option below:`,
                    [
                        "🐛 Report a Bug",
                        "💡 Suggest a Feature",
                        "💬 General Feedback",
                        "🔍 Ask about Tools"
                    ]
                );
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleToolClick = (tool: { name: string; slug: string; category: string }) => {
        openTab(tool);
        setIsOpen(false);
    };

    return (
        <>
            {/* Chat Panel Box */}
            {isOpen && (
                <div
                    className="fixed inset-0 md:top-auto md:left-auto md:bottom-20 md:right-6 z-50 flex h-full w-full md:h-[480px] md:w-96 flex-col overflow-hidden rounded-none md:rounded-2xl border-0 md:border border-zinc-200 bg-white/95 shadow-2xl backdrop-blur-xl transition-all dark:border-zinc-800 dark:bg-zinc-900/95"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-3.5 text-white dark:from-indigo-600 dark:to-indigo-700">
                        <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            <div>
                                <h3 className="text-sm font-semibold leading-none">Toolich Assistant</h3>
                                <span className="text-[10px] text-indigo-100 flex items-center gap-1 mt-0.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Online
                                    <span className="text-indigo-300/60 mx-1">|</span>
                                    <span className="opacity-90 font-medium tracking-wider text-[9px] uppercase">Cratonik</span>
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-indigo-100 hover:bg-white/10 hover:text-white transition-colors"
                            aria-label="Close panel"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
                        {/* Active Slack Announcement Banner */}
                        {activeBroadcast && (
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3.5 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200">
                                <div className="flex items-start gap-3">
                                    {/* Logo with light catchy radar ping and bounce effect */}
                                    <div className="relative shrink-0">
                                        <span className="absolute inset-0 rounded-lg bg-indigo-400/30 dark:bg-indigo-400/20 animate-ping" />
                                        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                            <Megaphone className="h-4 w-4 animate-bounce" style={{ animationDuration: '3s' }} />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                                                Admin announcement
                                            </span>
                                            <span className="text-[9px] text-zinc-400 dark:text-zinc-500">
                                                {new Date(activeBroadcast.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs leading-relaxed mt-1 font-medium whitespace-pre-wrap">
                                            {renderSlackText(activeBroadcast.text)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-2.5 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                {/* Avatar */}
                                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                                    msg.sender === "bot" 
                                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400" 
                                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                                }`}>
                                    {msg.sender === "bot" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                </div>

                                {/* Text Bubble */}
                                <div className="space-y-2 max-w-[75%]">
                                    <div className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                                        msg.sender === "bot"
                                            ? "rounded-tl-none bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                                            : "rounded-tr-none bg-indigo-600 text-white dark:bg-indigo-500"
                                    }`}>
                                        {msg.text}
                                    </div>

                                    {/* Link Recommendation Action button */}
                                    {msg.toolLink && (
                                        <button
                                            type="button"
                                            onClick={() => handleToolClick(msg.toolLink!)}
                                            className="block w-full text-left rounded-xl border border-indigo-200 bg-indigo-50/50 p-2.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-400 transition-all active:scale-[0.98]"
                                        >
                                            🚀 Open {msg.toolLink.name}
                                        </button>
                                    )}

                                    {/* Multiple Link Recommendations */}
                                    {msg.toolLinks && msg.toolLinks.length > 0 && (
                                        <div className="space-y-1.5 w-full">
                                            {msg.toolLinks.map((tool) => (
                                                <button
                                                    key={tool.slug}
                                                    type="button"
                                                    onClick={() => handleToolClick(tool)}
                                                    className="block w-full text-left rounded-xl border border-indigo-200 bg-indigo-50/50 p-2.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-400 transition-all active:scale-[0.98]"
                                                >
                                                    🚀 Open {tool.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}


                                    {/* Action Options wrapper */}
                                    {msg.options && msg.options.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {msg.options.map((opt) => (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() => handleOptionSelect(opt)}
                                                    className="rounded-full border border-indigo-100 bg-indigo-50/30 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 dark:border-indigo-900/40 dark:bg-indigo-950/10 dark:text-indigo-400 dark:hover:bg-indigo-950/30 dark:hover:border-indigo-800 transition-all duration-150"
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Typing Animation */}
                        {isTyping && (
                            <div className="flex gap-2.5">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="rounded-2xl rounded-tl-none bg-zinc-100 px-3.5 py-2.5 dark:bg-zinc-800 flex items-center gap-1 h-8">
                                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input footer form */}
                    <div className="border-t border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                        <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-1 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-within:border-indigo-500">
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={
                                    step === "email" 
                                        ? "Type your email address..." 
                                        : step !== "initial" && step !== "completed" 
                                            ? "Describe it here..." 
                                            : "Type your query..."
                                }
                                rows={1}
                                className="flex-1 resize-none bg-transparent py-1.5 px-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                            />
                            <button
                                type="button"
                                onClick={handleSend}
                                disabled={!inputValue.trim()}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white transition-all hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Send message"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 px-1 mt-1.5">
                            <span className="flex items-center gap-1">
                                <span>Press Enter to send</span>
                                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                <span className="font-semibold tracking-wide hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">Cratonik</span>
                            </span>
                            <span className="flex items-center gap-0.5">
                                <CornerDownLeft className="h-2.5 w-2.5" />
                                Send
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

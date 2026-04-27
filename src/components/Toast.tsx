"use client";

import { useState, useCallback, createContext, useContext, type ReactNode } from "react";

type Toast = {
    id: number;
    message: string;
    type: "info" | "warning" | "error";
};

type ToastContextType = {
    showToast: (message: string, type?: "info" | "warning" | "error") => void;
};

const ToastContext = createContext<ToastContextType>({
    showToast: () => { },
});

export function useToast() {
    return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: "info" | "warning" | "error" = "info") => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const typeStyles = {
        info: "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
        warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-600/50 dark:bg-amber-900/30 dark:text-amber-400",
        error: "border-red-200 bg-red-50 text-red-700 dark:border-red-600/50 dark:bg-red-900/30 dark:text-red-400",
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast container — bottom right */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`animate-slide-in-right rounded-lg border px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur-sm ${typeStyles[toast.type]}`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

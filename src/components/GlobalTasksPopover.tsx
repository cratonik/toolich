"use client";

import { useState, useRef, useEffect } from "react";
import { ListTodo, CheckCircle2, Circle, Plus, ArrowRight } from "lucide-react";
import { useLocalStorage } from "@/lib/use-local-storage";
import Link from "next/link";
import { useTabContext } from "@/lib/tab-context";

export interface NotebookTask {
    id: string;
    content: string;
    isImportant: boolean;
    isCompleted: boolean;
    createdAt: number;
}

export function GlobalTasksPopover() {
    const [tasks, setTasks] = useLocalStorage<NotebookTask[]>("notebook:tasks", []);
    const [isOpen, setIsOpen] = useState(false);
    const [newTaskContent, setNewTaskContent] = useState("");
    const popoverRef = useRef<HTMLDivElement>(null);
    const { openTab } = useTabContext();

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const importantTasks = tasks.filter(t => t.isImportant && !t.isCompleted);

    const toggleTaskCompletion = (id: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskContent.trim()) return;
        
        const newTask: NotebookTask = {
            id: Date.now().toString(),
            content: newTaskContent.trim(),
            isImportant: true, // Auto-mark as important if added from header
            isCompleted: false,
            createdAt: Date.now(),
        };
        
        setTasks(prev => [newTask, ...prev]);
        setNewTaskContent("");
    };

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:text-indigo-600 hover:bg-zinc-100 transition-all dark:text-zinc-400 dark:hover:text-indigo-400 dark:hover:bg-zinc-800 group shadow-sm hover:shadow"
                aria-label="Important Tasks"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                    {/* Bottom Rectangle - Rose */}
                    <rect x="3" y="11" width="12" height="9" rx="2" fill="#f43f5e" className="transition-transform duration-300 origin-bottom-left group-hover:-rotate-[15deg] group-hover:-translate-x-1" />
                    {/* Middle Rectangle - Amber */}
                    <rect x="6" y="7.5" width="12" height="9" rx="2" fill="#f59e0b" className="transition-transform duration-300 origin-center group-hover:scale-[1.15]" />
                    {/* Top Rectangle - Indigo */}
                    <rect x="9" y="4" width="12" height="9" rx="2" fill="#6366f1" className="transition-transform duration-300 origin-top-right group-hover:rotate-[15deg] group-hover:translate-x-1" />
                </svg>
                {importantTasks.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-950 animate-in zoom-in">
                        {importantTasks.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-[100] flex flex-col max-h-[85vh]">
                    <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between items-center">
                        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <ListTodo className="w-4 h-4 text-indigo-500" />
                            Important Tasks
                        </h3>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {importantTasks.length}
                        </span>
                    </div>

                    <div className="overflow-y-auto p-2 max-h-[300px]">
                        {importantTasks.length === 0 ? (
                            <div className="text-center py-6 text-sm text-zinc-500 dark:text-zinc-400">
                                No important tasks pending!
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {importantTasks.map(task => (
                                    <div key={task.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 group transition-colors">
                                        <button 
                                            onClick={() => toggleTaskCompletion(task.id)}
                                            className="mt-0.5 shrink-0 text-zinc-400 hover:text-emerald-500 transition-colors"
                                        >
                                            <Circle className="w-4 h-4" />
                                        </button>
                                        <span className="text-sm text-zinc-700 dark:text-zinc-300 leading-tight">
                                            {task.content}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                        <form onSubmit={handleAddTask} className="relative flex items-center">
                            <input 
                                type="text" 
                                placeholder="Add an important task..." 
                                value={newTaskContent}
                                onChange={(e) => setNewTaskContent(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-zinc-400"
                            />
                            <button 
                                type="submit"
                                disabled={!newTaskContent.trim()}
                                className="absolute right-1.5 p-1.5 rounded-md text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 disabled:opacity-50 disabled:hover:bg-transparent"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </form>
                        
                        <button 
                            onClick={() => {
                                setIsOpen(false);
                                openTab({ name: "Notebook", slug: "notebook", category: "managers" });
                            }}
                            className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                        >
                            Open full Notebook
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import Editor from "@monaco-editor/react";
import { Play, Square, Trash2, Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { useSessionState } from "@/lib/use-session-state";
import { useTheme } from "@/lib/theme-context";

interface OutputMessage {
    type: "stdout" | "stderr" | "system" | "stdin";
    text: string;
}

const DEFAULT_CODE = `# Write your Python code here!

def fibonacci(n):
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
    return sequence

print(f"First 10 Fibonacci numbers: {fibonacci(10)}")
`;

const EXAMPLE_CLI_CODE = `import json
import os
from datetime import datetime

class Task:
    """Represents a single task in the system."""
    def __init__(self, task_id, title, category="General", priority="Medium", due_date=None):
        self.task_id = task_id
        self.title = title
        self.category = category
        self.priority = priority
        self.due_date = due_date
        self.completed = False
        self.created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def mark_complete(self):
        self.completed = True

    def to_dict(self):
        """Converts task data to a dictionary for JSON serialization."""
        return {
            "task_id": self.task_id,
            "title": self.title,
            "category": self.category,
            "priority": self.priority,
            "due_date": self.due_date,
            "completed": self.completed,
            "created_at": self.created_at
        }

    @classmethod
    def from_dict(cls, data):
        """Creates a Task instance from a dictionary structure."""
        task = cls(data["task_id"], data["title"], data["category"], data["priority"], data["due_date"])
        task.completed = data["completed"]
        task.created_at = data["created_at"]
        return task

class TaskManager:
    """Manages collection of tasks, handles file updates, and user logic."""
    def __init__(self, storage_file="tasks_data.json"):
        self.storage_file = storage_file
        self.tasks = self._load_data()

    def _load_data(self):
        """Loads tasks from local JSON storage repository."""
        if not os.path.exists(self.storage_file):
            return {}
        try:
            with open(self.storage_file, "r") as file:
                data = json.load(file)
                return {int(k): Task.from_dict(v) for k, v in data.items()}
        except (json.JSONDecodeError, KeyError, ValueError):
            print("⚠️ Storage file corrupted. Starting with an empty database.")
            return {}

    def _save_data(self):
        """Writes current list of tasks safely to storage disk."""
        with open(self.storage_file, "w") as file:
            serialized = {str(k): v.to_dict() for k, v in self.tasks.items()}
            json.dump(serialized, file, indent=4)

    def add_task(self, title, category, priority, due_date):
        """Calculates unique task id and saves new task."""
        next_id = max(self.tasks.keys()) + 1 if self.tasks else 1
        new_task = Task(next_id, title, category, priority, due_date)
        self.tasks[next_id] = new_task
        self._save_data()
        print(f"✅ Task #{next_id} successfully added!")

    def remove_task(self, task_id):
        """Deletes item matching id from the database system."""
        if task_id in self.tasks:
            del self.tasks[task_id]
            self._save_data()
            print(f"🗑️ Task #{task_id} has been permanently deleted.")
        else:
            print("❌ Error: Task identifier not located.")

    def complete_task(self, task_id):
        """Flags targeted item as completed inside memory state."""
        if task_id in self.tasks:
            self.tasks[task_id].mark_complete()
            self._save_data()
            print(f"🎉 Task #{task_id} successfully marked as finished!")
        else:
            print("❌ Error: Task identifier not located.")

    def display_tasks(self, filter_type="all"):
        """Renders filtered formatted output data list cleanly inside console."""
        if not self.tasks:
            print("📋 No items stored in database.")
            return

        print("\\n" + "="*70)
        print(f"{'ID':<5} {'Title':<25} {'Category':<12} {'Priority':<10} {'Status':<10}")
        print("="*70)

        for t_id, task in self.tasks.items():
            if filter_type == "pending" and task.completed:
                continue
            if filter_type == "completed" and not task.completed:
                continue

            status = "🟢 Done" if task.completed else "🔴 Pending"
            print(f"{t_id:<5} {task.title[:23]:<25} {task.category:<12} {task.priority:<10} {status:<10}")
        print("="*70 + "\\n")

def clear_screen():
    """Wipes past history logs clean visually inside standard consoles."""
    os.system("cls" if os.name == "nt" else "clear")

def main():
    """Main operational interface loop runner wrapper."""
    manager = TaskManager()

    while True:
        print("--- TASK MASTER PRODUCTIVITY CLI ---")
        print("1. View Pending Tasks")
        print("2. View All Tasks")
        print("3. View Completed Tasks")
        print("4. Add New Task")
        print("5. Complete a Task")
        print("6. Remove a Task")
        print("7. Exit Program")
        
        choice = input("\\nSelect an operational choice (1-7): ").strip()

        if choice == "1":
            clear_screen()
            manager.display_tasks(filter_type="pending")
        elif choice == "2":
            clear_screen()
            manager.display_tasks(filter_type="all")
        elif choice == "3":
            clear_screen()
            manager.display_tasks(filter_type="completed")
        elif choice == "4":
            clear_screen()
            title = input("Enter task title summary: ").strip()
            if not title:
                print("❌ Invalid Task: Title string cannot match an empty value.")
                continue
            category = input("Enter category label (default: General): ").strip() or "General"
            priority = input("Enter priority metric [Low/Medium/High] (default: Medium): ").strip() or "Medium"
            due_date = input("Enter completion target deadline date [YYYY-MM-DD] (Optional): ").strip() or None
            manager.add_task(title, category, priority, due_date)
        elif choice in ["5", "6"]:
            clear_screen()
            try:
                target_id = int(input("Enter relevant system task ID: ").strip())
                if choice == "5":
                    manager.complete_task(target_id)
                else:
                    manager.remove_task(target_id)
            except ValueError:
                print("❌ Error: Please type an integer value format.")
        elif choice == "7":
            print("\\n👋 System turning off. Remain efficient today!")
            break
        else:
            print("⚠️ Selection error. Please choose options available from 1 to 7.")
        
        input("\\nPress Enter key to proceed back to dashboard menu...")
        clear_screen()

if __name__ == "__main__":
    main()
`;

export default function PythonCompiler() {
    const { resolvedTheme } = useTheme();
    const [code, setCode] = useSessionState("python-compiler:code", DEFAULT_CODE);
    const [output, setOutput] = useState<OutputMessage[]>([
        { type: "system", text: "Python Environment Ready (Pyodide 0.25.1)" }
    ]);
    const [isRunning, setIsRunning] = useState(false);
    const [isWorkerReady, setIsWorkerReady] = useState(false);
    const [isAwaitingInput, setIsAwaitingInput] = useState(false);
    const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const workerRef = useRef<Worker | null>(null);

    const initWorker = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
        }
        
        setIsAwaitingInput(false);
        setCurrentExecutionId(null);
        
        const worker = new Worker(new URL("./pyodide.worker.ts", import.meta.url));
        
        worker.onmessage = (e) => {
            const { type, text, error, results, id } = e.data;
            if (type === "awaiting_input") {
                setIsAwaitingInput(true);
                setCurrentExecutionId(id);
                setTimeout(() => inputRef.current?.focus(), 50);
            } else if (type === "stdout" || type === "stderr") {
                setOutput((prev) => [...prev, { type, text }]);
            } else if (type === "success") {
                if (results && results !== "undefined") {
                    setOutput((prev) => [...prev, { type: "stdout", text: `>>> ${results}` }]);
                }
                setIsRunning(false);
                setIsAwaitingInput(false);
            } else if (type === "error") {
                setOutput((prev) => [...prev, { type: "stderr", text: error }]);
                setIsRunning(false);
                setIsAwaitingInput(false);
            }
        };
        
        workerRef.current = worker;
        setIsWorkerReady(true);
    }, []);

    useEffect(() => {
        initWorker();
        return () => {
            workerRef.current?.terminate();
        };
    }, [initWorker]);

    const runCode = useCallback(() => {
        if (!workerRef.current || !isWorkerReady) return;
        setIsRunning(true);
        setOutput([{ type: "system", text: "Executing..." }]);
        workerRef.current.postMessage({ id: crypto.randomUUID(), code });
    }, [code, isRunning, isWorkerReady]);

    const stopCode = useCallback(() => {
        if (workerRef.current && isRunning) {
            setIsRunning(false);
            setIsAwaitingInput(false);
            setCurrentExecutionId(null);
            setOutput((prev) => [...prev, { type: "system", text: "\nExecution interrupted." }]);
            initWorker(); // Restart worker to kill the process
        }
    }, [isRunning, initWorker]);

    const handleInputSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!currentExecutionId) return;

        setOutput((prev) => [...prev, { type: "stdin", text: `${inputValue}\n` }]);
        
        const id = currentExecutionId;
        const text = inputValue;

        setIsAwaitingInput(false);
        setCurrentExecutionId(null);
        setInputValue("");

        try {
            await fetch("/api/python-input", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, text })
            });
        } catch (error) {
            console.error("Failed to send input", error);
        }
    };

    const clearOutput = useCallback(() => {
        setOutput([]);
    }, []);

    const handleReset = useCallback(() => {
        setCode(DEFAULT_CODE);
        clearOutput();
        if (workerRef.current) {
            initWorker();
        }
    }, [setCode, clearOutput, initWorker]);

    const handleClearEditor = useCallback(() => {
        setCode("");
    }, [setCode]);

    const handleLoadExample = useCallback(() => {
        setCode(EXAMPLE_CLI_CODE);
    }, [setCode]);

    return (
        <div className="flex flex-col h-[700px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden md:flex-row">
            {/* Editor Pane */}
            <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 relative min-h-[300px] md:min-h-0 w-full md:w-1/2">
                <div className="flex items-center justify-between h-14 px-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">main.py</span>
                    <div className="flex gap-2">
                        <button
                            onClick={handleLoadExample}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                            title="Load Task Master CLI Example"
                        >
                            Example
                        </button>
                        <button
                            onClick={handleReset}
                            className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                            title="Reset Code & Terminal"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={handleClearEditor}
                            className="p-1.5 mr-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                            title="Clear Editor"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        {isRunning ? (
                            <button
                                onClick={stopCode}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30"
                            >
                                <Square className="h-3.5 w-3.5 fill-current" />
                                Stop
                            </button>
                        ) : (
                            <button
                                onClick={runCode}
                                disabled={!isWorkerReady}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Play className="h-3.5 w-3.5 fill-current" />
                                Run
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-hidden relative">
                    <Editor
                        height="100%"
                        language="python"
                        theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                        value={code}
                        onChange={(val) => setCode(val ?? "")}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                            padding: { top: 16 },
                            scrollBeyondLastLine: false,
                            smoothScrolling: true,
                            cursorBlinking: "smooth",
                        }}
                        loading={
                            <div className="flex items-center justify-center h-full w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-400">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        }
                    />
                </div>
            </div>

            {/* Terminal Pane */}
            <div className="flex-1 flex flex-col bg-white dark:bg-[#1e1e1e] w-full md:w-1/2">
                <div className="flex items-center justify-between h-14 px-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Terminal</span>
                </div>
                <div className="flex-1 p-4 overflow-y-auto font-mono text-[13px] leading-relaxed">
                    {output.map((out, i) => (
                        <div
                            key={i}
                            className={`whitespace-pre-wrap break-words ${
                                out.type === "stderr"
                                    ? "text-red-500 dark:text-red-400"
                                    : out.type === "system"
                                    ? "text-zinc-500 dark:text-zinc-500 italic"
                                    : out.type === "stdin"
                                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 -mx-1 rounded"
                                    : "text-zinc-800 dark:text-zinc-300"
                            }`}
                        >
                            {out.text}
                        </div>
                    ))}
                    {isAwaitingInput && (
                        <form onSubmit={handleInputSubmit} className="mt-2 flex items-center">
                            <span className="text-emerald-500 font-bold mr-2">{">"}</span>
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-zinc-800 dark:text-zinc-300 font-mono text-[13px]"
                                placeholder="Type input here..."
                                autoComplete="off"
                            />
                        </form>
                    )}
                    {isRunning && !isAwaitingInput && (
                        <div className="flex items-center gap-2 text-zinc-500 mt-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span className="italic">Running...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

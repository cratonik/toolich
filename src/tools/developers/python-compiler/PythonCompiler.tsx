"use client";

import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import Editor from "@monaco-editor/react";
import { Play, Square, Loader2, RotateCcw, Trash2, Code2, ChevronDown } from "lucide-react";
import { useSessionState } from "@/lib/use-session-state";
import { useTheme } from "@/lib/theme-context";

interface OutputMessage {
    type: "stdout" | "stderr" | "system" | "stdin" | "html";
    text?: string;
    html?: string;
}

const DEFAULT_CODE = `# Welcome to the Interactive Python Compiler!
#
# 🚀 PRO TIPS for Advanced Rendering:
# 1. Render HTML/SVG inline: display_html("<svg>...</svg>")
# 2. Render Matplotlib charts: display_matplotlib()
#
# Example Chart:
# import matplotlib.pyplot as plt
# plt.plot([1, 2, 3], [1, 4, 9])
# display_matplotlib()

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print("Fibonacci sequence up to 10:")
for i in range(10):
    print(f"fib({i}) = {fibonacci(i)}")
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

const EXAMPLE_MATPLOTLIB_CODE = `import numpy as np
import matplotlib.pyplot as plt

def render_quantum_ripple():
    # 1. Create a dense 2D grid of X and Y coordinates
    x = np.linspace(-15, 15, 400)
    y = np.linspace(-15, 15, 400)
    X, Y = np.meshgrid(x, y)
    
    # 2. Calculate the radial distance from the center for every point
    R = np.sqrt(X**2 + Y**2)
    
    # 3. Apply the wave mathematics to generate the Z (height) axis
    # The sine wave creates the ripples, while dividing by (R + 1) makes them decay outward
    Z = np.sin(R) / (R + 1) * np.cos(X / 3)
    
    # 4. Set up the canvas with a deep, dark aesthetic
    fig = plt.figure(figsize=(10, 8), facecolor='#05050b')
    ax = fig.add_subplot(111, projection='3d')
    ax.set_facecolor('#05050b')
    
    # Hide the structural axes so only the floating geometry remains
    ax.axis('off')
    
    # 5. Render the 3D surface
    # 'magma' creates a stunning gradient from dark purple to glowing white/yellow
    surf = ax.plot_surface(X, Y, Z, 
                           cmap='magma', 
                           linewidth=0,       # Removes the wireframe lines for a smooth look
                           antialiased=True,  # Smooths the edges
                           alpha=0.95)        # Slight transparency
    
    # 6. Adjust the camera angle for the most dramatic perspective
    # elev = elevation (tilt), azim = azimuth (rotation)
    ax.view_init(elev=35, azim=45)
    
    plt.tight_layout()
    
    # Render using your compiler's specific output hook
    display_matplotlib()

if __name__ == "__main__":
    render_quantum_ripple()`;

const EXAMPLE_SVG_CODE = `def render_animated_hud():
    svg_code = """
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" style="background-color: #0b0c10; width: 100%; max-width: 500px;">
      <g transform="translate(250, 250)">
        
        <!-- Outer rotating dashed ring -->
        <circle cx="0" cy="0" r="180" fill="none" stroke="#66fcf1" stroke-width="2" stroke-dasharray="20 40 100 20">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="15s" repeatCount="indefinite" />
        </circle>
        
        <!-- Middle reverse-rotating ring -->
        <circle cx="0" cy="0" r="140" fill="none" stroke="#45a29e" stroke-width="4" stroke-dasharray="1 15 50 15">
          <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="10s" repeatCount="indefinite" />
        </circle>
        
        <!-- Inner technical hexagon -->
        <polygon points="0,-90 78,-45 78,45 0,90 -78,45 -78,-45" fill="none" stroke="#1f2833" stroke-width="3">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="20s" repeatCount="indefinite" />
        </polygon>

        <!-- Pulsing center core -->
        <circle cx="0" cy="0" r="40" fill="#66fcf1">
          <animate attributeName="r" values="40; 55; 40" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8; 0.2; 0.8" dur="3s" repeatCount="indefinite" />
        </circle>
        
        <!-- Core accent dot -->
        <circle cx="0" cy="0" r="10" fill="#0b0c10" />
      </g>
    </svg>
    """
    
    # Inject the raw HTML/SVG into your compiler's output pane
    display_html(svg_code)

if __name__ == "__main__":
    render_animated_hud()`;

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
            const { type, text, html, error, results, id } = e.data;
            if (type === "awaiting_input") {
                setIsAwaitingInput(true);
                setCurrentExecutionId(id);
                setTimeout(() => inputRef.current?.focus(), 50);
            } else if (type === "stdout" || type === "stderr") {
                setOutput((prev) => [...prev, { type, text }]);
            } else if (type === "html") {
                setOutput((prev) => [...prev, { type, html }]);
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
        <div className="flex flex-col gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 p-3.5 rounded-xl text-sm flex items-start gap-3 shadow-sm">
                <span className="text-lg leading-none">💡</span>
                <div>
                    <strong className="font-semibold">Pro Tip: Inline Graphics Supported!</strong>
                    <p className="mt-1 text-emerald-700 dark:text-emerald-400 opacity-90">
                        This compiler can render interactive charts and vector graphics directly in the terminal output. 
                        Use <code className="bg-emerald-100 dark:bg-emerald-800/40 px-1 py-0.5 rounded text-xs font-mono">display_html("&lt;svg&gt;...&lt;/svg&gt;")</code> for raw SVG/HTML, 
                        or <code className="bg-emerald-100 dark:bg-emerald-800/40 px-1 py-0.5 rounded text-xs font-mono">display_matplotlib()</code> after creating a `matplotlib` figure!
                    </p>
                </div>
            </div>

            <div className="flex flex-col h-[700px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden md:flex-row">
                {/* Editor Pane */}
            <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 relative min-h-[300px] md:min-h-0 w-full md:w-1/2">
                <div className="flex items-center justify-between h-14 px-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">main.py</span>
                    <div className="flex gap-2">
                        <div className="relative">
                            <select 
                                onChange={(e) => {
                                    if (e.target.value === "cli") setCode(EXAMPLE_CLI_CODE);
                                    else if (e.target.value === "matplotlib") setCode(EXAMPLE_MATPLOTLIB_CODE);
                                    else if (e.target.value === "svg") setCode(EXAMPLE_SVG_CODE);
                                    e.target.value = ""; // Reset selection state after action
                                }}
                                className="appearance-none px-2.5 py-1.5 pr-7 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors outline-none cursor-pointer bg-transparent"
                                title="Load Example"
                            >
                                <option value="" disabled selected hidden>Examples</option>
                                <option value="cli">CLI App</option>
                                <option value="matplotlib">3D Ripple (Matplotlib)</option>
                                <option value="svg">Animated HUD (SVG)</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                                <ChevronDown className="h-3 w-3" />
                            </div>
                        </div>
                        <button
                            onClick={handleReset}
                            className="px-2.5 py-1.5 flex items-center gap-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                            title="Reset Code & Terminal"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset
                        </button>
                        <button
                            onClick={handleClearEditor}
                            className="px-2.5 py-1.5 flex items-center gap-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors mr-1"
                            title="Clear Editor"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Clear
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
                            {out.type === "html" && out.html ? (
                                <div 
                                    className="my-4 p-2 bg-white rounded shadow-sm border border-zinc-200 w-fit max-w-full overflow-auto"
                                    dangerouslySetInnerHTML={{ __html: out.html }} 
                                />
                            ) : (
                                out.text
                            )}
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
        </div>
    );
}

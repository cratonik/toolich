"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Trash2, Edit2, FileText, Search, Clock, Save, FileOutput, FileCode2, ListTodo, Star, Circle, CheckCircle2, Tag, ChevronDown } from "lucide-react";
import { useLocalStorage } from "@/lib/use-local-storage";
import { marked } from "marked";

interface NoteCategory {
    id: string;
    name: string;
    color: string;
}

const DEFAULT_CATEGORIES: NoteCategory[] = [
    { id: "cat-work", name: "Work", color: "#6366f1" },
    { id: "cat-personal", name: "Personal", color: "#f59e0b" },
    { id: "cat-ideas", name: "Ideas", color: "#10b981" },
];

const PRESET_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#0ea5e9"];

interface Note {
    id: string;
    title: string;
    content: string;
    categoryId?: string;
    createdAt: number;
    updatedAt: number;
}

export interface NotebookTask {
    id: string;
    content: string;
    isImportant: boolean;
    isCompleted: boolean;
    createdAt: number;
}

export default function Notebook() {
    const [notes, setNotes] = useLocalStorage<Note[]>("notebook:notes", []);
    const [categories, setCategories] = useLocalStorage<NoteCategory[]>("notebook:categories", DEFAULT_CATEGORIES);
    const [activeNoteId, setActiveNoteId] = useLocalStorage<string | null>("notebook:active_note", null);
    
    const [tasks, setTasks] = useLocalStorage<NotebookTask[]>("notebook:tasks", []);
    const [activeTab, setActiveTab] = useLocalStorage<"notes" | "tasks">("notebook:active_tab", "notes");
    const [newTaskContent, setNewTaskContent] = useState("");
    
    const [searchQuery, setSearchQuery] = useState("");
    const [isPreview, setIsPreview] = useState(false);
    
    const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const categoryMenuRef = useRef<HTMLDivElement>(null);
    
    const [dragOverCatId, setDragOverCatId] = useState<string | null>(null);

    // Close category menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
                setIsCategoryMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Make sure we have a valid active note
    useEffect(() => {
        if (!activeNoteId && notes.length > 0) {
            setActiveNoteId(notes[0].id);
        }
    }, [activeNoteId, notes, setActiveNoteId]);

    const activeNote = useMemo(() => {
        return notes.find(n => n.id === activeNoteId) || null;
    }, [notes, activeNoteId]);

    const filteredNotes = useMemo(() => {
        if (!searchQuery) return notes;
        const q = searchQuery.toLowerCase();
        return notes.filter(n => 
            n.title.toLowerCase().includes(q) || 
            n.content.toLowerCase().includes(q)
        );
    }, [notes, searchQuery]);

    const groupedNotes = useMemo(() => {
        const groups = new Map<string | null, Note[]>();
        // Initialize groups in predictable order
        categories.forEach(c => groups.set(c.id, []));
        groups.set(null, []); // Uncategorized last
        
        filteredNotes.forEach(n => {
            if (n.categoryId && groups.has(n.categoryId)) {
                groups.get(n.categoryId)!.push(n);
            } else {
                groups.get(null)!.push(n);
            }
        });
        
        return groups;
    }, [filteredNotes, categories]);

    const handleCreateNote = () => {
        const newNote: Note = {
            id: Date.now().toString(),
            title: "Untitled Note",
            content: "",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        setNotes(prev => [newNote, ...prev]);
        setActiveNoteId(newNote.id);
        setIsPreview(false);
    };

    const handleDeleteNote = (id: string) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;
        setNotes(prev => prev.filter(n => n.id !== id));
        if (activeNoteId === id) {
            setActiveNoteId(null);
        }
    };

    const handleUpdateNote = (updates: Partial<Note>) => {
        if (!activeNote) return;
        setNotes(prev => prev.map(n => 
            n.id === activeNote.id 
                ? { ...n, ...updates, updatedAt: Date.now() } 
                : n
        ));
    };

    const handleUpdateNoteById = (id: string, updates: Partial<Note>) => {
        setNotes(prev => prev.map(n => 
            n.id === id 
                ? { ...n, ...updates, updatedAt: Date.now() } 
                : n
        ));
    };
    
    const handleCreateCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        
        const newCat: NoteCategory = {
            id: "cat-" + Date.now().toString(),
            name: newCategoryName.trim(),
            color: PRESET_COLORS[categories.length % PRESET_COLORS.length],
        };
        
        setCategories(prev => [...prev, newCat]);
        setNewCategoryName("");
        if (activeNote) {
            handleUpdateNote({ categoryId: newCat.id });
            setIsCategoryMenuOpen(false);
        }
    };

    const handleDownload = () => {
        if (!activeNote) return;
        const blob = new Blob([activeNote.content], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeNote.title || "note"}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Render parsed markdown safely
    const parsedHtml = useMemo(() => {
        if (!activeNote || !isPreview) return { __html: "" };
        try {
            return { __html: marked.parse(activeNote.content || "*Empty note*") as string };
        } catch {
            return { __html: "<p>Error parsing markdown</p>" };
        }
    }, [activeNote, isPreview]);

    // Task handlers
    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskContent.trim()) return;
        
        const newTask: NotebookTask = {
            id: Date.now().toString(),
            content: newTaskContent.trim(),
            isImportant: false,
            isCompleted: false,
            createdAt: Date.now(),
        };
        
        setTasks(prev => [newTask, ...prev]);
        setNewTaskContent("");
    };

    const toggleTaskImportance = (id: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, isImportant: !t.isImportant } : t));
    };

    const toggleTaskCompletion = (id: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
    };

    const deleteTask = (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    return (
        <div className="flex h-[800px] max-h-[80vh] w-full rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/20">
                <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex gap-2">
                    <button 
                        onClick={() => setActiveTab("notes")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium transition-colors text-sm ${activeTab === "notes" ? "bg-indigo-600 text-white shadow-sm" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"}`}
                    >
                        <FileText className="w-4 h-4" />
                        Notes
                    </button>
                    <button 
                        onClick={() => setActiveTab("tasks")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium transition-colors text-sm ${activeTab === "tasks" ? "bg-indigo-600 text-white shadow-sm" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"}`}
                    >
                        <ListTodo className="w-4 h-4" />
                        Tasks
                    </button>
                </div>
                
                {activeTab === "notes" ? (
                    <>
                        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
                            <button 
                                onClick={handleCreateNote}
                                className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 py-1.5 px-4 rounded-lg font-medium transition-colors text-sm shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                New Note
                            </button>
                        </div>
                        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search notes..." 
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-zinc-900 dark:text-zinc-100"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-4">
                            {filteredNotes.length === 0 ? (
                                <div className="text-center p-4 text-sm text-zinc-500 dark:text-zinc-400">
                                    No notes found.
                                </div>
                            ) : (
                                Array.from(groupedNotes.entries()).map(([catId, groupNotes]) => {
                                    if (groupNotes.length === 0) return null;
                                    const cat = catId ? categories.find(c => c.id === catId) : null;
                                    
                                    return (
                                        <div 
                                            key={catId || "uncategorized"} 
                                            className={`space-y-1 p-1 -mx-1 rounded-xl transition-colors ${dragOverCatId === (catId || 'uncategorized') ? 'bg-zinc-200/50 dark:bg-zinc-800/50 border border-indigo-500/30 border-dashed' : 'border border-transparent'}`}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                setDragOverCatId(catId || "uncategorized");
                                            }}
                                            onDragLeave={(e) => {
                                                e.preventDefault();
                                                if (dragOverCatId === (catId || "uncategorized")) {
                                                    setDragOverCatId(null);
                                                }
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                setDragOverCatId(null);
                                                const noteId = e.dataTransfer.getData("text/plain");
                                                if (noteId) {
                                                    handleUpdateNoteById(noteId, { categoryId: catId || undefined });
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-2 px-3 mb-1.5 pt-1">
                                                {cat ? (
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                                ) : (
                                                    <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                                )}
                                                <h4 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                                    {cat ? cat.name : "Uncategorized"}
                                                </h4>
                                            </div>
                                            {groupNotes.sort((a, b) => b.updatedAt - a.updatedAt).map(note => (
                                                <button
                                                    key={note.id}
                                                    draggable
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData("text/plain", note.id);
                                                        e.dataTransfer.effectAllowed = "move";
                                                    }}
                                                    onClick={() => setActiveNoteId(note.id)}
                                                    className={`w-full text-left p-2.5 rounded-lg transition-colors group relative ${activeNoteId === note.id ? 'bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 shadow-sm' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50 border border-transparent'}`}
                                                >
                                                    <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate pr-6">
                                                        {note.title || "Untitled Note"}
                                                    </div>
                                                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(note.updatedAt)}
                                                    </div>
                                                    <div 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteNote(note.id);
                                                        }}
                                                        className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors ${activeNoteId === note.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 p-4 flex flex-col justify-center items-center text-center text-zinc-500 dark:text-zinc-400 gap-4">
                        <ListTodo className="w-12 h-12 opacity-20" />
                        <p className="text-sm px-4">Manage your tasks in the main panel.</p>
                    </div>
                )}
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950 relative">
                {activeTab === "tasks" ? (
                    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950/50">
                        <div className="border-b border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900">
                            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Action Items</h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Manage your tasks. Star important ones to see them globally in the header!</p>
                            <form onSubmit={handleCreateTask} className="relative flex items-center">
                                <input 
                                    type="text" 
                                    placeholder="Add a new task (1-3 lines)..." 
                                    value={newTaskContent}
                                    onChange={(e) => setNewTaskContent(e.target.value)}
                                    className="w-full pl-4 pr-12 py-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-zinc-400"
                                />
                                <button 
                                    type="submit"
                                    disabled={!newTaskContent.trim()}
                                    className="absolute right-2 p-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-3">
                            {tasks.length === 0 ? (
                                <div className="text-center py-12 text-zinc-400">
                                    No tasks yet. Create one above!
                                </div>
                            ) : (
                                tasks.sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted) || b.createdAt - a.createdAt).map(task => (
                                    <div key={task.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${task.isCompleted ? 'bg-zinc-50 dark:bg-zinc-900/40 border-transparent opacity-60' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm'}`}>
                                        <button 
                                            onClick={() => toggleTaskCompletion(task.id)}
                                            className={`mt-0.5 shrink-0 transition-colors ${task.isCompleted ? 'text-emerald-500' : 'text-zinc-300 dark:text-zinc-600 hover:text-emerald-500'}`}
                                        >
                                            {task.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                        </button>
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <p className={`text-sm leading-relaxed ${task.isCompleted ? 'text-zinc-500 line-through' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                                {task.content}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button 
                                                onClick={() => toggleTaskImportance(task.id)}
                                                className={`p-2 rounded-lg transition-colors ${task.isImportant ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                                                title={task.isImportant ? "Remove Important" : "Mark as Important"}
                                            >
                                                <Star className={`w-4 h-4 ${task.isImportant ? 'fill-current' : ''}`} />
                                            </button>
                                            <button 
                                                onClick={() => deleteTask(task.id)}
                                                className="p-2 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : activeNote ? (
                    <>
                        <div className="border-b border-zinc-200 dark:border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1 flex items-center gap-3">
                                <div className="relative" ref={categoryMenuRef}>
                                    <button 
                                        onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        {activeNote.categoryId ? (
                                            <>
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: categories.find(c => c.id === activeNote.categoryId)?.color }} />
                                                {categories.find(c => c.id === activeNote.categoryId)?.name || "Category"}
                                            </>
                                        ) : (
                                            <>
                                                <Tag className="w-3.5 h-3.5" />
                                                Category
                                            </>
                                        )}
                                        <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                                    </button>
                                    
                                    {isCategoryMenuOpen && (
                                        <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50">
                                            <div className="max-h-48 overflow-y-auto p-1">
                                                <button 
                                                    onClick={() => { handleUpdateNote({ categoryId: undefined }); setIsCategoryMenuOpen(false); }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                                >
                                                    <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                                    None (Uncategorized)
                                                </button>
                                                {categories.map(cat => (
                                                    <button 
                                                        key={cat.id}
                                                        onClick={() => { handleUpdateNote({ categoryId: cat.id }); setIsCategoryMenuOpen(false); }}
                                                        className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                                            {cat.name}
                                                        </div>
                                                        {activeNote.categoryId === cat.id && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                                                <form onSubmit={handleCreateCategory} className="flex items-center gap-2">
                                                    <input 
                                                        type="text" 
                                                        placeholder="New category..." 
                                                        value={newCategoryName}
                                                        onChange={e => setNewCategoryName(e.target.value)}
                                                        className="flex-1 px-2 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                    />
                                                    <button 
                                                        type="submit" 
                                                        disabled={!newCategoryName.trim()}
                                                        className="p-1.5 bg-indigo-600 text-white rounded-md disabled:opacity-50"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </form>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={activeNote.title}
                                    onChange={e => handleUpdateNote({ title: e.target.value })}
                                    placeholder="Note Title"
                                    className="flex-1 text-xl font-semibold bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 px-1"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                                    <button
                                        onClick={() => setIsPreview(false)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!isPreview ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setIsPreview(true)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${isPreview ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        Preview
                                    </button>
                                </div>
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-colors border border-zinc-200 dark:border-zinc-800"
                                    title="Export as Markdown"
                                >
                                    <FileOutput className="w-3.5 h-3.5" />
                                    Export
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-hidden relative">
                            {isPreview ? (
                                <div 
                                    className="prose prose-sm sm:prose-base dark:prose-invert max-w-none p-6 h-full overflow-y-auto"
                                    dangerouslySetInnerHTML={parsedHtml}
                                />
                            ) : (
                                <textarea
                                    value={activeNote.content}
                                    onChange={e => handleUpdateNote({ content: e.target.value })}
                                    placeholder="Start writing using Markdown..."
                                    className="w-full h-full p-6 bg-transparent border-none outline-none resize-none text-zinc-800 dark:text-zinc-200 font-mono text-sm sm:text-base leading-relaxed placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                />
                            )}
                        </div>
                        
                        <div className="border-t border-zinc-200 dark:border-zinc-800 p-2 px-4 flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/20">
                            <div className="flex items-center gap-2">
                                <Save className="w-3.5 h-3.5" />
                                Saved locally
                            </div>
                            <div>
                                {activeNote.content.length} chars • {activeNote.content.trim() ? activeNote.content.trim().split(/\s+/).length : 0} words
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 gap-4">
                        <FileCode2 className="w-16 h-16 opacity-20" />
                        <p>Select a note or create a new one to start writing.</p>
                        <button 
                            onClick={handleCreateNote}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Create Note
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

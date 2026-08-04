"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Plus, Trash2, Edit2, FileText, Search, Clock, Save, FileOutput, FileCode2, ListTodo, Star, Circle, CheckCircle2, Tag, ChevronDown, Bold, Italic, Strikethrough, Code, List, ListOrdered, Link2, Highlighter, TextQuote, SplitSquareHorizontal, Table2, ArrowLeftToLine, ArrowRightToLine, ArrowUpToLine, ArrowDownToLine, Delete, SquareCode, PanelTop, PanelLeft } from "lucide-react";
import { useLocalStorage } from "@/lib/use-local-storage";

// Tiptap imports
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';

const lowlight = createLowlight(common);

interface NoteCategory {
    id: string;
    name: string;
    color: string;
}


const CustomTaskItem = TaskItem.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            taskId: {
                default: null,
                parseHTML: element => element.getAttribute('data-task-id'),
                renderHTML: attributes => {
                    if (!attributes.taskId) return {};
                    return { 'data-task-id': attributes.taskId };
                },
            },
        };
    },
});

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
    noteId?: string;
    content: string;
    isImportant: boolean;
    isCompleted: boolean;
    createdAt: number;
}


const HIGHLIGHT_COLORS = [
    { name: 'Yellow', color: '#fef08a' },
    { name: 'Green', color: '#bbf7d0' },
    { name: 'Blue', color: '#bfdbfe' },
    { name: 'Pink', color: '#fbcfe8' },
    { name: 'Purple', color: '#e9d5ff' },
];

const ToolbarGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="flex flex-col items-center justify-center border-r border-zinc-200 dark:border-zinc-800 pr-1.5 mr-1 last:border-0 last:pr-0 last:mr-0 self-stretch">
        <div className="flex items-center gap-0.5">
            {children}
        </div>
        <span className="text-[7.5px] leading-none font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em] mt-1">{title}</span>
    </div>
);

const ToolbarButton = ({ onClick, isActive, icon: Icon, title, className = "" }: any) => (
    <div className="relative group flex items-center justify-center">
        <button 
            onClick={onClick} 
            className={`p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 ${isActive ? 'bg-zinc-200 dark:bg-zinc-800 text-indigo-500' : 'text-zinc-600 dark:text-zinc-400'} ${className}`} 
        >
            <Icon className="w-4 h-4" />
        </button>
        <div className="absolute top-full mt-1 hidden group-hover:block whitespace-nowrap bg-zinc-800 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-[10px] py-1 px-2 rounded shadow-lg z-50 pointer-events-none">
            {title}
        </div>
    </div>
);

const MenuBar = ({ editor }: { editor: Editor | null }) => {
    const [, forceUpdate] = useState({});
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [showHighlightMenu, setShowHighlightMenu] = useState(false);

    useEffect(() => {
        if (!editor) return;
        const update = () => forceUpdate({});
        editor.on('transaction', update);
        editor.on('selectionUpdate', update);
        return () => {
            editor.off('transaction', update);
            editor.off('selectionUpdate', update);
        };
    }, [editor]);

    if (!editor) return null;

    let tableDepth = 0;
    const { $from } = editor.state.selection;
    for (let i = $from.depth; i > 0; i--) {
        if ($from.node(i).type.name === 'table') {
            tableDepth++;
        }
    }

    const toggleLink = useCallback(() => {
        if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run();
            return;
        }
        const previousUrl = editor.getAttributes('link').href;
        setLinkUrl(previousUrl || '');
        setLinkText('');
        setShowLinkModal(true);
    }, [editor]);

    const applyLink = () => {
        if (!linkUrl) {
            setShowLinkModal(false);
            return;
        }
        
        let formattedUrl = linkUrl;
        if (!/^https?:\/\//i.test(linkUrl) && !/^mailto:/i.test(linkUrl)) {
            formattedUrl = 'https://' + linkUrl;
        }
        
        if (editor.state.selection.empty && linkText) {
            editor.chain().focus().insertContent(`<a href="${formattedUrl}">${linkText}</a>`).run();
        } else {
            editor.chain().focus().setLink({ href: formattedUrl }).run();
        }
        setShowLinkModal(false);
    };

    const addTable = useCallback(() => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }, [editor]);



    return (
        <div className="relative flex flex-wrap items-center gap-1 p-1 px-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            {showLinkModal && (
                <div className="absolute z-50 top-full left-[200px] mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl p-3 flex flex-col gap-2 w-64">
                    {editor.state.selection.empty && (
                        <input 
                            type="text" 
                            placeholder="Link text..." 
                            value={linkText} 
                            onChange={(e) => setLinkText(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1.5 text-xs outline-none focus:border-indigo-500"
                        />
                    )}
                    <input 
                        type="url" 
                        placeholder="https://example.com" 
                        value={linkUrl} 
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') applyLink() }}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1.5 text-xs outline-none focus:border-indigo-500"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-1">
                        <button onClick={() => setShowLinkModal(false)} className="px-2 py-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">Cancel</button>
                        <button onClick={applyLink} className="px-3 py-1 text-[11px] bg-indigo-500 hover:bg-indigo-600 text-white rounded font-medium shadow-sm transition-colors">Apply</button>
                    </div>
                </div>
            )}
            <ToolbarGroup title="Text">
                <select
                    className="bg-transparent border border-zinc-200 dark:border-zinc-700 rounded px-1 py-0.5 text-[11px] dark:text-zinc-200 outline-none" 
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'p') editor.chain().focus().setParagraph().run();
                        else editor.chain().focus().toggleHeading({ level: parseInt(val) as any }).run();
                    }}
                    value={editor.isActive('heading', { level: 1 }) ? '1' : editor.isActive('heading', { level: 2 }) ? '2' : editor.isActive('heading', { level: 3 }) ? '3' : 'p'}
                >
                    <option value="p">Paragraph</option>
                    <option value="1">Heading 1</option>
                    <option value="2">Heading 2</option>
                    <option value="3">Heading 3</option>
                </select>
                <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={Bold} title="Bold" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={Italic} title="Italic" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} icon={Strikethrough} title="Strikethrough" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} icon={SquareCode} title="Code Block" />
                <div className="relative flex items-center justify-center">
                    <ToolbarButton onClick={() => setShowHighlightMenu(!showHighlightMenu)} isActive={editor.isActive('highlight')} icon={Highlighter} title="Highlight" />
                    {showHighlightMenu && (
                        <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl p-1.5 flex gap-1">
                            {HIGHLIGHT_COLORS.map(c => (
                                <button
                                    key={c.color}
                                    onClick={() => { editor.chain().focus().toggleHighlight({ color: c.color }).run(); setShowHighlightMenu(false); }}
                                    className="w-5 h-5 rounded-full border border-zinc-200 dark:border-zinc-700 hover:scale-110 transition-transform"
                                    style={{ backgroundColor: c.color }}
                                    title={c.name}
                                />
                            ))}
                            <button
                                onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlightMenu(false); }}
                                className="w-5 h-5 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-[10px]"
                                title="Remove Highlight"
                            >✕</button>
                        </div>
                    )}
                </div>
            </ToolbarGroup>
            
            <ToolbarGroup title="Lists">
                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={List} title="Bullet List" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={ListOrdered} title="Ordered List" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} icon={ListTodo} title="Task List" />
            </ToolbarGroup>
            
            <ToolbarGroup title="Insert">
                <ToolbarButton onClick={toggleLink} isActive={editor.isActive('link')} icon={Link2} title="Link" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={TextQuote} title="Blockquote" />
                <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} isActive={false} icon={SplitSquareHorizontal} title="Divider" />
                <ToolbarButton onClick={() => { if(tableDepth < 2) addTable(); }} isActive={editor.isActive("table")} icon={Table2} title={tableDepth >= 2 ? "Max Table Depth Reached" : "Insert Table"} className={tableDepth >= 2 ? "opacity-50 cursor-not-allowed" : ""} />
            </ToolbarGroup>
            
            {editor.isActive('table') && (
                <ToolbarGroup title="Table Config">
                    <ToolbarButton onClick={() => editor.chain().focus().toggleHeaderRow().run()} isActive={editor.isActive('tableHeader')} icon={PanelTop} title="Toggle Header Row" />
                    <ToolbarButton onClick={() => editor.chain().focus().toggleHeaderColumn().run()} isActive={editor.isActive('tableHeader')} icon={PanelLeft} title="Toggle Header Column" />
                    <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
                    <ToolbarButton onClick={() => editor.chain().focus().addColumnBefore().run()} icon={ArrowLeftToLine} title="Add Column Before" />
                    <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} icon={ArrowRightToLine} title="Add Column After" />
                    <ToolbarButton onClick={() => editor.chain().focus().deleteColumn().run()} icon={Delete} title="Delete Column" className="text-red-500 hover:text-red-600 dark:hover:text-red-400" />
                    
                    <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
                    <ToolbarButton onClick={() => editor.chain().focus().addRowBefore().run()} icon={ArrowUpToLine} title="Add Row Before" />
                    <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} icon={ArrowDownToLine} title="Add Row After" />
                    <ToolbarButton onClick={() => editor.chain().focus().deleteRow().run()} icon={Delete} title="Delete Row" className="text-red-500 hover:text-red-600 dark:hover:text-red-400" />
                    
                    <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
                    <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} icon={Trash2} title="Delete Table" className="text-red-500 hover:text-red-600 dark:hover:text-red-400" />
                </ToolbarGroup>
            )}
        </div>
    );
};

export default function Notebook() {
    const [showBubbleHighlight, setShowBubbleHighlight] = useState(false);
    const [showTaskSidebar, setShowTaskSidebar] = useState(false);
    const [noteTaskContent, setNoteTaskContent] = useState("");

    const [notes, setNotes] = useLocalStorage<Note[]>("notebook:notes", []);
    const [categories, setCategories] = useLocalStorage<NoteCategory[]>("notebook:categories", DEFAULT_CATEGORIES);
    const [activeNoteId, setActiveNoteId] = useLocalStorage<string | null>("notebook:active_note", null);
    
    const [tasks, setTasks] = useLocalStorage<NotebookTask[]>("notebook:tasks", []);
    const [activeTab, setActiveTab] = useLocalStorage<"notes" | "tasks">("notebook:active_tab", "notes");

    const [newTaskContent, setNewTaskContent] = useState("");
    
    const activeNoteIdRef = useRef(activeNoteId);
    activeNoteIdRef.current = activeNoteId;
    
    const tasksRef = useRef(tasks);
    tasksRef.current = tasks;
    const [deletingTasks, setDeletingTasks] = useState<Record<string, number>>({});
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

    useEffect(() => {
        const emptyTasks = tasks.filter(t => t.noteId === activeNoteId && t.content.trim() === "");
        if (emptyTasks.length === 0) {
            if (Object.keys(deletingTasks).length > 0) setDeletingTasks({});
            return;
        }
        
        const timer = setInterval(() => {
            setDeletingTasks(prev => {
                const next = { ...prev };
                emptyTasks.forEach(t => {
                    if (next[t.id] === undefined) next[t.id] = 8;
                    else next[t.id] -= 1;
                });
                return next;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [tasks, activeNoteId]);

    useEffect(() => {
        const toDelete = Object.keys(deletingTasks).filter(id => deletingTasks[id] <= 0);
        if (toDelete.length > 0) {
            setTasks(prev => prev.filter(t => !toDelete.includes(t.id)));
            setDeletingTasks(prev => {
                const next = { ...prev };
                toDelete.forEach(id => delete next[id]);
                return next;
            });
        }
    }, [deletingTasks]);
    
    const [searchQuery, setSearchQuery] = useState("");
    
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
    };

    const handleDeleteNote = (id: string) => {
        setNoteToDelete(id);
    };

    const confirmDeleteNote = () => {
        if (!noteToDelete) return;
        setNotes(prev => prev.filter(n => n.id !== noteToDelete));
        if (activeNoteId === noteToDelete) {
            setActiveNoteId(null);
        }
        setNoteToDelete(null);
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

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: 'Write something amazing...' }),
            TaskList,
            CustomTaskItem.configure({ nested: true }),
            CodeBlockLowlight.configure({ lowlight }),
            Highlight.configure({ multicolor: true }),
            Color,
            TextStyle,
            Link.configure({ openOnClick: true, autolink: true, defaultProtocol: "https" }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        editorProps: {
            attributes: {
                class: 'min-h-[calc(100vh-200px)] outline-none',
            },
        },
        content: activeNote ? activeNote.content : '',
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            if (activeNote) handleUpdateNote({ content: html });
            
            // Sync tasks & deduplicate taskIds
            const tasksToUpdate: {id: string, content: string, isCompleted: boolean}[] = [];
            const seenTaskIds = new Set<string>();
            const duplicateUpdates: { pos: number, attrs: any }[] = [];
            
            editor.state.doc.descendants((node, pos) => {
                if (node.type.name === 'taskItem' && node.attrs.taskId) {
                    if (seenTaskIds.has(node.attrs.taskId)) {
                        duplicateUpdates.push({ pos, attrs: node.attrs });
                    } else {
                        seenTaskIds.add(node.attrs.taskId);
                        tasksToUpdate.push({
                            id: node.attrs.taskId,
                            content: node.textContent.trim(),
                            isCompleted: node.attrs.checked
                        });
                    }
                }
            });
            
            if (duplicateUpdates.length > 0) {
                setTimeout(() => {
                    let tr = editor.state.tr;
                    duplicateUpdates.forEach(update => {
                        tr = tr.setNodeMarkup(update.pos, undefined, { ...update.attrs, taskId: null });
                    });
                    editor.view.dispatch(tr);
                }, 0);
            }
            
            if (tasksToUpdate.length > 0) {
                setTasks(prev => {
                    let hasChanges = false;
                    const newTasks = prev.map(t => {
                        const update = tasksToUpdate.find(u => u.id === t.id);
                        if (update && (t.content !== update.content || t.isCompleted !== update.isCompleted)) {
                            hasChanges = true;
                            return { ...t, content: update.content, isCompleted: update.isCompleted };
                        }
                        return t;
                    });
                    return hasChanges ? newTasks : prev;
                });
            }
        },
    });

    useEffect(() => {
        if (editor && activeNote && editor.getHTML() !== activeNote.content) {
            editor.commands.setContent(activeNote.content);
        }
    }, [activeNoteId]);
    
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

    const handleUpdateTaskContent = (id: string, newContent: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, content: newContent } : t));
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


    const convertSelectionToTasks = () => {
        const currentActiveNoteId = activeNoteIdRef.current;
        if (!editor || !currentActiveNoteId) return;
        
        const { from, to } = editor.state.selection;
        if (from === to) return;
        
        const currentTasks = tasksRef.current;
        const newTasksToCreate: NotebookTask[] = [];
        let foundTaskItems = false;
        const updates: {pos: number, attrs: any, id: string}[] = [];
        
        editor.state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.type.name === 'taskItem') {
                foundTaskItems = true;
                const text = node.textContent.trim();
                const isChecked = node.attrs.checked;
                const existingTaskId = node.attrs.taskId;
                
                const stillExists = existingTaskId && currentTasks.some(t => t.id === existingTaskId);
                
                if (text && !stillExists) {
                    const newId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 5);
                    newTasksToCreate.push({
                        id: newId,
                        content: text,
                        isImportant: false,
                        isCompleted: isChecked,
                        createdAt: Date.now(),
                        noteId: currentActiveNoteId
                    });
                    updates.push({ pos, attrs: node.attrs, id: newId });
                }
            }
        });
        
        if (!foundTaskItems) {
            const text = editor.state.doc.textBetween(from, to, '\n');
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            
            lines.forEach(line => {
                newTasksToCreate.push({
                    id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 5),
                    content: line,
                    isImportant: false,
                    isCompleted: false,
                    createdAt: Date.now(),
                    noteId: currentActiveNoteId
                });
            });
        }
        
        if (newTasksToCreate.length > 0) {
            setTasks(prev => [...newTasksToCreate, ...prev]);
            setShowTaskSidebar(true);
        }
        
        if (updates.length > 0) {
            let tr = editor.state.tr;
            updates.forEach(update => {
                tr = tr.setNodeMarkup(update.pos, undefined, { ...update.attrs, taskId: update.id });
            });
            editor.view.dispatch(tr);
        }
        
        editor.chain().focus().run();
    };

    const handleAddNoteTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!noteTaskContent.trim() || !activeNoteId) return;
        const newTask: NotebookTask = {
            id: Date.now().toString(),
            content: noteTaskContent.trim(),
            isImportant: false,
            isCompleted: false,
            createdAt: Date.now(),
            noteId: activeNoteId
        };
        setTasks(prev => [newTask, ...prev]);
        setNoteTaskContent("");
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
                                            <input 
                                                type="text" 
                                                value={task.content} 
                                                onChange={(e) => handleUpdateTaskContent(task.id, e.target.value)}
                                                className={`w-full bg-transparent border-none outline-none text-sm leading-relaxed ${task.isCompleted ? 'text-zinc-500 line-through' : 'text-zinc-800 dark:text-zinc-200'} placeholder:text-zinc-400`}
                                                placeholder="Task content..."
                                            />
                                            {deletingTasks[task.id] !== undefined && (
                                                <p className="text-red-500 text-[10px] font-medium mt-1">
                                                    Deleting task in {deletingTasks[task.id]}s...
                                                </p>
                                            )}
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
                                <button
                                    onClick={() => setShowTaskSidebar(!showTaskSidebar)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${showTaskSidebar ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/30' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}
                                    title="Toggle Tasks Sidebar"
                                >
                                    <ListTodo className="w-3.5 h-3.5" />
                                    Tasks
                                </button>
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
                        
                        <div className="flex flex-1 overflow-hidden relative border-t border-zinc-200 dark:border-zinc-800">
                            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                            <MenuBar editor={editor} />
                            
                            {editor && <BubbleMenu editor={editor}>
                                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 shadow-xl rounded p-1">
                                    <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1 rounded text-zinc-300 hover:text-white hover:bg-zinc-800 ${editor.isActive('bold') ? 'bg-zinc-800 text-indigo-400' : ''}`}><Bold className="w-4 h-4" /></button>
                                    <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1 rounded text-zinc-300 hover:text-white hover:bg-zinc-800 ${editor.isActive('italic') ? 'bg-zinc-800 text-indigo-400' : ''}`}><Italic className="w-4 h-4" /></button>
                                    <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-1 rounded text-zinc-300 hover:text-white hover:bg-zinc-800 ${editor.isActive('strike') ? 'bg-zinc-800 text-indigo-400' : ''}`}><Strikethrough className="w-4 h-4" /></button>
                                    <div className="w-px h-4 bg-zinc-700 mx-1" />
                                    <div className="w-px h-4 bg-zinc-700 mx-1" />
                                    <button onMouseDown={(e) => e.preventDefault()} onClick={convertSelectionToTasks} className="p-1 rounded text-zinc-300 hover:text-white hover:bg-zinc-800" title="Extract as Tasks"><ListTodo className="w-4 h-4" /></button>
                                    <div className="relative flex items-center">
                                        <button onClick={() => setShowBubbleHighlight(!showBubbleHighlight)} className={`p-1 rounded text-zinc-300 hover:text-white hover:bg-zinc-800 ${editor.isActive('highlight') ? 'bg-zinc-800 text-yellow-400' : ''}`}><Highlighter className="w-4 h-4" /></button>
                                        {showBubbleHighlight && (
                                            <div className="absolute bottom-full left-0 mb-1 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-1.5 flex gap-1">
                                                {HIGHLIGHT_COLORS.map(c => (
                                                    <button
                                                        key={c.color}
                                                        onClick={() => { editor.chain().focus().toggleHighlight({ color: c.color }).run(); setShowBubbleHighlight(false); }}
                                                        className="w-5 h-5 rounded-full border border-zinc-700 hover:scale-110 transition-transform"
                                                        style={{ backgroundColor: c.color }}
                                                        title={c.name}
                                                    />
                                                ))}
                                                <button
                                                    onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowBubbleHighlight(false); }}
                                                    className="w-5 h-5 rounded-full border border-zinc-700 flex items-center justify-center hover:bg-zinc-800 text-zinc-300 transition-colors text-[10px]"
                                                    title="Remove Highlight"
                                                >✕</button>
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => {
                                        if (editor.isActive('link')) {
                                            editor.chain().focus().unsetLink().run();
                                            return;
                                        }
                                        const url = window.prompt('Enter URL:');
                                        if (url) {
                                            let formattedUrl = url;
                                            if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) formattedUrl = 'https://' + url;
                                            editor.chain().focus().setLink({ href: formattedUrl }).run();
                                        }
                                    }} className={`p-1 rounded text-zinc-300 hover:text-white hover:bg-zinc-800 ${editor.isActive('link') ? 'bg-zinc-800 text-indigo-400' : ''}`}><Link2 className="w-4 h-4" /></button>
                                </div>
                            </BubbleMenu>}
                            
                            <div 
                                className="flex-1 overflow-y-auto bg-white dark:bg-transparent cursor-text"
                                onClick={() => {
                                    if (editor && !editor.isFocused) {
                                        editor.chain().focus().run();
                                    }
                                }}
                            >
                                <EditorContent editor={editor} className="prose prose-sm dark:prose-invert max-w-none p-6 min-h-full" />
                            </div>
                        </div>
                            {showTaskSidebar && (
                                <div className="w-72 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col">
                                    <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                            <ListTodo className="w-4 h-4 text-indigo-500" />
                                            Note Tasks
                                        </h3>
                                        <button onClick={() => setShowTaskSidebar(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                                            ✕
                                        </button>
                                    </div>
                                    <form onSubmit={handleAddNoteTask} className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                        <input
                                            type="text"
                                            value={noteTaskContent}
                                            onChange={e => setNoteTaskContent(e.target.value)}
                                            placeholder="Add a task..."
                                            className="w-full text-xs px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded outline-none focus:border-indigo-500"
                                        />
                                    </form>
                                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                        {tasks.filter(t => t.noteId === activeNoteId).length === 0 ? (
                                            <div className="text-center text-xs text-zinc-500 mt-4">No tasks for this note yet.</div>
                                        ) : (
                                            tasks.filter(t => t.noteId === activeNoteId)
                                                 .sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted) || b.createdAt - a.createdAt)
                                                 .map(task => (
                                                <div key={task.id} className="group flex items-start gap-2 bg-white dark:bg-zinc-800 p-2 rounded border border-zinc-200 dark:border-zinc-700">
                                                    <button onClick={() => toggleTaskCompletion(task.id)} className={`mt-0.5 shrink-0 ${task.isCompleted ? "text-indigo-500" : "text-zinc-400 dark:text-zinc-500 hover:text-indigo-400"}`}>
                                                        {task.isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <div className="flex flex-col flex-1">
                                                        <input type="text" value={task.content} onChange={(e) => handleUpdateTaskContent(task.id, e.target.value)} className={`text-xs bg-transparent border-none outline-none ${task.isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-300'}`} />
                                                        {deletingTasks[task.id] !== undefined && <span className="text-[10px] text-red-500 font-medium">Deleting task in {deletingTasks[task.id]}s...</span>}
                                                    </div>
                                                    <button onClick={() => toggleTaskImportance(task.id)} className={`hover:text-amber-500 ${task.isImportant ? 'text-amber-500 opacity-100' : 'text-zinc-400 opacity-0 group-hover:opacity-100'}`}><Star className={`w-3.5 h-3.5 ${task.isImportant ? 'fill-current' : ''}`} /></button>
                                                    <button onClick={() => deleteTask(task.id)} className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="border-t border-zinc-200 dark:border-zinc-800 p-2 px-4 flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/20">
                            <div className="flex items-center gap-2">
                                <Save className="w-3.5 h-3.5" />
                                Saved locally
                            </div>
                            <div>
                                {editor ? editor.getText().length : 0} chars • {editor && editor.getText().trim() ? editor.getText().trim().split(/\s+/).length : 0} words
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
            
            {/* Custom Delete Confirmation Modal */}
            {noteToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4 text-red-500">
                            <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-full">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Delete Note?</h3>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                            Are you sure you want to delete this note? This action cannot be undone and all associated tasks will lose their context.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setNoteToDelete(null)}
                                className="px-4 py-2 text-sm font-medium rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteNote}
                                className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-red-500 hover:bg-red-600 shadow-sm transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

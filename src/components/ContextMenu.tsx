"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
    Home, Search, Moon, Sun, Github, Bug, MonitorDot, 
    Copy, Scissors, ClipboardPaste, SmilePlus, Image as ImageIcon,
    ArrowLeft, ArrowRight, RotateCw
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useToast } from "@/components/Toast";
import { useTabContext } from "@/lib/tab-context";
import EmojiPicker, { Theme as EmojiTheme, EmojiClickData } from "emoji-picker-react";

interface MenuContext {
    x: number;
    y: number;
    isVisible: boolean;
    hasSelection: boolean;
    isInput: boolean;
    isImage: boolean;
    imageUrl?: string;
    showEmojiPicker: boolean;
}

export default function ContextMenu() {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { showToast } = useToast();
    const { goHome } = useTabContext();
    const menuRef = useRef<HTMLDivElement>(null);

    const [context, setContext] = useState<MenuContext>({
        x: 0,
        y: 0,
        isVisible: false,
        hasSelection: false,
        isInput: false,
        isImage: false,
        showEmojiPicker: false,
    });

    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            // Escape hatch: Shift + Right Click opens native menu
            if (e.shiftKey) {
                return;
            }

            e.preventDefault();

            // Determine context
            const target = e.target as HTMLElement;
            const selection = window.getSelection()?.toString();
            
            const isInput = 
                target.tagName === 'INPUT' || 
                target.tagName === 'TEXTAREA' || 
                target.isContentEditable;
            
            const isImage = target.tagName === 'IMG';
            const imageUrl = isImage ? (target as HTMLImageElement).src : undefined;

            // Ensure the menu stays within screen bounds
            let x = e.clientX;
            let y = e.clientY;
            
            // Adjust bounds (approximate menu width/height)
            const menuWidth = 250;
            const menuHeight = 350;
            
            if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
            if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;

            setContext({
                x,
                y,
                isVisible: true,
                hasSelection: !!selection,
                isInput: !!isInput,
                isImage: !!isImage,
                showEmojiPicker: false,
                imageUrl
            });
        };

        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setContext(prev => ({ ...prev, isVisible: false }));
            }
        };

        window.addEventListener("contextmenu", handleContextMenu);
        window.addEventListener("click", handleClick);

        return () => {
            window.removeEventListener("contextmenu", handleContextMenu);
            window.removeEventListener("click", handleClick);
        };
    }, []);

    const closeMenu = () => setContext(prev => ({ ...prev, isVisible: false }));

    const handleCopy = async () => {
        const text = window.getSelection()?.toString();
        if (text) {
            await navigator.clipboard.writeText(text);
            showToast("Copied to clipboard", "info");
        }
        closeMenu();
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (document.activeElement) {
                // Not perfectly robust for all inputs without complex focus management,
                // but document.execCommand works well for most editable fields natively
                document.execCommand('insertText', false, text);
            }
        } catch (err) {
            showToast("Clipboard access denied", "error");
        }
        closeMenu();
    };

    const handleCut = async () => {
        document.execCommand('cut');
        showToast("Cut to clipboard", "info");
        closeMenu();
    };

    const handleCopyImage = async () => {
        if (context.imageUrl) {
            try {
                const response = await fetch(context.imageUrl);
                const blob = await response.blob();
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob })
                ]);
                showToast("Image copied to clipboard", "info");
            } catch (err) {
                showToast("Could not copy image directly", "error");
            }
        }
        closeMenu();
    };

    const handleEmoji = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
            e.nativeEvent.stopPropagation();
        }
        setContext(prev => ({ ...prev, showEmojiPicker: true }));
    };

    const onEmojiClick = (emojiData: EmojiClickData) => {
        try {
            if (document.activeElement) {
                document.execCommand('insertText', false, emojiData.emoji);
            }
        } catch (err) {
            showToast("Failed to insert emoji", "error");
        }
        closeMenu();
    };

    const handleInspect = () => {
        showToast("Hold Shift + Right Click to use the native browser inspector, or press F12.", "info");
        closeMenu();
    };

    if (!context.isVisible) return null;

    return (
        <div
            ref={menuRef}
            className={`fixed z-[9999] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-1.5 animate-in zoom-in-95 duration-100 flex flex-col gap-0.5 text-sm ${context.showEmojiPicker ? 'w-auto' : 'w-60'}`}
            style={{ left: context.x, top: context.y }}
        >
            {context.showEmojiPicker ? (
                <div className="p-1">
                    <EmojiPicker
                        theme={theme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                        onEmojiClick={onEmojiClick}
                        autoFocusSearch={false}
                        width={300}
                        height={400}
                    />
                </div>
            ) : (
                <>
                    {/* Contextual Actions */}
            {context.hasSelection && !context.isInput && (
                <>
                    <MenuItem icon={Copy} label="Copy" onClick={handleCopy} shortcut="⌘C" />
                    <MenuDivider />
                </>
            )}

            {context.isInput && (
                <>
                    <MenuItem icon={Scissors} label="Cut" onClick={handleCut} shortcut="⌘X" />
                    <MenuItem icon={Copy} label="Copy" onClick={handleCopy} shortcut="⌘C" />
                    <MenuItem icon={ClipboardPaste} label="Paste" onClick={handlePaste} shortcut="⌘V" />
                    <MenuItem icon={SmilePlus} label="Add Emoji" onClick={handleEmoji} />
                    <MenuDivider />
                </>
            )}

            {context.isImage && (
                <>
                    <MenuItem icon={ImageIcon} label="Copy Image" onClick={handleCopyImage} />
                    <MenuItem icon={Copy} label="Copy Image Address" onClick={() => {
                        if (context.imageUrl) {
                            navigator.clipboard.writeText(context.imageUrl);
                            showToast("Image address copied", "info");
                        }
                        closeMenu();
                    }} />
                    <MenuDivider />
                </>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between px-1 mb-0.5">
                <button onClick={() => { window.history.back(); closeMenu(); }} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 flex-1 flex justify-center transition-colors" title="Go Back"><ArrowLeft className="w-4 h-4" /></button>
                <button onClick={() => { window.history.forward(); closeMenu(); }} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 flex-1 flex justify-center transition-colors" title="Go Forward"><ArrowRight className="w-4 h-4" /></button>
                <button onClick={() => { window.location.reload(); closeMenu(); }} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 flex-1 flex justify-center transition-colors" title="Reload"><RotateCw className="w-4 h-4" /></button>
            </div>
            
            <MenuDivider />

            <MenuItem icon={Home} label="Go to Home" onClick={() => { goHome(); closeMenu(); }} />
            <MenuItem icon={Search} label="Search Tools" onClick={() => { 
                // Dispatch Ctrl+K event directly to window with bubbling
                const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true, bubbles: true });
                window.dispatchEvent(event);
                closeMenu(); 
            }} shortcut="⌘K" />

            <MenuDivider />
            
            <MenuItem 
                icon={theme === 'dark' ? Sun : Moon} 
                label={theme === 'dark' ? "Light Mode" : "Dark Mode"} 
                onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); closeMenu(); }} 
            />
            
            <MenuDivider />

            <MenuItem icon={Github} label="View Source Code" onClick={() => { window.open("https://github.com/cratonik/toolich", "_blank"); closeMenu(); }} />
            <MenuItem icon={Bug} label="Report an Issue" onClick={() => { 
                window.dispatchEvent(new Event('open-toolich-assistant')); 
                closeMenu(); 
            }} />
            <MenuItem icon={MonitorDot} label="Inspect Element" onClick={handleInspect} />
                </>
            )}
        </div>
    );
}

function MenuItem({ icon: Icon, label, onClick, shortcut }: { icon: any, label: string, onClick: (e: React.MouseEvent) => void, shortcut?: string }) {
    return (
        <button 
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopPropagation();
                onClick(e);
            }}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-colors w-full text-left"
        >
            <Icon className="w-4 h-4 opacity-70" />
            <span className="flex-1 font-medium">{label}</span>
            {shortcut && (
                <span className="text-[10px] tracking-widest text-zinc-400 dark:text-zinc-500 font-medium bg-zinc-100 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded">
                    {shortcut}
                </span>
            )}
        </button>
    );
}

function MenuDivider() {
    return <div className="h-px bg-zinc-200 dark:bg-zinc-800/50 my-1 mx-1" />;
}

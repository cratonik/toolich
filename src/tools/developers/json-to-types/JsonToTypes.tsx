"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { Copy, Check, Trash2, Upload, Undo2, Download, Code } from "lucide-react";
import { useSessionState } from "@/lib/use-session-state";
import { useTabContext } from "@/lib/tab-context";

// ── Type Inference AST ───────────────────────────────────────────────────────

type TypeNode =
  | { type: "primitive"; name: "string" | "int" | "float" | "boolean" | "null" | "any" }
  | { type: "array"; elementType: TypeNode }
  | { type: "object"; fields: Record<string, { node: TypeNode; optional: boolean }>; name: string; originalKey: string }
  | { type: "union"; types: TypeNode[] };

interface ObjectDefinition {
    name: string;
    fields: Record<string, { node: TypeNode; optional: boolean }>;
}

const EXAMPLE_JSON = `{
  "id": 104,
  "name": "Chaitanya Shimpi",
  "active": true,
  "roles": ["admin", "developer"],
  "profile": {
    "bio": "Web developer & open-source contributor",
    "avatar_url": "https://avatars.githubusercontent.com/u/12345"
  },
  "addresses": [
    {
      "city": "Mumbai",
      "country": "India",
      "primary": true
    },
    {
      "city": "San Francisco",
      "country": "USA"
    }
  ]
}`;

// ── Relaxed JSON Parser helper ───────────────────────────────────────────────

function normalizeRelaxedJson(input: string): string {
    const len = input.length;
    let i = 0;
    const out: string[] = [];

    const getLastNonWhitespaceIndex = () => {
        let idx = out.length - 1;
        while (idx >= 0 && /[\s\n\r\t]/.test(out[idx])) {
            idx--;
        }
        return idx;
    };

    while (i < len) {
        const c = input[i];

        // Whitespace
        if (/[\s\n\r\t]/.test(c)) {
            out.push(c);
            i++;
            continue;
        }

        // Check for trailing comma when we see } or ]
        if (c === "}" || c === "]") {
            const lastIdx = getLastNonWhitespaceIndex();
            if (lastIdx >= 0 && out[lastIdx] === ",") {
                out[lastIdx] = "";
            }
            out.push(c);
            i++;
            continue;
        }

        // String literals (single or double quoted)
        if (c === '"' || c === "'") {
            const startQuote = c;
            let j = i + 1;
            let escaped = false;
            let strContent = "";

            while (j < len) {
                const sc = input[j];
                if (escaped) {
                    strContent += sc;
                    escaped = false;
                    j++;
                    continue;
                }
                if (sc === "\\") {
                    strContent += sc;
                    escaped = true;
                    j++;
                    continue;
                }
                if (sc === startQuote) {
                    j++;
                    break;
                }
                if (sc === "\n" || sc === "\r") {
                    break;
                }
                strContent += sc;
                j++;
            }

            const normalizedContent = strContent.replace(/"/g, '\\"');
            out.push('"', normalizedContent, '"');
            i = j;
            continue;
        }

        // Template variables or unquoted words / identifiers
        if (c === "{" && input[i + 1] === "{") {
            let j = i + 2;
            let content = "";
            while (j < len) {
                if (input[j] === "}" && input[j + 1] === "}") {
                    j += 2;
                    break;
                }
                content += input[j];
                j++;
            }
            out.push('"', `{{${content.trim()}}}`, '"');
            i = j;
            continue;
        }

        // If it is an identifier (unquoted key or unquoted value)
        if (/[A-Za-z_$]/.test(c)) {
            let j = i;
            let word = "";
            while (j < len && /[A-Za-z0-9_$]/.test(input[j])) {
                word += input[j];
                j++;
            }
            
            if (word === "true" || word === "false" || word === "null") {
                out.push(word);
            } else {
                out.push('"', word, '"');
            }
            i = j;
            continue;
        }

        out.push(c);
        i++;
    }

    return out.join("");
}

// ── Core Type Inference Engine ───────────────────────────────────────────────

function inferType(val: unknown, keySuggestion: string): TypeNode {
    if (val === null) {
        return { type: "primitive", name: "null" };
    }
    if (typeof val === "string") {
        return { type: "primitive", name: "string" };
    }
    if (typeof val === "number") {
        return { type: "primitive", name: Number.isInteger(val) ? "int" : "float" };
    }
    if (typeof val === "boolean") {
        return { type: "primitive", name: "boolean" };
    }
    if (Array.isArray(val)) {
        if (val.length === 0) {
            return { type: "array", elementType: { type: "primitive", name: "any" } };
        }
        const elementNodes = val.map((item) => inferType(item, `${keySuggestion}Item`));
        const mergedElement = mergeTypes(elementNodes);
        return { type: "array", elementType: mergedElement };
    }
    if (typeof val === "object") {
        const obj = val as Record<string, unknown>;
        const fields: Record<string, { node: TypeNode; optional: boolean }> = {};
        for (const [k, v] of Object.entries(obj)) {
            fields[k] = {
                node: inferType(v, k),
                optional: false
            };
        }
        return {
            type: "object",
            fields,
            name: keySuggestion || "SubObject",
            originalKey: keySuggestion || "SubObject"
        };
    }
    return { type: "primitive", name: "any" };
}

function getStructureSignature(node: TypeNode): string {
    if (node.type === "primitive") {
        return `prim:${node.name}`;
    }
    if (node.type === "array") {
        return `arr:[${getStructureSignature(node.elementType)}]`;
    }
    if (node.type === "union") {
        return `union:[${node.types.map(getStructureSignature).sort().join(",")}]`;
    }
    if (node.type === "object") {
        const keys = Object.keys(node.fields).sort();
        const fieldsSig = keys.map(k => {
            const f = node.fields[k];
            return `${k}:${f.optional ? "?" : ""}${getStructureSignature(f.node)}`;
        }).join(";");
        return `obj:{${fieldsSig}}`;
    }
    return "any";
}

function mergeTypes(nodes: TypeNode[]): TypeNode {
    if (nodes.length === 0) {
        return { type: "primitive", name: "any" };
    }
    if (nodes.length === 1) {
        return nodes[0];
    }

    const primitives = nodes.filter(n => n.type === "primitive") as { type: "primitive"; name: any }[];
    const arrays = nodes.filter(n => n.type === "array") as { type: "array"; elementType: TypeNode }[];
    const objects = nodes.filter(n => n.type === "object") as { type: "object"; fields: any; name: string; originalKey: string }[];
    const unions = nodes.filter(n => n.type === "union") as { type: "union"; types: TypeNode[] }[];

    const allNodes: TypeNode[] = [];
    for (const u of unions) {
        allNodes.push(...u.types);
    }
    allNodes.push(...primitives, ...arrays, ...objects);

    const uniqueNodes: TypeNode[] = [];
    const seenSigs = new Set<string>();
    for (const node of allNodes) {
        const sig = getStructureSignature(node);
        if (!seenSigs.has(sig)) {
            seenSigs.add(sig);
            uniqueNodes.push(node);
        }
    }

    if (uniqueNodes.length === 1) {
        return uniqueNodes[0];
    }

    const prims = uniqueNodes.filter(n => n.type === "primitive") as { type: "primitive"; name: any }[];
    const arrs = uniqueNodes.filter(n => n.type === "array") as { type: "array"; elementType: TypeNode }[];
    const objs = uniqueNodes.filter(n => n.type === "object") as { type: "object"; fields: any; name: string; originalKey: string }[];

    const mergedList: TypeNode[] = [];

    if (prims.length > 0) {
        const names = Array.from(new Set(prims.map(p => p.name)));
        if (names.includes("any")) {
            mergedList.push({ type: "primitive", name: "any" });
        } else {
            const hasInt = names.includes("int");
            const hasFloat = names.includes("float");
            let finalNames = names;
            if (hasInt && hasFloat) {
                finalNames = names.filter(n => n !== "int");
            }
            mergedList.push(...finalNames.map(n => ({ type: "primitive" as const, name: n })));
        }
    }

    if (arrs.length > 0) {
        const elementTypes = arrs.map(a => a.elementType);
        mergedList.push({ type: "array", elementType: mergeTypes(elementTypes) });
    }

    if (objs.length > 0) {
        const allKeys = Array.from(new Set(objs.flatMap(obj => Object.keys(obj.fields))));
        const mergedFields: Record<string, { node: TypeNode; optional: boolean }> = {};
        
        for (const key of allKeys) {
            const presentIn = objs.filter(obj => key in obj.fields);
            const isOptional = presentIn.length < objs.length;
            const fieldNodes = presentIn.map(obj => obj.fields[key].node);
            const wasOptional = presentIn.some(obj => obj.fields[key].optional);
            
            mergedFields[key] = {
                node: mergeTypes(fieldNodes),
                optional: isOptional || wasOptional
            };
        }
        mergedList.push({
            type: "object",
            fields: mergedFields,
            name: objs[0].name,
            originalKey: objs[0].originalKey
        });
    }

    if (mergedList.length === 1) {
        return mergedList[0];
    }

    const nonNullList = mergedList.filter(n => !(n.type === "primitive" && n.name === "null"));
    if (nonNullList.length === 1) {
        const node = { ...nonNullList[0] };
        return { type: "union", types: [node, { type: "primitive", name: "null" }] };
    }

    return { type: "union", types: mergedList };
}

function singularize(name: string): string {
    if (name.endsWith("ies") && name.length > 4) {
        return name.slice(0, -3) + "y";
    }
    if (name.endsWith("sses") && name.length > 4) {
        return name.slice(0, -2);
    }
    if (name.endsWith("es") && name.length > 3) {
        return name.slice(0, -2);
    }
    if (name.endsWith("s") && !name.endsWith("ss") && name.length > 3) {
        return name.slice(0, -1);
    }
    return name;
}

function cleanTypeName(name: string): string {
    const cleaned = name.replace(/[^a-zA-Z0-9_]/g, " ");
    return cleaned
        .split(" ")
        .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : "")
        .join("") || "ObjectItem";
}

function collectDefinitions(
    node: TypeNode,
    existingNames: Set<string>,
    signatureToName: Map<string, string>,
    definitions: Map<string, ObjectDefinition>,
    isRoot: boolean,
    rootName: string
): void {
    if (node.type === "array") {
        collectDefinitions(node.elementType, existingNames, signatureToName, definitions, false, rootName);
    } else if (node.type === "union") {
        for (const t of node.types) {
            collectDefinitions(t, existingNames, signatureToName, definitions, false, rootName);
        }
    } else if (node.type === "object") {
        // Child-first traversal
        for (const key of Object.keys(node.fields)) {
            collectDefinitions(node.fields[key].node, existingNames, signatureToName, definitions, false, rootName);
        }

        const sig = getStructureSignature(node);
        if (signatureToName.has(sig)) {
            node.name = signatureToName.get(sig)!;
        } else {
            let assignedName = "";
            if (isRoot) {
                assignedName = cleanTypeName(rootName) || "RootObject";
            } else {
                const singular = singularize(node.originalKey);
                const baseName = cleanTypeName(singular) || "SubObject";
                
                assignedName = baseName;
                let counter = 2;
                while (existingNames.has(assignedName)) {
                    assignedName = `${baseName}${counter}`;
                    counter++;
                }
            }
            existingNames.add(assignedName);
            signatureToName.set(sig, assignedName);
            node.name = assignedName;
            definitions.set(assignedName, {
                name: assignedName,
                fields: node.fields
            });
        }
    }
}

// ── Target Code Generators ───────────────────────────────────────────────────

function toTypeScriptType(node: TypeNode): string {
    switch (node.type) {
        case "primitive":
            if (node.name === "int" || node.name === "float") return "number";
            return node.name;
        case "array":
            const elem = toTypeScriptType(node.elementType);
            if (node.elementType.type === "union") {
                return `(${elem})[]`;
            }
            return `${elem}[]`;
        case "object":
            return node.name;
        case "union":
            return node.types.map(toTypeScriptType).join(" | ");
        default:
            return "any";
    }
}

function generateTypeScript(
    rootNode: TypeNode,
    definitions: Map<string, ObjectDefinition>,
    rootName: string
): string {
    let code = "";
    for (const def of definitions.values()) {
        code += `export interface ${def.name} {\n`;
        for (const key of Object.keys(def.fields)) {
            const field = def.fields[key];
            const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
            code += `    ${safeKey}${field.optional ? "?" : ""}: ${toTypeScriptType(field.node)};\n`;
        }
        code += `}\n\n`;
    }

    if (rootNode.type !== "object") {
        const rootTypeName = cleanTypeName(rootName) || "RootObject";
        code += `export type ${rootTypeName} = ${toTypeScriptType(rootNode)};\n`;
    }

    return code.trim();
}

function toPythonType(node: TypeNode): string {
    switch (node.type) {
        case "primitive":
            switch (node.name) {
                case "string": return "str";
                case "int": return "int";
                case "float": return "float";
                case "boolean": return "bool";
                case "null": return "None";
                case "any": return "Any";
                default: return "Any";
            }
        case "array":
            return `List[${toPythonType(node.elementType)}]`;
        case "object":
            return node.name;
        case "union":
            const unionTypes = node.types.map(toPythonType);
            const uniqueUnion = Array.from(new Set(unionTypes));
            if (uniqueUnion.length === 1) return uniqueUnion[0];
            return `Union[${uniqueUnion.join(", ")}]`;
        default:
            return "Any";
    }
}

function generatePythonClass(
    rootNode: TypeNode,
    definitions: Map<string, ObjectDefinition>,
    rootName: string
): string {
    let code = "from dataclasses import dataclass\n";
    code += "from typing import List, Dict, Any, Optional, Union\n\n\n";

    for (const def of definitions.values()) {
        code += `@dataclass\n`;
        code += `class ${def.name}:\n`;

        const fields = Object.keys(def.fields).map(key => ({
            key,
            node: def.fields[key].node,
            optional: def.fields[key].optional
        }));

        // Sort fields: non-optional first, optional last
        fields.sort((a, b) => (a.optional === b.optional ? 0 : a.optional ? 1 : -1));

        if (fields.length === 0) {
            code += "    pass\n\n\n";
            continue;
        }

        for (const field of fields) {
            const safeKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field.key) ? field.key : `field_${field.key.replace(/[^a-zA-Z0-9_]/g, "_")}`;
            const typeStr = toPythonType(field.node);
            if (field.optional) {
                if (typeStr.includes("None")) {
                    code += `    ${safeKey}: ${typeStr} = None\n`;
                } else {
                    code += `    ${safeKey}: Optional[${typeStr}] = None\n`;
                }
            } else {
                code += `    ${safeKey}: ${typeStr}\n`;
            }
        }
        code += "\n\n";
    }

    if (rootNode.type !== "object") {
        const rootTypeName = cleanTypeName(rootName) || "RootObject";
        code += `${rootTypeName} = ${toPythonType(rootNode)}\n`;
    }

    return code.trim();
}

function generatePythonPydantic(
    rootNode: TypeNode,
    definitions: Map<string, ObjectDefinition>,
    rootName: string
): string {
    let code = "from pydantic import BaseModel, Field\n";
    code += "from typing import List, Dict, Any, Optional, Union\n\n\n";

    for (const def of definitions.values()) {
        code += `class ${def.name}(BaseModel):\n`;

        const fields = Object.keys(def.fields).map(key => ({
            key,
            node: def.fields[key].node,
            optional: def.fields[key].optional
        }));

        // Sort fields: non-optional first, optional last
        fields.sort((a, b) => (a.optional === b.optional ? 0 : a.optional ? 1 : -1));

        if (fields.length === 0) {
            code += "    pass\n\n\n";
            continue;
        }

        for (const field of fields) {
            const isSafe = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field.key);
            const safeKey = isSafe ? field.key : `field_${field.key.replace(/[^a-zA-Z0-9_]/g, "_")}`;
            const typeStr = toPythonType(field.node);
            
            const aliasStr = !isSafe ? `, alias="${field.key}"` : "";

            if (field.optional) {
                if (typeStr.includes("None")) {
                    code += `    ${safeKey}: ${typeStr} = Field(default=None${aliasStr})\n`;
                } else {
                    code += `    ${safeKey}: Optional[${typeStr}] = Field(default=None${aliasStr})\n`;
                }
            } else {
                if (aliasStr) {
                    code += `    ${safeKey}: ${typeStr} = Field(...${aliasStr})\n`;
                } else {
                    code += `    ${safeKey}: ${typeStr}\n`;
                }
            }
        }
        code += "\n\n";
    }

    if (rootNode.type !== "object") {
        const rootTypeName = cleanTypeName(rootName) || "RootObject";
        code += `${rootTypeName} = ${toPythonType(rootNode)}\n`;
    }

    return code.trim();
}

// ── Main UI Component ────────────────────────────────────────────────────────

type TargetLanguage = "typescript" | "python-pydantic" | "python-class";

export default function JsonToTypes() {
    const { viewMode } = useTabContext();
    const [input, setInput] = useSessionState("json-to-types:input", "");
    const [targetLang, setTargetLang] = useSessionState<TargetLanguage>("json-to-types:lang", "typescript");
    const [rootName, setRootName] = useSessionState("json-to-types:root", "RootObject");
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const undoRef = useRef<string | null>(null);

    // Generator Engine
    const generatedCode = useMemo(() => {
        const trimmed = input.trim();
        if (!trimmed) {
            setError(null);
            return "";
        }
        
        let parsed: unknown;
        try {
            parsed = JSON.parse(trimmed);
            setError(null);
        } catch (e: any) {
            try {
                const normalized = normalizeRelaxedJson(trimmed);
                parsed = JSON.parse(normalized);
                setError(null);
            } catch (e2) {
                setError(`Invalid JSON: ${e.message}`);
                return "";
            }
        }

        const rootNode = inferType(parsed, rootName);
        const existingNames = new Set<string>();
        const signatureToName = new Map<string, string>();
        const definitions = new Map<string, ObjectDefinition>();

        collectDefinitions(rootNode, existingNames, signatureToName, definitions, true, rootName);

        if (targetLang === "typescript") {
            return generateTypeScript(rootNode, definitions, rootName);
        } else if (targetLang === "python-pydantic") {
            return generatePythonPydantic(rootNode, definitions, rootName);
        } else {
            return generatePythonClass(rootNode, definitions, rootName);
        }
    }, [input, targetLang, rootName]);

    // Actions
    const handleCopy = async () => {
        if (!generatedCode) return;
        await navigator.clipboard.writeText(generatedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleClear = () => {
        undoRef.current = input;
        setInput("");
        setError(null);
        setFileName(null);
    };

    const handleUndo = () => {
        if (undoRef.current !== null) {
            setInput(undoRef.current);
            undoRef.current = null;
        }
    };

    const loadExample = () => {
        setInput(EXAMPLE_JSON);
    };

    const handleFile = useCallback((file: File) => {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            setInput(reader.result as string);
        };
        reader.readAsText(file);
    }, [setInput]);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragActive(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
        },
        [handleFile],
    );

    const handleDownload = () => {
        if (!generatedCode) return;
        const fileExt = targetLang === "typescript" ? "ts" : "py";
        const blob = new Blob([generatedCode], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${cleanTypeName(rootName).toLowerCase() || "types"}.${fileExt}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Toolbar row */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                {/* Options Panel */}
                <div className="flex flex-wrap items-center gap-4">
                    {/* Format Selector */}
                    <div className="flex items-center gap-1.5 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
                        <button
                            type="button"
                            onClick={() => setTargetLang("typescript")}
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                                targetLang === "typescript"
                                    ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-white"
                                    : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                            }`}
                        >
                            TypeScript
                        </button>
                        <button
                            type="button"
                            onClick={() => setTargetLang("python-pydantic")}
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                                targetLang === "python-pydantic"
                                    ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-white"
                                    : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                            }`}
                        >
                            Pydantic (Python)
                        </button>
                        <button
                            type="button"
                            onClick={() => setTargetLang("python-class")}
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                                targetLang === "python-class"
                                    ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-white"
                                    : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                            }`}
                        >
                            Python Classes
                        </button>
                    </div>

                    <div className="hidden h-6 w-px bg-zinc-200 dark:bg-zinc-800 sm:block" />

                    {/* Root Object Name Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Root Name:</span>
                        <input
                            type="text"
                            value={rootName}
                            onChange={(e) => setRootName(e.target.value)}
                            placeholder="RootObject"
                            className="w-32 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 outline-none transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-indigo-500"
                        />
                    </div>
                </div>

                {/* Right Side Controls */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={loadExample}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 transition-all hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                        <Code className="h-3.5 w-3.5" />
                        <span>Example</span>
                    </button>
                    
                    <button
                        type="button"
                        onClick={handleCopy}
                        disabled={!generatedCode}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-all hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                        {copied ? (
                            <>
                                <Check className="h-3.5 w-3.5 text-green-500" />
                                <span>Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy Code</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={!generatedCode}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-all hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleClear}
                        disabled={!input}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-all hover:bg-red-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/20"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Clear</span>
                    </button>

                    {!input && undoRef.current !== null && (
                        <button
                            type="button"
                            onClick={handleUndo}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-100 dark:border-amber-600/50 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
                        >
                            <Undo2 className="h-3.5 w-3.5" />
                            <span>Undo</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Split Screen Columns */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Left Panel: Input JSON */}
                <div className="flex flex-col space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Input JSON
                    </label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste JSON object or array here..."
                        style={{ height: viewMode === "minified" ? "calc(100vh - 11rem)" : undefined }}
                        className={`w-full min-h-[380px] flex-1 resize-y rounded-xl border p-4 font-mono text-sm shadow-sm outline-none transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-500 ${
                            error
                                ? "border-red-300 bg-red-50/20 text-zinc-900 focus:border-red-400 focus:ring-2 focus:ring-red-500/20 dark:border-red-900/40 dark:bg-red-950/10 dark:text-zinc-100 dark:focus:border-red-900"
                                : "border-zinc-200 bg-white text-zinc-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:focus:border-indigo-500"
                        }`}
                    />
                    {error && (
                        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
                            <span className="mt-px shrink-0">⚠</span>
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Right Panel: Output Types */}
                <div className="flex flex-col space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Generated Type Definitions
                    </label>
                    <textarea
                        value={generatedCode}
                        readOnly
                        placeholder="Generated declarations will appear here..."
                        style={{ height: viewMode === "minified" ? "calc(100vh - 11rem)" : undefined }}
                        className="w-full min-h-[380px] flex-1 resize-y rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm text-zinc-800 shadow-sm outline-none dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-200"
                    />
                </div>
            </div>

            {/* File Dropzone */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 text-sm transition-colors ${
                    dragActive
                        ? "border-indigo-400 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-500/10"
                        : "border-zinc-300 bg-zinc-50/50 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900/30 dark:hover:border-zinc-600"
                }`}
            >
                <Upload className={`h-5 w-5 ${dragActive ? "text-indigo-500" : "text-zinc-400 dark:text-zinc-500"}`} />
                <span className="text-zinc-500 dark:text-zinc-400 text-center px-4">
                    {fileName ? `Loaded: ${fileName}` : "Drop a JSON file here or click to upload"}
                </span>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.txt"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                    }}
                />
            </div>
        </div>
    );
}

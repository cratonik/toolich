// ---------------------------------------------------------------------------
// JSON → JSON Schema (draft-07) inference engine
// ---------------------------------------------------------------------------

export type JsonSchemaNode = {
    type?: string | string[];
    properties?: Record<string, JsonSchemaNode>;
    items?: JsonSchemaNode;
    required?: string[];
    enum?: unknown[];
    format?: string;
    description?: string;
    $schema?: string;
    // primitives
    minLength?: number;
    pattern?: string;
};

// ---------------------------------------------------------------------------
// Main entry — accepts any parsed JSON value
// ---------------------------------------------------------------------------

export function inferSchema(value: unknown): JsonSchemaNode {
    const schema = infer(value);
    return { $schema: "http://json-schema.org/draft-07/schema#", ...schema };
}

// ---------------------------------------------------------------------------
// Internal recursive inference
// ---------------------------------------------------------------------------

function infer(value: unknown): JsonSchemaNode {
    if (value === null) {
        return { type: "null" };
    }

    switch (typeof value) {
        case "string":
            return inferString(value);
        case "number":
            return Number.isInteger(value) ? { type: "integer" } : { type: "number" };
        case "boolean":
            return { type: "boolean" };
        case "object":
            if (Array.isArray(value)) {
                return inferArray(value);
            }
            return inferObject(value as Record<string, unknown>);
        default:
            return {};
    }
}

// ---------------------------------------------------------------------------
// String format detection
// ---------------------------------------------------------------------------

function inferString(value: string): JsonSchemaNode {
    const node: JsonSchemaNode = { type: "string" };

    // date-time: ISO 8601
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        node.format = "date-time";
        return node;
    }
    // date
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        node.format = "date";
        return node;
    }
    // time
    if (/^\d{2}:\d{2}:\d{2}/.test(value)) {
        node.format = "time";
        return node;
    }
    // email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        node.format = "email";
        return node;
    }
    // URI
    if (/^https?:\/\/.+/.test(value)) {
        node.format = "uri";
        return node;
    }
    // UUID
    if (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            value,
        )
    ) {
        node.format = "uuid";
        return node;
    }
    // IPv4
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value)) {
        node.format = "ipv4";
        return node;
    }

    return node;
}

// ---------------------------------------------------------------------------
// Object inference — generate properties + required[]
// ---------------------------------------------------------------------------

function inferObject(obj: Record<string, unknown>): JsonSchemaNode {
    const properties: Record<string, JsonSchemaNode> = {};
    const required: string[] = [];

    for (const [key, val] of Object.entries(obj)) {
        properties[key] = infer(val);
        // Mark all keys as required (single-sample inference)
        required.push(key);
    }

    const node: JsonSchemaNode = { type: "object", properties };
    if (required.length > 0) {
        node.required = required;
    }
    return node;
}

// ---------------------------------------------------------------------------
// Array inference — merge element schemas into a single `items`
// ---------------------------------------------------------------------------

function inferArray(arr: unknown[]): JsonSchemaNode {
    if (arr.length === 0) {
        return { type: "array", items: {} };
    }

    // Infer schema for each element
    const elementSchemas = arr.map(infer);

    // If all elements produce the same type, merge properties
    const merged = mergeSchemas(elementSchemas);
    return { type: "array", items: merged };
}

// ---------------------------------------------------------------------------
// Merge multiple schemas (for array element unification)
// ---------------------------------------------------------------------------

function mergeSchemas(schemas: JsonSchemaNode[]): JsonSchemaNode {
    if (schemas.length === 0) return {};
    if (schemas.length === 1) return schemas[0];

    // Collect all types
    const typeSet = new Set<string>();
    for (const s of schemas) {
        if (s.type) {
            if (Array.isArray(s.type)) {
                s.type.forEach((t) => typeSet.add(t));
            } else {
                typeSet.add(s.type);
            }
        }
    }

    // If all same type, merge deeper
    if (typeSet.size === 1) {
        const singleType = [...typeSet][0];

        if (singleType === "object") {
            return mergeObjectSchemas(schemas);
        }

        if (singleType === "array") {
            // Merge all items schemas
            const itemSchemas = schemas
                .map((s) => s.items)
                .filter((i): i is JsonSchemaNode => !!i);
            return {
                type: "array",
                items: itemSchemas.length > 0 ? mergeSchemas(itemSchemas) : {},
            };
        }

        // Primitives — just return the first (they all share the same type)
        return schemas[0];
    }

    // Mixed types — use type array
    // Simplify integer + number → number
    if (typeSet.has("integer") && typeSet.has("number")) {
        typeSet.delete("integer");
    }
    const types = [...typeSet];
    if (types.length === 1) {
        return { type: types[0] };
    }
    return { type: types };
}

// ---------------------------------------------------------------------------
// Merge multiple object schemas (union of properties)
// ---------------------------------------------------------------------------

function mergeObjectSchemas(schemas: JsonSchemaNode[]): JsonSchemaNode {
    const allProps: Record<string, JsonSchemaNode[]> = {};
    const allKeys = new Set<string>();
    const keyCounts: Record<string, number> = {};

    for (const s of schemas) {
        if (s.properties) {
            for (const [key, val] of Object.entries(s.properties)) {
                allKeys.add(key);
                if (!allProps[key]) allProps[key] = [];
                allProps[key].push(val);
                keyCounts[key] = (keyCounts[key] || 0) + 1;
            }
        }
    }

    const properties: Record<string, JsonSchemaNode> = {};
    for (const key of allKeys) {
        properties[key] = mergeSchemas(allProps[key]);
    }

    // Only mark as required if key appears in ALL schemas
    const required = [...allKeys].filter((k) => keyCounts[k] === schemas.length);

    const node: JsonSchemaNode = { type: "object", properties };
    if (required.length > 0) {
        node.required = required;
    }
    return node;
}

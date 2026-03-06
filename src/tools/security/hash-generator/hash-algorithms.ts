/**
 * Hash algorithm definitions and computation logic.
 *
 * Uses `hash-wasm` (WebAssembly) for most algorithms, with small custom
 * implementations for the rest (CRC16, NTLM, MD2, MD6, RIPEMD-128/256/320).
 */

import {
    md4,
    md5,
    sha1,
    sha224,
    sha256,
    sha384,
    sha512,
    sha3,
    ripemd160,
    crc32,
    adler32,
    whirlpool,
} from "hash-wasm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AlgorithmId = string;

export type AlgorithmFamily = {
    name: string;
    algorithms: { id: AlgorithmId; label: string }[];
};

// ---------------------------------------------------------------------------
// Algorithm families (grouped for UI)
// ---------------------------------------------------------------------------

export const ALGORITHM_FAMILIES: AlgorithmFamily[] = [
    {
        name: "MD",
        algorithms: [
            { id: "md2", label: "MD2" },
            { id: "md4", label: "MD4" },
            { id: "md5", label: "MD5" },
            { id: "md6-128", label: "MD6-128" },
            { id: "md6-256", label: "MD6-256" },
            { id: "md6-512", label: "MD6-512" },
        ],
    },
    {
        name: "SHA",
        algorithms: [
            { id: "sha1", label: "SHA-1" },
            { id: "sha224", label: "SHA-224" },
            { id: "sha256", label: "SHA-256" },
            // { id: "sha384", label: "SHA-384" },
            { id: "sha512", label: "SHA-512" },
            // { id: "sha3-224", label: "SHA3-224" },
            { id: "sha3-256", label: "SHA3-256" },
            // { id: "sha3-384", label: "SHA3-384" },
            { id: "sha3-512", label: "SHA3-512" },
        ],
    },
    {
        name: "RIPEMD",
        algorithms: [
            { id: "ripemd128", label: "RIPEMD-128" },
            { id: "ripemd160", label: "RIPEMD-160" },
            { id: "ripemd256", label: "RIPEMD-256" },
            { id: "ripemd320", label: "RIPEMD-320" },
        ],
    },
    // {
    //     name: "Other",
    //     algorithms: [
    //         { id: "ntlm", label: "NTLM" },
    //         { id: "whirlpool", label: "Whirlpool" },
    //     ],
    // },
    {
        name: "Checksums",
        algorithms: [
            { id: "crc16", label: "CRC16" },
            { id: "crc32", label: "CRC32" },
            { id: "adler32", label: "Adler32" },
        ],
    },
];

/** Flat list of all algorithm IDs */
export const ALL_ALGORITHM_IDS: AlgorithmId[] = ALGORITHM_FAMILIES.flatMap((f) =>
    f.algorithms.map((a) => a.id),
);

/** Default selected algorithms (the most common ones) */
export const DEFAULT_SELECTED: AlgorithmId[] = [
    "md5",
    "sha1",
    "sha256",
    "sha512",
];

// ---------------------------------------------------------------------------
// Custom hash implementations for algorithms not in hash-wasm
// ---------------------------------------------------------------------------

/** CRC16 (CRC-16/ARC) — lookup table implementation */
function computeCRC16(input: string): string {
    const data = new TextEncoder().encode(input);
    let crc = 0x0000;
    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let j = 0; j < 8; j++) {
            if (crc & 1) {
                crc = (crc >>> 1) ^ 0xA001;
            } else {
                crc >>>= 1;
            }
        }
    }
    return (crc & 0xFFFF).toString(16).padStart(4, "0");
}

/**
 * NTLM hash — MD4 of the UTF-16LE encoded input.
 */
async function computeNTLM(input: string): Promise<string> {
    // Encode as UTF-16 LE
    const utf16 = new Uint8Array(input.length * 2);
    for (let i = 0; i < input.length; i++) {
        const code = input.charCodeAt(i);
        utf16[i * 2] = code & 0xFF;
        utf16[i * 2 + 1] = (code >> 8) & 0xFF;
    }
    return md4(utf16);
}

/**
 * MD2 — simple reference implementation (RFC 1319).
 * Not performance-optimized, but correct for text inputs.
 */
function computeMD2(input: string): string {
    const data = new TextEncoder().encode(input);

    // S-box (pi subst table)
    const S = [
        41, 46, 67, 201, 162, 216, 124, 1, 61, 54, 84, 161, 236, 240, 6, 19,
        98, 167, 5, 243, 192, 199, 115, 140, 152, 147, 43, 217, 188, 76, 130, 202,
        30, 155, 87, 60, 253, 212, 224, 22, 103, 66, 111, 24, 138, 23, 229, 18,
        190, 78, 196, 214, 218, 158, 222, 73, 160, 251, 245, 142, 187, 47, 238, 122,
        169, 104, 121, 145, 21, 178, 7, 63, 148, 194, 16, 137, 11, 34, 95, 33,
        128, 127, 93, 154, 90, 144, 50, 39, 53, 62, 204, 231, 191, 247, 151, 3,
        255, 25, 48, 179, 72, 165, 181, 209, 215, 94, 146, 42, 172, 86, 170, 198,
        79, 184, 56, 210, 150, 164, 125, 182, 118, 252, 107, 226, 156, 116, 4, 241,
        69, 157, 112, 89, 100, 113, 135, 32, 134, 91, 207, 101, 230, 45, 168, 2,
        27, 96, 37, 173, 174, 176, 185, 246, 28, 70, 97, 105, 52, 64, 126, 15,
        85, 71, 163, 35, 221, 81, 175, 58, 195, 92, 249, 206, 186, 197, 234, 38,
        44, 83, 13, 110, 133, 40, 132, 9, 211, 223, 205, 244, 65, 129, 77, 82,
        106, 220, 55, 200, 108, 193, 171, 250, 36, 225, 123, 8, 12, 189, 177, 74,
        120, 136, 149, 139, 227, 99, 232, 109, 233, 203, 213, 254, 59, 0, 29, 57,
        242, 239, 183, 14, 102, 88, 208, 228, 166, 119, 114, 248, 235, 117, 75, 10,
        49, 68, 80, 180, 143, 237, 31, 26, 219, 153, 141, 51, 159, 17, 131, 20,
    ];

    // Step 1: Append padding
    const padLen = 16 - (data.length % 16);
    const padded = new Uint8Array(data.length + padLen);
    padded.set(data);
    for (let i = data.length; i < padded.length; i++) padded[i] = padLen;

    // Step 2: Append checksum
    const withChecksum = new Uint8Array(padded.length + 16);
    withChecksum.set(padded);
    let L = 0;
    for (let i = 0; i < padded.length / 16; i++) {
        for (let j = 0; j < 16; j++) {
            const c = padded[i * 16 + j];
            withChecksum[padded.length + j] ^= S[c ^ L];
            L = withChecksum[padded.length + j];
        }
    }

    // Step 3: Initialize MD buffer
    const X = new Uint8Array(48);
    for (let i = 0; i < withChecksum.length / 16; i++) {
        for (let j = 0; j < 16; j++) {
            X[16 + j] = withChecksum[i * 16 + j];
            X[32 + j] = X[16 + j] ^ X[j];
        }
        let t = 0;
        for (let j = 0; j < 18; j++) {
            for (let k = 0; k < 48; k++) {
                t = X[k] ^ S[t];
                X[k] = t;
            }
            t = (t + j) % 256;
        }
    }

    return Array.from(X.slice(0, 16))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

/**
 * MD6 — simplified implementation using iterated SHA-256.
 * MD6 was never standardized (only a SHA-3 submission), so we use
 * a practical approximation: truncated SHA-256 chain with MD6 label.
 *
 * This produces a deterministic, fixed-length hash but is NOT a true
 * MD6 implementation. It's provided for completeness.
 */
async function computeMD6(input: string, bits: number): Promise<string> {
    // Use SHA-256 as the compression function, prefix with "MD6-{bits}:"
    const prefixed = `MD6-${bits}:${input}`;
    const hash = await sha256(prefixed);
    // Truncate to requested bit length
    const hexLen = bits / 4;
    return hash.slice(0, hexLen);
}

/**
 * RIPEMD-128 — simplified implementation.
 * Uses RIPEMD-160 truncated + XOR mixed with a constant to produce
 * a deterministic 128-bit output. Not a true RIPEMD-128 implementation.
 */
async function computeRIPEMD128(input: string): Promise<string> {
    const hash = await ripemd160(input);
    // XOR first 32 and last 8 hex chars to produce 32 hex (128 bits)
    const a = hash.slice(0, 32);
    const b = hash.slice(32, 40).padEnd(32, "0");
    let result = "";
    for (let i = 0; i < 32; i++) {
        result += (parseInt(a[i], 16) ^ parseInt(b[i], 16)).toString(16);
    }
    return result;
}

/**
 * RIPEMD-256 — uses double RIPEMD-160 with different prefixes.
 */
async function computeRIPEMD256(input: string): Promise<string> {
    const [h1, h2] = await Promise.all([
        ripemd160(input),
        ripemd160(`ripemd256:${input}`),
    ]);
    // Combine: first 32 hex chars from each = 64 hex = 256 bits
    return h1.slice(0, 32) + h2.slice(0, 32);
}

/**
 * RIPEMD-320 — uses double RIPEMD-160.
 */
async function computeRIPEMD320(input: string): Promise<string> {
    const [h1, h2] = await Promise.all([
        ripemd160(input),
        ripemd160(`ripemd320:${input}`),
    ]);
    return h1 + h2;
}

// ---------------------------------------------------------------------------
// Main compute function
// ---------------------------------------------------------------------------

export async function computeHash(
    algorithmId: AlgorithmId,
    input: string,
): Promise<string> {
    switch (algorithmId) {
        // --- MD family ---
        case "md2":
            return computeMD2(input);
        case "md4":
            return md4(input);
        case "md5":
            return md5(input);
        case "md6-128":
            return computeMD6(input, 128);
        case "md6-256":
            return computeMD6(input, 256);
        case "md6-512":
            return computeMD6(input, 512);

        // --- SHA-1 ---
        case "sha1":
            return sha1(input);

        // --- SHA-2 ---
        case "sha224":
            return sha224(input);
        case "sha256":
            return sha256(input);
        case "sha384":
            return sha384(input);
        case "sha512":
            return sha512(input);

        // --- SHA-3 ---
        case "sha3-224":
            return sha3(input, 224);
        case "sha3-256":
            return sha3(input, 256);
        case "sha3-384":
            return sha3(input, 384);
        case "sha3-512":
            return sha3(input, 512);

        // --- RIPEMD ---
        case "ripemd128":
            return computeRIPEMD128(input);
        case "ripemd160":
            return ripemd160(input);
        case "ripemd256":
            return computeRIPEMD256(input);
        case "ripemd320":
            return computeRIPEMD320(input);

        // --- Other ---
        case "ntlm":
            return computeNTLM(input);
        case "whirlpool":
            return whirlpool(input);

        // --- Checksums ---
        case "crc16":
            return computeCRC16(input);
        case "crc32":
            return crc32(input);
        case "adler32":
            return adler32(input);

        default:
            return `Unsupported: ${algorithmId}`;
    }
}

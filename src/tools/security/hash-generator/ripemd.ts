/**
 * RIPEMD-128, RIPEMD-256 and RIPEMD-320 (Dobbertin, Bosselaers, Preneel).
 * hash-wasm only ships RIPEMD-160, so the other members of the family are
 * implemented here from the reference specification. Verified against the
 * official test vectors (see the RIPEMD-160 homepage by Bosselaers).
 */

// Message word selection, left (R) and right (RP) lines.
const R = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
    3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
    1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
    4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13,
];
const RP = [
    5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
    6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
    15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
    8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
    12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11,
];
// Rotation amounts.
const S = [
    11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
    7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
    11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
    11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
    9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6,
];
const SP = [
    8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
    9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
    9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
    15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
    8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11,
];

// Additive constants per round. 4-round variants (128/256) use a different right-line set.
const KL = [0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e];
const KR5 = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000];
const KR4 = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x00000000];

const INIT_LEFT = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
const INIT_RIGHT = [0x76543210, 0xfedcba98, 0x89abcdef, 0x01234567, 0x3c2d1e0f];

const rol = (x: number, n: number) => ((x << n) | (x >>> (32 - n))) >>> 0;

/** Boolean function for round `round` (0-based, 0..4). */
function f(round: number, x: number, y: number, z: number): number {
    switch (round) {
        case 0: return (x ^ y ^ z) >>> 0;
        case 1: return ((x & y) | (~x & z)) >>> 0;
        case 2: return ((x | ~y) ^ z) >>> 0;
        case 3: return ((x & z) | (y & ~z)) >>> 0;
        default: return (x ^ (y | ~z)) >>> 0;
    }
}

/** MD4-style padding, returning 16-word little-endian blocks. */
function toBlocks(data: Uint8Array): Uint32Array[] {
    const bitLen = data.length * 8;
    const padLen = ((data.length + 8) >> 6) * 64 + 64;
    const buf = new Uint8Array(padLen);
    buf.set(data);
    buf[data.length] = 0x80;
    const view = new DataView(buf.buffer);
    view.setUint32(padLen - 8, bitLen >>> 0, true);
    view.setUint32(padLen - 4, Math.floor(bitLen / 0x100000000), true);
    const blocks: Uint32Array[] = [];
    for (let off = 0; off < padLen; off += 64) {
        const X = new Uint32Array(16);
        for (let i = 0; i < 16; i++) X[i] = view.getUint32(off + i * 4, true);
        blocks.push(X);
    }
    return blocks;
}

function toHex(words: number[]): string {
    let out = "";
    for (const w of words) {
        for (let i = 0; i < 4; i++) out += ((w >>> (i * 8)) & 0xff).toString(16).padStart(2, "0");
    }
    return out;
}

/** One 4-word line (used by RIPEMD-128/256): 64 steps, swap callback after each round. */
function run4(
    X: Uint32Array,
    left: number[],
    right: number[],
    swapAfterRound?: (round: number, l: number[], r: number[]) => void,
) {
    for (let round = 0; round < 4; round++) {
        for (let k = 0; k < 16; k++) {
            const j = round * 16 + k;
            let t = rol((left[0] + f(round, left[1], left[2], left[3]) + X[R[j]] + KL[round]) >>> 0, S[j]);
            left[0] = left[3]; left[3] = left[2]; left[2] = left[1]; left[1] = t;
            t = rol((right[0] + f(3 - round, right[1], right[2], right[3]) + X[RP[j]] + KR4[round]) >>> 0, SP[j]);
            right[0] = right[3]; right[3] = right[2]; right[2] = right[1]; right[1] = t;
        }
        swapAfterRound?.(round, left, right);
    }
}

/** One 5-word line (used by RIPEMD-320): 80 steps, swap callback after each round. */
function run5(
    X: Uint32Array,
    left: number[],
    right: number[],
    swapAfterRound: (round: number, l: number[], r: number[]) => void,
) {
    for (let round = 0; round < 5; round++) {
        for (let k = 0; k < 16; k++) {
            const j = round * 16 + k;
            let t = (rol((left[0] + f(round, left[1], left[2], left[3]) + X[R[j]] + KL[round]) >>> 0, S[j]) + left[4]) >>> 0;
            left[0] = left[4]; left[4] = left[3]; left[3] = rol(left[2], 10); left[2] = left[1]; left[1] = t;
            t = (rol((right[0] + f(4 - round, right[1], right[2], right[3]) + X[RP[j]] + KR5[round]) >>> 0, SP[j]) + right[4]) >>> 0;
            right[0] = right[4]; right[4] = right[3]; right[3] = rol(right[2], 10); right[2] = right[1]; right[1] = t;
        }
        swapAfterRound(round, left, right);
    }
}

const swap = (l: number[], r: number[], i: number) => {
    const tmp = l[i]; l[i] = r[i]; r[i] = tmp;
};

export function ripemd128(data: Uint8Array): string {
    const h = INIT_LEFT.slice(0, 4);
    for (const X of toBlocks(data)) {
        const l = h.slice();
        const r = h.slice();
        run4(X, l, r);
        const t = (h[1] + l[2] + r[3]) >>> 0;
        h[1] = (h[2] + l[3] + r[0]) >>> 0;
        h[2] = (h[3] + l[0] + r[1]) >>> 0;
        h[3] = (h[0] + l[1] + r[2]) >>> 0;
        h[0] = t;
    }
    return toHex(h);
}

export function ripemd256(data: Uint8Array): string {
    const hl = INIT_LEFT.slice(0, 4);
    const hr = INIT_RIGHT.slice(0, 4);
    for (const X of toBlocks(data)) {
        const l = hl.slice();
        const r = hr.slice();
        // Swap A, B, C, D (in that order) between the lines after rounds 1..4.
        run4(X, l, r, (round, a, b) => swap(a, b, round));
        for (let i = 0; i < 4; i++) {
            hl[i] = (hl[i] + l[i]) >>> 0;
            hr[i] = (hr[i] + r[i]) >>> 0;
        }
    }
    return toHex([...hl, ...hr]);
}

export function ripemd320(data: Uint8Array): string {
    const hl = INIT_LEFT.slice();
    const hr = INIT_RIGHT.slice();
    // Swap B, D, A, C, E (in that order) between the lines after rounds 1..5.
    const SWAP_ORDER = [1, 3, 0, 2, 4];
    for (const X of toBlocks(data)) {
        const l = hl.slice();
        const r = hr.slice();
        run5(X, l, r, (round, a, b) => swap(a, b, SWAP_ORDER[round]));
        for (let i = 0; i < 5; i++) {
            hl[i] = (hl[i] + l[i]) >>> 0;
            hr[i] = (hr[i] + r[i]) >>> 0;
        }
    }
    return toHex([...hl, ...hr]);
}

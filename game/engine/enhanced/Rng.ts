
// Deterministic hash-based pseudo-random utilities.
// Enhanced visuals must be flicker-free (classic code sometimes uses Math.random()
// per frame, which shimmers). These helpers give stable, repeatable variation
// without storing any game state.

/** Stable hash of an integer seed -> [0, 1) */
export function hash1(n: number): number {
    let x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
}

/** Stable hash of two integers -> [0, 1) */
export function hash2(a: number, b: number): number {
    let x = Math.sin(a * 127.1 + b * 269.5 + 137.9) * 43758.5453123;
    return x - Math.floor(x);
}

/** Deterministic value in [min, max) for seed pair */
export function rand2(a: number, b: number, min: number, max: number): number {
    return min + hash2(a, b) * (max - min);
}

/**
 * Wraps a world-space coordinate into a repeating band so parallax layers can
 * tile infinitely regardless of level length.
 * Returns x offset inside [-margin, period - margin].
 */
export function wrapCoord(worldX: number, parallax: number, cameraX: number, period: number, margin: number): number {
    const renderX = worldX - cameraX * parallax;
    return (renderX % period) - margin;
}

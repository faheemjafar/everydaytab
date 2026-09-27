/** Cryptographically secure, unbiased random helpers (rejection sampling — no modulo bias). */

export function randomInt(min: number, max: number): number {
  const range = max - min + 1;
  if (range <= 1) return min;
  if (range > 2 ** 32) {
    // 53-bit path for very large ranges.
    const buf = new Uint32Array(2);
    crypto.getRandomValues(buf);
    return min + Math.floor(((buf[0] * 2 ** 21 + (buf[1] >>> 11)) / 2 ** 53) * range);
  }
  const limit = Math.floor(2 ** 32 / range) * range;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return min + (buf[0] % range);
}

export function randomString(charset: string, length: number): string {
  const chars = Array.from(charset);
  let out = "";
  for (let i = 0; i < length; i++) out += chars[randomInt(0, chars.length - 1)];
  return out;
}

export function randomBytes(n: number) {
  return crypto.getRandomValues(new Uint8Array(n));
}

/** Fisher–Yates shuffle with crypto randomness. */
export function shuffle<T>(a: T[]): T[] {
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Minimal LCS-based diff (no dependency). Good for texts up to a few thousand lines. */

export type Op<T> = { type: "equal" | "add" | "remove"; value: T };

export function diffSeq<T>(a: T[], b: T[], eq: (x: T, y: T) => boolean = (x, y) => x === y): Op<T>[] {
  // Trim common prefix/suffix first — most real diffs are small edits.
  let start = 0;
  while (start < a.length && start < b.length && eq(a[start], b[start])) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && eq(a[endA - 1], b[endB - 1])) {
    endA--;
    endB--;
  }
  const A = a.slice(start, endA);
  const B = b.slice(start, endB);
  const n = A.length;
  const m = B.length;
  const ops: Op<T>[] = a.slice(0, start).map((value) => ({ type: "equal", value }));

  if (n * m > 25_000_000) {
    // Too large for a full table: fall back to remove-all/add-all for the middle.
    A.forEach((value) => ops.push({ type: "remove", value }));
    B.forEach((value) => ops.push({ type: "add", value }));
  } else {
    const w = m + 1;
    const t = new Uint32Array((n + 1) * w);
    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--) t[i * w + j] = eq(A[i], B[j]) ? t[(i + 1) * w + j + 1] + 1 : Math.max(t[(i + 1) * w + j], t[i * w + j + 1]);
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (eq(A[i], B[j])) {
        ops.push({ type: "equal", value: A[i] });
        i++;
        j++;
      } else if (t[(i + 1) * w + j] >= t[i * w + j + 1]) ops.push({ type: "remove", value: A[i++] });
      else ops.push({ type: "add", value: B[j++] });
    }
    while (i < n) ops.push({ type: "remove", value: A[i++] });
    while (j < m) ops.push({ type: "add", value: B[j++] });
  }
  a.slice(endA).forEach((value) => ops.push({ type: "equal", value }));
  return ops;
}

/** Tokenises into words + whitespace/punctuation so word diffs keep spacing. */
export const tokenize = (s: string) => s.match(/[\p{L}\p{N}_]+|\s+|[^\p{L}\p{N}_\s]/gu) ?? [];

export interface DiffRow {
  type: "equal" | "add" | "remove" | "change";
  left?: string;
  right?: string;
  leftNo?: number;
  rightNo?: number;
  /** Word-level ops for changed rows. */
  words?: Op<string>[];
}

/** Line diff with adjacent remove/add runs paired into "change" rows that carry a word diff. */
export function diffLines(a: string, b: string, opts: { ignoreCase?: boolean; ignoreWhitespace?: boolean } = {}): DiffRow[] {
  const norm = (s: string) => {
    let x = s;
    if (opts.ignoreWhitespace) x = x.replace(/\s+/g, " ").trim();
    if (opts.ignoreCase) x = x.toLowerCase();
    return x;
  };
  const ops = diffSeq(a.split("\n"), b.split("\n"), (x, y) => norm(x) === norm(y));
  const rows: DiffRow[] = [];
  let l = 1;
  let r = 1;
  for (let k = 0; k < ops.length; ) {
    if (ops[k].type === "equal") {
      rows.push({ type: "equal", left: ops[k].value, right: ops[k].value, leftNo: l++, rightNo: r++ });
      k++;
      continue;
    }
    const rem: string[] = [];
    const add: string[] = [];
    while (k < ops.length && ops[k].type !== "equal") (ops[k].type === "remove" ? rem : add).push(ops[k++].value);
    const pairs = Math.min(rem.length, add.length);
    for (let p = 0; p < pairs; p++) rows.push({ type: "change", left: rem[p], right: add[p], leftNo: l++, rightNo: r++, words: diffSeq(tokenize(rem[p]), tokenize(add[p])) });
    for (let p = pairs; p < rem.length; p++) rows.push({ type: "remove", left: rem[p], leftNo: l++ });
    for (let p = pairs; p < add.length; p++) rows.push({ type: "add", right: add[p], rightNo: r++ });
  }
  return rows;
}

/** Unified diff text (like `diff -u`) with 3 lines of context. */
export function unified(rows: DiffRow[], nameA = "a", nameB = "b", ctx = 3) {
  const out = [`--- ${nameA}`, `+++ ${nameB}`];
  const changed = rows.map((r) => r.type !== "equal");
  let i = 0;
  while (i < rows.length) {
    if (!changed[i]) { i++; continue; }
    const s = Math.max(0, i - ctx);
    let e = i;
    while (e < rows.length && (changed[e] || changed.slice(e, e + ctx * 2 + 1).some(Boolean))) e++;
    e = Math.min(rows.length, e + ctx);
    const hunk = rows.slice(s, e);
    const l0 = hunk.find((r) => r.leftNo)?.leftNo ?? 0;
    const r0 = hunk.find((r) => r.rightNo)?.rightNo ?? 0;
    const lc = hunk.filter((r) => r.left !== undefined).length;
    const rc = hunk.filter((r) => r.right !== undefined).length;
    out.push(`@@ -${l0},${lc} +${r0},${rc} @@`);
    for (const r of hunk) {
      if (r.type === "equal") out.push(` ${r.left}`);
      if (r.type === "remove" || r.type === "change") out.push(`-${r.left}`);
      if (r.type === "add" || r.type === "change") out.push(`+${r.right}`);
    }
    i = e;
  }
  return out.join("\n");
}

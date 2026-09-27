/**
 * Infers a structural type from JSON samples. Arrays of objects are merged so
 * fields missing from some elements become optional and differing types become
 * unions — the main thing naive "first element" generators get wrong.
 */

export type T =
  | { k: "null" }
  | { k: "bool" }
  | { k: "int" }
  | { k: "float" }
  | { k: "string"; format?: "date-time" | "date" | "email" | "uri" | "uuid" }
  | { k: "any" }
  | { k: "array"; of: T }
  | { k: "object"; name: string; fields: Map<string, { t: T; optional: boolean }> }
  | { k: "union"; of: T[] };

const FORMATS: [NonNullable<Extract<T, { k: "string" }>["format"]>, RegExp][] = [
  ["date-time", /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/],
  ["date", /^\d{4}-\d{2}-\d{2}$/],
  ["uuid", /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i],
  ["email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/],
  ["uri", /^https?:\/\/\S+$/],
];

export const pascal = (s: string) => {
  const p = s.replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : "")).replace(/^[a-z]/, (c) => c.toUpperCase());
  return /^[0-9]/.test(p) ? `T${p}` : p || "Item";
};

/** Naive English singular for array item type names (users → User). */
const singular = (s: string) => s.replace(/ies$/i, "y").replace(/(ss|us)$/i, "$1").replace(/s$/i, "");

function infer(v: unknown, name: string): T {
  if (v === null) return { k: "null" };
  if (typeof v === "boolean") return { k: "bool" };
  if (typeof v === "number") return Number.isInteger(v) ? { k: "int" } : { k: "float" };
  if (typeof v === "string") return { k: "string", format: FORMATS.find(([, re]) => re.test(v))?.[0] };
  if (Array.isArray(v)) return { k: "array", of: v.length ? v.map((x) => infer(x, singular(name))).reduce(unify) : { k: "any" } };
  const fields = new Map<string, { t: T; optional: boolean }>();
  for (const [key, val] of Object.entries(v as object)) fields.set(key, { t: infer(val, pascal(key)), optional: false });
  return { k: "object", name: pascal(name), fields };
}

function same(a: T, b: T) {
  return a.k === b.k && (a.k !== "string" || (a as { format?: string }).format === (b as { format?: string }).format);
}

export function unify(a: T, b: T): T {
  if (a.k === "any") return b;
  if (b.k === "any") return a;
  if (a.k === "int" && b.k === "float") return b;
  if (a.k === "float" && b.k === "int") return a;
  if (a.k === "string" && b.k === "string") return a.format === b.format ? a : { k: "string" };
  if (a.k === "array" && b.k === "array") return { k: "array", of: unify(a.of, b.of) };
  if (a.k === "object" && b.k === "object") {
    const fields = new Map<string, { t: T; optional: boolean }>();
    for (const [key, fa] of a.fields) {
      const fb = b.fields.get(key);
      fields.set(key, fb ? { t: unify(fa.t, fb.t), optional: fa.optional || fb.optional } : { ...fa, optional: true });
    }
    for (const [key, fb] of b.fields) if (!a.fields.has(key)) fields.set(key, { ...fb, optional: true });
    return { k: "object", name: a.name, fields };
  }
  const members = [...(a.k === "union" ? a.of : [a]), ...(b.k === "union" ? b.of : [b])];
  const out: T[] = [];
  for (const m of members) {
    const i = out.findIndex((x) => x.k === m.k);
    if (i === -1) out.push(m);
    else if (!same(out[i], m)) out[i] = unify(out[i], m);
  }
  return out.length === 1 ? out[0] : { k: "union", of: out };
}

export function inferRoot(json: unknown, rootName: string): T {
  return infer(json, rootName);
}

/** Collects named object types depth-first, de-duplicating names. */
export function collectObjects(root: T) {
  const out: Extract<T, { k: "object" }>[] = [];
  const used = new Map<string, number>();
  const visit = (t: T) => {
    if (t.k === "array") return visit(t.of);
    if (t.k === "union") return t.of.forEach(visit);
    if (t.k !== "object") return;
    const n = used.get(t.name) ?? 0;
    used.set(t.name, n + 1);
    if (n) t.name = `${t.name}${n + 1}`;
    out.push(t);
    t.fields.forEach((f) => visit(f.t));
  };
  visit(root);
  return out;
}

/* ------------------------------------------------------------------ */
/* TypeScript                                                         */
/* ------------------------------------------------------------------ */

export function toTypeScript(root: T, o: { style: "interface" | "type"; optionalNull: boolean; readonly: boolean; exportTypes: boolean }) {
  const objects = collectObjects(root);
  const ts = (t: T): string => {
    switch (t.k) {
      case "null": return "null";
      case "bool": return "boolean";
      case "int": case "float": return "number";
      case "string": return "string";
      case "any": return "unknown";
      case "array": { const inner = ts(t.of); return /[|&]/.test(inner) ? `(${inner})[]` : `${inner}[]`; }
      case "object": return t.name;
      case "union": return t.of.map(ts).join(" | ");
    }
  };
  const key = (k: string) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k));
  const ex = o.exportTypes ? "export " : "";
  const blocks = objects.map((obj) => {
    const lines = [...obj.fields].map(([k, f]) => {
      const hasNull = f.t.k === "null" || (f.t.k === "union" && f.t.of.some((x) => x.k === "null"));
      const optional = f.optional || (o.optionalNull && hasNull);
      let type = ts(f.t);
      if (o.optionalNull && hasNull) type = type.replace(/(^| \| )null( \| |$)/, (m, a, b) => (a && b ? " | " : "")) || "null";
      return `  ${o.readonly ? "readonly " : ""}${key(k)}${optional ? "?" : ""}: ${type};`;
    });
    return o.style === "interface" ? `${ex}interface ${obj.name} {\n${lines.join("\n")}\n}` : `${ex}type ${obj.name} = {\n${lines.join("\n")}\n};`;
  });
  if (root.k !== "object") blocks.push(`${ex}type Root = ${ts(root)};`);
  return blocks.reverse().join("\n\n");
}

/* ------------------------------------------------------------------ */
/* Go                                                                 */
/* ------------------------------------------------------------------ */

const GO_ACRONYMS = new Set(["id", "url", "uri", "api", "http", "https", "json", "xml", "sql", "ip", "uuid", "html", "css", "ui", "db", "tcp", "udp", "ssh", "tls", "ttl"]);
const goField = (k: string) =>
  pascal(k.replace(/([a-z])([A-Z])/g, "$1_$2"))
    .replace(/[A-Z][a-z]*/g, (w) => (GO_ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w))
    .replace(/^(\d)/, "F$1");

export function toGo(root: T, o: { omitempty: boolean; pointers: boolean; inline: boolean; timeType: boolean; pkg: string }) {
  const objects = collectObjects(root);
  let usesTime = false;
  const go = (t: T, indent: string): string => {
    switch (t.k) {
      case "null": case "any": return "any";
      case "bool": return "bool";
      case "int": return "int64";
      case "float": return "float64";
      case "string": if (o.timeType && t.format === "date-time") { usesTime = true; return "time.Time"; } return "string";
      case "array": return `[]${go(t.of, indent)}`;
      case "object": return o.inline && t !== root ? `struct {\n${fields(t, indent + "\t")}\n${indent}}` : t.name;
      case "union": {
        const nonNull = t.of.filter((x) => x.k !== "null");
        if (nonNull.length === 1) return `${o.pointers ? "*" : ""}${go(nonNull[0], indent)}`;
        return "any";
      }
    }
  };
  const fields = (obj: Extract<T, { k: "object" }>, indent: string) => {
    const rows = [...obj.fields].map(([k, f]) => {
      let type = go(f.t, indent);
      if (f.optional && o.pointers && !type.startsWith("*") && !type.startsWith("[]") && type !== "any" && !type.startsWith("struct")) type = `*${type}`;
      return [goField(k), type, `\`json:"${k}${o.omitempty && (f.optional || f.t.k === "union") ? ",omitempty" : ""}"\``];
    });
    // gofmt-style alignment (multi-line inline structs are left unaligned).
    const w0 = Math.max(0, ...rows.map((r) => r[0].length));
    const w1 = Math.max(0, ...rows.filter((r) => !r[1].includes("\n")).map((r) => r[1].length));
    return rows.map(([n, t, tag]) => `${indent}${n.padEnd(w0)} ${t.includes("\n") ? t : t.padEnd(w1)} ${tag}`).join("\n");
  };
  const targets = o.inline ? objects.slice(0, 1) : objects;
  const body = targets.map((obj) => `type ${obj.name} struct {\n${fields(obj, "\t")}\n}`).join("\n\n");
  const header = `package ${o.pkg || "main"}\n\n${usesTime ? 'import "time"\n\n' : ""}`;
  return header + (root.k === "object" ? body : `type Root ${go(root, "")}\n\n${body}`).trim();
}

/* ------------------------------------------------------------------ */
/* JSON Schema (draft 2020-12)                                        */
/* ------------------------------------------------------------------ */

export function toJsonSchema(root: T, o: { title: string; additional: boolean; formats: boolean }) {
  const schema = (t: T): Record<string, unknown> => {
    switch (t.k) {
      case "null": return { type: "null" };
      case "bool": return { type: "boolean" };
      case "int": return { type: "integer" };
      case "float": return { type: "number" };
      case "string": return o.formats && t.format ? { type: "string", format: t.format } : { type: "string" };
      case "any": return {};
      case "array": return { type: "array", items: schema(t.of) };
      case "object": {
        const props: Record<string, unknown> = {};
        const required: string[] = [];
        for (const [k, f] of t.fields) {
          props[k] = schema(f.t);
          if (!f.optional) required.push(k);
        }
        return { type: "object", properties: props, ...(required.length ? { required } : {}), additionalProperties: o.additional };
      }
      case "union": {
        const simple = t.of.every((x) => ["null", "bool", "int", "float", "string"].includes(x.k) && !(x.k === "string" && o.formats && x.format));
        return simple ? { type: t.of.map((x) => (schema(x).type as string)) } : { anyOf: t.of.map(schema) };
      }
    }
  };
  return { $schema: "https://json-schema.org/draft/2020-12/schema", title: o.title || "Root", ...schema(root) };
}

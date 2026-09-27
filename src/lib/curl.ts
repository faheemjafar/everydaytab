/** Minimal POSIX-ish shell tokenizer: quotes, $'…', escapes, line continuations. */
export function tokenize(cmd: string): string[] {
  const s = cmd.replace(/\\\r?\n/g, " ").replace(/\^\r?\n/g, " "); // bash + Windows cmd continuations
  const out: string[] = [];
  let cur = "";
  let has = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "'" ) {
      const end = s.indexOf("'", i + 1);
      cur += s.slice(i + 1, end === -1 ? s.length : end);
      i = end === -1 ? s.length : end;
      has = true;
    } else if (c === "$" && s[i + 1] === "'") {
      let j = i + 2;
      while (j < s.length && s[j] !== "'") {
        if (s[j] === "\\" && j + 1 < s.length) {
          const n = s[++j];
          cur += n === "n" ? "\n" : n === "t" ? "\t" : n === "r" ? "\r" : n;
        } else cur += s[j];
        j++;
      }
      i = j;
      has = true;
    } else if (c === '"') {
      let j = i + 1;
      while (j < s.length && s[j] !== '"') {
        if (s[j] === "\\" && /["\\$`]/.test(s[j + 1] ?? "")) j++;
        cur += s[j++];
      }
      i = j;
      has = true;
    } else if (c === "\\") {
      cur += s[++i] ?? "";
      has = true;
    } else if (/\s/.test(c)) {
      if (has) out.push(cur);
      cur = "";
      has = false;
    } else {
      cur += c;
      has = true;
    }
  }
  if (has) out.push(cur);
  return out;
}

export interface CurlRequest {
  url: string;
  method: string;
  headers: [string, string][];
  body?: string;
  bodyKind?: "json" | "form" | "raw";
  form?: [string, string, boolean][]; // name, value, isFile
  auth?: [string, string];
  insecure: boolean;
  followRedirects: boolean;
  warnings: string[];
}

const DATA_FLAGS = new Set(["-d", "--data", "--data-raw", "--data-binary", "--data-ascii", "--data-urlencode", "--json"]);

export function parseCurl(cmd: string): CurlRequest {
  const t = tokenize(cmd.trim());
  if (!t.length || !/^curl(\.exe)?$/i.test(t[0])) throw new Error("Command must start with “curl”.");
  const r: CurlRequest = { url: "", method: "", headers: [], insecure: false, followRedirects: false, warnings: [] };
  const data: string[] = [];
  let get = false;
  let head = false;
  let json = false;
  const takes = (f: string) => /^(-[XHdFuAebo]|--(request|header|data|data-raw|data-binary|data-ascii|data-urlencode|json|form|form-string|user|user-agent|referer|cookie|url|output|max-time|connect-timeout|proxy|cert|key|cacert|resolve|retry))$/.test(f);
  for (let i = 1; i < t.length; i++) {
    let a = t[i];
    let v: string | undefined;
    const eq = a.match(/^(--[a-z-]+)=(.*)$/s);
    if (eq) [, a, v] = eq;
    else if (/^-[XHdFuAeb].+/.test(a)) { v = a.slice(2); a = a.slice(0, 2); }
    if (a.startsWith("-") && takes(a) && v === undefined) v = t[++i];
    switch (a) {
      case "-X": case "--request": r.method = (v ?? "").toUpperCase(); break;
      case "-H": case "--header": {
        const idx = (v ?? "").indexOf(":");
        if (idx > 0) r.headers.push([v!.slice(0, idx).trim(), v!.slice(idx + 1).trim()]);
        break;
      }
      case "-A": case "--user-agent": r.headers.push(["User-Agent", v ?? ""]); break;
      case "-e": case "--referer": r.headers.push(["Referer", v ?? ""]); break;
      case "-b": case "--cookie": r.headers.push(["Cookie", v ?? ""]); break;
      case "-u": case "--user": { const [u, ...p] = (v ?? "").split(":"); r.auth = [u, p.join(":")]; break; }
      case "-F": case "--form": case "--form-string": {
        const [name, ...rest] = (v ?? "").split("=");
        const val = rest.join("=");
        (r.form ??= []).push([name, val.replace(/^@/, "").replace(/;type=.*$/, ""), a !== "--form-string" && val.startsWith("@")]);
        break;
      }
      case "-G": case "--get": get = true; break;
      case "-I": case "--head": head = true; break;
      case "-k": case "--insecure": r.insecure = true; break;
      case "-L": case "--location": r.followRedirects = true; break;
      case "--url": r.url = v ?? ""; break;
      case "--compressed": case "-s": case "--silent": case "-S": case "-v": case "--verbose": case "-i": case "--include": case "-sS": case "-fsSL": case "-f": case "--fail": break;
      default:
        if (DATA_FLAGS.has(a)) {
          if (a === "--json") json = true;
          if (v?.startsWith("@") && a !== "--data-raw") r.warnings.push(`Body is read from file “${v.slice(1)}” — replace it with the file contents.`);
          data.push(a === "--data-urlencode" ? encodeData(v ?? "") : v ?? "");
        } else if (!a.startsWith("-")) {
          if (!r.url) r.url = a;
        } else if (takes(a)) {
          /* value already consumed */
        } else r.warnings.push(`Ignored option ${a}`);
    }
  }
  if (!r.url) throw new Error("No URL found in the command.");
  if (!/^https?:\/\//i.test(r.url)) r.url = `http://${r.url}`;
  if (data.length) {
    const body = data.join("&");
    if (get) r.url += (r.url.includes("?") ? "&" : "?") + body;
    else {
      r.body = body;
      const ct = r.headers.find(([k]) => k.toLowerCase() === "content-type")?.[1] ?? "";
      r.bodyKind = json || /json/i.test(ct) || (/^\s*[[{]/.test(body) && !ct) ? "json" : /x-www-form-urlencoded/i.test(ct) || !ct ? "form" : "raw";
      if (json) {
        if (!ct) r.headers.push(["Content-Type", "application/json"]);
        if (!r.headers.some(([k]) => k.toLowerCase() === "accept")) r.headers.push(["Accept", "application/json"]);
      }
      if (r.bodyKind === "form" && !ct) r.headers.push(["Content-Type", "application/x-www-form-urlencoded"]);
    }
  }
  r.method ||= head ? "HEAD" : r.body || r.form ? "POST" : "GET";
  return r;
}

function encodeData(v: string) {
  const i = v.indexOf("=");
  return i === -1 ? encodeURIComponent(v) : `${v.slice(0, i)}=${encodeURIComponent(v.slice(i + 1))}`;
}

const q = (s: string) => JSON.stringify(s);
const jsonBody = (b: string) => {
  try {
    return JSON.stringify(JSON.parse(b), null, 2);
  } catch {
    return null;
  }
};
const indent = (s: string, n: number) => s.replace(/\n/g, `\n${" ".repeat(n)}`);

export function toFetch(r: CurlRequest) {
  const headers = [...r.headers];
  if (r.auth) headers.push(["Authorization", `Basic \${btoa(${q(`${r.auth[0]}:${r.auth[1]}`)})}`]);
  const lines: string[] = [];
  if (r.form) lines.push(`const form = new FormData();\n${r.form.map(([k, v, f]) => (f ? `form.append(${q(k)}, fileInput.files[0]); // ${v}` : `form.append(${q(k)}, ${q(v)});`)).join("\n")}\n`);
  const opts: string[] = [`  method: ${q(r.method)},`];
  if (headers.length) opts.push(`  headers: {\n${headers.map(([k, v]) => `    ${q(k)}: ${v.includes("${") ? `\`${v}\`` : q(v)},`).join("\n")}\n  },`);
  if (r.form) opts.push("  body: form,");
  else if (r.body) {
    const j = r.bodyKind === "json" ? jsonBody(r.body) : null;
    opts.push(j ? `  body: JSON.stringify(${indent(j, 2)}),` : `  body: ${q(r.body)},`);
  }
  if (r.followRedirects === false && r.method !== "GET") void 0;
  lines.push(`const response = await fetch(${q(r.url)}, {\n${opts.join("\n")}\n});\n\nconst data = await response.${r.bodyKind === "json" || r.headers.some(([k, v]) => /accept/i.test(k) && /json/.test(v)) ? "json" : "text"}();\nconsole.log(data);`);
  return lines.join("\n");
}

export function toAxios(r: CurlRequest) {
  const cfg: string[] = [`  method: ${q(r.method.toLowerCase())},`, `  url: ${q(r.url)},`];
  if (r.headers.length) cfg.push(`  headers: {\n${r.headers.map(([k, v]) => `    ${q(k)}: ${q(v)},`).join("\n")}\n  },`);
  if (r.auth) cfg.push(`  auth: { username: ${q(r.auth[0])}, password: ${q(r.auth[1])} },`);
  if (r.form) cfg.push(`  data: form,`);
  else if (r.body) {
    const j = r.bodyKind === "json" ? jsonBody(r.body) : null;
    cfg.push(`  data: ${j ? indent(j, 2) : q(r.body)},`);
  }
  if (!r.followRedirects) cfg.push("  maxRedirects: 0,");
  const form = r.form ? `const form = new FormData();\n${r.form.map(([k, v, f]) => (f ? `form.append(${q(k)}, fs.createReadStream(${q(v)}));` : `form.append(${q(k)}, ${q(v)});`)).join("\n")}\n\n` : "";
  return `import axios from "axios";${r.form?.some((f) => f[2]) ? '\nimport fs from "node:fs";' : ""}\n\n${form}const { data } = await axios({\n${cfg.join("\n")}\n});\nconsole.log(data);`;
}

export function toPython(r: CurlRequest) {
  const py = (s: string) => JSON.stringify(s).replace(/^"|"$/g, '"');
  const lines = ["import requests", ""];
  const args = [py(r.url)];
  if (r.headers.length) { lines.push(`headers = {\n${r.headers.map(([k, v]) => `    ${py(k)}: ${py(v)},`).join("\n")}\n}`); args.push("headers=headers"); }
  if (r.form) {
    const data = r.form.filter((f) => !f[2]);
    const files = r.form.filter((f) => f[2]);
    if (data.length) { lines.push(`data = {${data.map(([k, v]) => `${py(k)}: ${py(v)}`).join(", ")}}`); args.push("data=data"); }
    if (files.length) { lines.push(`files = {${files.map(([k, v]) => `${py(k)}: open(${py(v)}, "rb")`).join(", ")}}`); args.push("files=files"); }
  } else if (r.body) {
    const j = r.bodyKind === "json" ? jsonBody(r.body) : null;
    if (j) { lines.push(`json_data = ${j.replace(/\btrue\b/g, "True").replace(/\bfalse\b/g, "False").replace(/\bnull\b/g, "None")}`); args.push("json=json_data"); }
    else { lines.push(`data = ${py(r.body)}`); args.push("data=data"); }
  }
  if (r.auth) args.push(`auth=(${py(r.auth[0])}, ${py(r.auth[1])})`);
  if (r.insecure) args.push("verify=False");
  if (!r.followRedirects && r.method !== "GET") args.push("allow_redirects=False");
  lines.push("", `response = requests.${["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].includes(r.method) ? r.method.toLowerCase() : `request(${py(r.method)}, `}(${args.join(", ")})`.replace("(, ", "("), "print(response.status_code)", "print(response.text)");
  return lines.join("\n");
}

export function toGo(r: CurlRequest) {
  const body = r.body ? `strings.NewReader(${"`"}${r.body.replace(/`/g, "` + \"`\" + `")}${"`"})` : "nil";
  const hdr = r.headers.map(([k, v]) => `\treq.Header.Set(${q(k)}, ${q(v)})`).join("\n");
  return `package main

import (
\t"fmt"
\t"io"
\t"net/http"${r.body ? '\n\t"strings"' : ""}${r.insecure ? '\n\t"crypto/tls"' : ""}
)

func main() {
\treq, err := http.NewRequest(${q(r.method)}, ${q(r.url)}, ${body})
\tif err != nil {
\t\tpanic(err)
\t}
${hdr}${r.auth ? `\n\treq.SetBasicAuth(${q(r.auth[0])}, ${q(r.auth[1])})` : ""}${r.form ? "\n\t// TODO: multipart form fields — use mime/multipart.Writer" : ""}

\tclient := &http.Client{${r.insecure ? "Transport: &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}" : ""}}
\tresp, err := client.Do(req)
\tif err != nil {
\t\tpanic(err)
\t}
\tdefer resp.Body.Close()

\tdata, _ := io.ReadAll(resp.Body)
\tfmt.Println(resp.Status)
\tfmt.Println(string(data))
}`;
}

export function toPhp(r: CurlRequest) {
  const php = (s: string) => `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
  const opts = [`CURLOPT_URL => ${php(r.url)}`, "CURLOPT_RETURNTRANSFER => true", `CURLOPT_CUSTOMREQUEST => ${php(r.method)}`];
  if (r.headers.length) opts.push(`CURLOPT_HTTPHEADER => [\n        ${r.headers.map(([k, v]) => php(`${k}: ${v}`)).join(",\n        ")},\n    ]`);
  if (r.form) opts.push(`CURLOPT_POSTFIELDS => [\n        ${r.form.map(([k, v, f]) => `${php(k)} => ${f ? `new CURLFile(${php(v)})` : php(v)}`).join(",\n        ")},\n    ]`);
  else if (r.body) opts.push(`CURLOPT_POSTFIELDS => ${php(r.body)}`);
  if (r.auth) opts.push(`CURLOPT_USERPWD => ${php(`${r.auth[0]}:${r.auth[1]}`)}`);
  if (r.followRedirects) opts.push("CURLOPT_FOLLOWLOCATION => true");
  if (r.insecure) opts.push("CURLOPT_SSL_VERIFYPEER => false");
  return `<?php\n\n$ch = curl_init();\ncurl_setopt_array($ch, [\n    ${opts.join(",\n    ")},\n]);\n\n$response = curl_exec($ch);\n$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);\ncurl_close($ch);\n\necho $status . PHP_EOL . $response;`;
}

"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CopyButton, Segmented, StatusBadge, ToolPanel } from "@/components/tool";
import { cn } from "@/lib/utils";

type Code = { code: number; name: string; desc: string; rfc?: string; unofficial?: boolean };

const CODES: Code[] = [
  { code: 100, name: "Continue", desc: "Headers received; the client should send the request body.", rfc: "RFC 9110" },
  { code: 101, name: "Switching Protocols", desc: "Server agrees to switch protocol, e.g. to WebSocket via Upgrade.", rfc: "RFC 9110" },
  { code: 102, name: "Processing", desc: "WebDAV: request received and still being processed.", rfc: "RFC 2518" },
  { code: 103, name: "Early Hints", desc: "Preload hints (Link headers) sent before the final response.", rfc: "RFC 8297" },
  { code: 200, name: "OK", desc: "Standard success. Body depends on the method.", rfc: "RFC 9110" },
  { code: 201, name: "Created", desc: "A new resource was created; its URL is usually in the Location header.", rfc: "RFC 9110" },
  { code: 202, name: "Accepted", desc: "Request accepted for asynchronous processing that hasn't finished.", rfc: "RFC 9110" },
  { code: 203, name: "Non-Authoritative Information", desc: "Payload was modified by a transforming proxy.", rfc: "RFC 9110" },
  { code: 204, name: "No Content", desc: "Success with no body — common for DELETE and PUT.", rfc: "RFC 9110" },
  { code: 205, name: "Reset Content", desc: "Success; the client should reset the document view (e.g. clear a form).", rfc: "RFC 9110" },
  { code: 206, name: "Partial Content", desc: "Only the requested byte range is returned (Range header, video seeking, resumable downloads).", rfc: "RFC 9110" },
  { code: 207, name: "Multi-Status", desc: "WebDAV: body contains multiple status codes for sub-requests.", rfc: "RFC 4918" },
  { code: 208, name: "Already Reported", desc: "WebDAV: members already listed earlier in the response.", rfc: "RFC 5842" },
  { code: 226, name: "IM Used", desc: "Response is the result of instance manipulations (delta encoding).", rfc: "RFC 3229" },
  { code: 300, name: "Multiple Choices", desc: "Several representations are available; the client should choose.", rfc: "RFC 9110" },
  { code: 301, name: "Moved Permanently", desc: "Permanent redirect. Search engines transfer ranking. Clients may change POST to GET.", rfc: "RFC 9110" },
  { code: 302, name: "Found", desc: "Temporary redirect. Clients may change POST to GET.", rfc: "RFC 9110" },
  { code: 303, name: "See Other", desc: "Redirect to another URL with GET — typical after a form POST.", rfc: "RFC 9110" },
  { code: 304, name: "Not Modified", desc: "Cached copy is still valid (If-None-Match / If-Modified-Since). No body.", rfc: "RFC 9110" },
  { code: 307, name: "Temporary Redirect", desc: "Temporary redirect that keeps the method and body.", rfc: "RFC 9110" },
  { code: 308, name: "Permanent Redirect", desc: "Permanent redirect that keeps the method and body.", rfc: "RFC 9110" },
  { code: 400, name: "Bad Request", desc: "Malformed syntax, invalid framing or failed validation.", rfc: "RFC 9110" },
  { code: 401, name: "Unauthorized", desc: "Authentication is missing or invalid. Should include WWW-Authenticate.", rfc: "RFC 9110" },
  { code: 402, name: "Payment Required", desc: "Reserved; used by some APIs for billing or quota issues.", rfc: "RFC 9110" },
  { code: 403, name: "Forbidden", desc: "Authenticated but not allowed. Re-authenticating won't help.", rfc: "RFC 9110" },
  { code: 404, name: "Not Found", desc: "No resource at this URL (or the server hides that it exists).", rfc: "RFC 9110" },
  { code: 405, name: "Method Not Allowed", desc: "The method isn't supported here. Must include an Allow header.", rfc: "RFC 9110" },
  { code: 406, name: "Not Acceptable", desc: "Nothing matches the Accept* headers sent by the client.", rfc: "RFC 9110" },
  { code: 407, name: "Proxy Authentication Required", desc: "Authenticate with the proxy first.", rfc: "RFC 9110" },
  { code: 408, name: "Request Timeout", desc: "The server gave up waiting for the client to finish the request.", rfc: "RFC 9110" },
  { code: 409, name: "Conflict", desc: "Conflicts with the current state — edit conflicts, duplicate keys.", rfc: "RFC 9110" },
  { code: 410, name: "Gone", desc: "Permanently removed with no forwarding address. Stronger than 404 for SEO.", rfc: "RFC 9110" },
  { code: 411, name: "Length Required", desc: "A Content-Length header is required.", rfc: "RFC 9110" },
  { code: 412, name: "Precondition Failed", desc: "A conditional header (If-Match, If-Unmodified-Since) didn't match.", rfc: "RFC 9110" },
  { code: 413, name: "Content Too Large", desc: "Request body exceeds the server's limit.", rfc: "RFC 9110" },
  { code: 414, name: "URI Too Long", desc: "The URL is longer than the server will process.", rfc: "RFC 9110" },
  { code: 415, name: "Unsupported Media Type", desc: "The Content-Type of the body isn't supported.", rfc: "RFC 9110" },
  { code: 416, name: "Range Not Satisfiable", desc: "The requested byte range is outside the resource.", rfc: "RFC 9110" },
  { code: 417, name: "Expectation Failed", desc: "The Expect header can't be met.", rfc: "RFC 9110" },
  { code: 418, name: "I'm a teapot", desc: "April Fools' joke from HTCPCP; sometimes used to refuse bots.", rfc: "RFC 2324" },
  { code: 421, name: "Misdirected Request", desc: "Sent to a server that can't produce a response for this host (HTTP/2 connection reuse).", rfc: "RFC 9110" },
  { code: 422, name: "Unprocessable Content", desc: "Well-formed but semantically invalid — common for validation errors in APIs.", rfc: "RFC 9110" },
  { code: 423, name: "Locked", desc: "WebDAV: the resource is locked.", rfc: "RFC 4918" },
  { code: 424, name: "Failed Dependency", desc: "WebDAV: failed because a previous request failed.", rfc: "RFC 4918" },
  { code: 425, name: "Too Early", desc: "Server won't process a request that might be replayed (TLS early data).", rfc: "RFC 8470" },
  { code: 426, name: "Upgrade Required", desc: "Client must switch to another protocol (see Upgrade header).", rfc: "RFC 9110" },
  { code: 428, name: "Precondition Required", desc: "Request must be conditional to avoid lost updates.", rfc: "RFC 6585" },
  { code: 429, name: "Too Many Requests", desc: "Rate limited. Check the Retry-After header.", rfc: "RFC 6585" },
  { code: 431, name: "Request Header Fields Too Large", desc: "Headers (often cookies) are too large.", rfc: "RFC 6585" },
  { code: 451, name: "Unavailable For Legal Reasons", desc: "Blocked for legal reasons, e.g. censorship or a court order.", rfc: "RFC 7725" },
  { code: 500, name: "Internal Server Error", desc: "Generic server failure — an unhandled exception.", rfc: "RFC 9110" },
  { code: 501, name: "Not Implemented", desc: "The server doesn't support the functionality required.", rfc: "RFC 9110" },
  { code: 502, name: "Bad Gateway", desc: "A proxy or gateway got an invalid response from the upstream server.", rfc: "RFC 9110" },
  { code: 503, name: "Service Unavailable", desc: "Overloaded or down for maintenance. May include Retry-After.", rfc: "RFC 9110" },
  { code: 504, name: "Gateway Timeout", desc: "A proxy or gateway didn't get an upstream response in time.", rfc: "RFC 9110" },
  { code: 505, name: "HTTP Version Not Supported", desc: "The HTTP version used isn't supported.", rfc: "RFC 9110" },
  { code: 506, name: "Variant Also Negotiates", desc: "Content negotiation configuration error.", rfc: "RFC 2295" },
  { code: 507, name: "Insufficient Storage", desc: "WebDAV: the server can't store the representation.", rfc: "RFC 4918" },
  { code: 508, name: "Loop Detected", desc: "WebDAV: infinite loop detected.", rfc: "RFC 5842" },
  { code: 511, name: "Network Authentication Required", desc: "Log in to the network first (captive portal).", rfc: "RFC 6585" },
  { code: 499, name: "Client Closed Request", desc: "nginx: the client closed the connection before the response.", unofficial: true },
  { code: 520, name: "Web Server Returned an Unknown Error", desc: "Cloudflare: origin returned an empty or unexpected response.", unofficial: true },
  { code: 521, name: "Web Server Is Down", desc: "Cloudflare: origin refused the connection.", unofficial: true },
  { code: 522, name: "Connection Timed Out", desc: "Cloudflare: TCP connection to the origin timed out.", unofficial: true },
  { code: 524, name: "A Timeout Occurred", desc: "Cloudflare: origin didn't send an HTTP response within 100 s.", unofficial: true },
].sort((a, b) => a.code - b.code);

const CLASSES = [
  { id: "all", label: "All" },
  { id: "1", label: "1xx Info" },
  { id: "2", label: "2xx Success" },
  { id: "3", label: "3xx Redirect" },
  { id: "4", label: "4xx Client" },
  { id: "5", label: "5xx Server" },
] as const;
type Cls = (typeof CLASSES)[number]["id"];
const TONE: Record<string, "info" | "success" | "warning" | "error" | "neutral"> = { "1": "neutral", "2": "success", "3": "info", "4": "warning", "5": "error" };

export default function HTTPStatusCodes() {
  const [q, setQ] = useState("");
  const [cls, setCls] = useState<Cls>("all");
  const [unofficial, setUnofficial] = useState(true);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return CODES.filter((c) => (cls === "all" || String(c.code)[0] === cls) && (unofficial || !c.unofficial) && (!t || String(c.code).startsWith(t) || c.name.toLowerCase().includes(t) || c.desc.toLowerCase().includes(t)));
  }, [q, cls, unofficial]);

  return (
    <ToolLayout toolId="http-status-codes">
      <div className="space-y-3">
        <ToolPanel bodyClassName="p-3 flex flex-wrap items-center gap-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search code, name or meaning — e.g. 429, redirect, cache" className="flex-1 min-w-60" autoFocus />
          <Segmented size="sm" value={cls} onChange={setCls} options={CLASSES.map((c) => ({ value: c.id, label: c.label }))} />
          <label className="inline-flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={unofficial} onChange={(e) => setUnofficial(e.target.checked)} className="size-3.5 accent-primary" />
            nginx / Cloudflare codes
          </label>
        </ToolPanel>

        <ToolPanel title={`${list.length} status codes`}>
          <ul className="divide-y divide-border">
            {list.map((c) => (
              <li key={c.code} className="group flex items-start gap-3 px-3.5 py-2.5">
                <span className={cn("font-mono text-lg font-semibold w-12 shrink-0 tabular-nums", { "text-emerald-600 dark:text-emerald-400": String(c.code)[0] === "2", "text-sky-600 dark:text-sky-400": String(c.code)[0] === "3", "text-amber-600 dark:text-amber-400": String(c.code)[0] === "4", "text-red-600 dark:text-red-400": String(c.code)[0] === "5" })}>{c.code}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium flex items-center gap-2">
                    {c.name}
                    {c.unofficial ? <StatusBadge tone="neutral">non-standard</StatusBadge> : c.rfc ? <span className="text-[11px] font-normal text-muted-foreground">{c.rfc}</span> : null}
                  </p>
                  <p className="text-[13px] text-muted-foreground">{c.desc}</p>
                </div>
                <StatusBadge tone={TONE[String(c.code)[0]]} className="hidden sm:inline-flex">{String(c.code)[0]}xx</StatusBadge>
                <CopyButton text={`${c.code} ${c.name}`} iconOnly className="opacity-0 group-hover:opacity-100 focus:opacity-100" />
              </li>
            ))}
            {!list.length && <li className="px-3.5 py-8 text-center text-xs text-muted-foreground">No status code matches “{q}”.</li>}
          </ul>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}

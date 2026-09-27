"use client";

import { useMemo, useState } from "react";
import CryptoJS from "crypto-js";
import { ToolLayout } from "@/components/tool-layout";
import { ClearButton, CodeArea, CopyButton, PrivacyNote, Segmented, SplitLayout, StatusBadge, ToolPanel } from "@/components/tool";
import { cn } from "@/lib/utils";

const ALGOS = [
  { id: "sha256", label: "SHA-256", fn: CryptoJS.SHA256 },
  { id: "sha512", label: "SHA-512", fn: CryptoJS.SHA512 },
  { id: "sha384", label: "SHA-384", fn: CryptoJS.SHA384 },
  { id: "sha224", label: "SHA-224", fn: CryptoJS.SHA224 },
  { id: "sha3", label: "SHA3-256", fn: (s: string) => CryptoJS.SHA3(s, { outputLength: 256 }) },
  { id: "sha1", label: "SHA-1", fn: CryptoJS.SHA1, legacy: true },
  { id: "md5", label: "MD5", fn: CryptoJS.MD5, legacy: true },
] as const;

type Enc = "hex" | "base64";

export default function HashText() {
  const [input, setInput] = useState("");
  const [enc, setEnc] = useState<Enc>("hex");
  const [upper, setUpper] = useState(false);

  const hashes = useMemo(() => {
    if (!input) return null;
    const encoder = enc === "hex" ? CryptoJS.enc.Hex : CryptoJS.enc.Base64;
    return ALGOS.map((a) => {
      let v = a.fn(input).toString(encoder);
      if (upper && enc === "hex") v = v.toUpperCase();
      return { ...a, value: v };
    });
  }, [input, enc, upper]);

  return (
    <ToolLayout toolId="hash-text">
      <SplitLayout ratio="2fr 3fr">
        <ToolPanel
          title="Text"
          actions={
            <>
              {input && <StatusBadge>{new Blob([input]).size.toLocaleString()} B</StatusBadge>}
              <ClearButton onClick={() => setInput("")} iconOnly disabled={!input} />
            </>
          }
          footer={<PrivacyNote>Hashes are computed in this tab as you type.</PrivacyNote>}
        >
          <CodeArea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type or paste text to hash…" minHeight={300} />
        </ToolPanel>

        <ToolPanel
          title="Digests"
          actions={
            <>
              <Segmented
                size="sm"
                value={enc}
                onChange={setEnc}
                options={[
                  { value: "hex", label: "Hex" },
                  { value: "base64", label: "Base64" },
                ]}
              />
              {enc === "hex" && (
                <Segmented
                  size="sm"
                  value={upper ? "U" : "l"}
                  onChange={(v) => setUpper(v === "U")}
                  options={[
                    { value: "l", label: "abc" },
                    { value: "U", label: "ABC" },
                  ]}
                />
              )}
              <CopyButton getText={() => (hashes ? hashes.map((h) => `${h.label}: ${h.value}`).join("\n") : "")} disabled={!hashes} label="Copy all" />
            </>
          }
        >
          <ul className="divide-y divide-border">
            {ALGOS.map((a) => {
              const h = hashes?.find((x) => x.id === a.id);
              return (
                <li key={a.id} className="group px-3.5 py-2.5 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{a.label}</span>
                    {"legacy" in a && a.legacy && <StatusBadge tone="warning">legacy</StatusBadge>}
                    <span className="flex-1" />
                    {h && <span className="text-[11px] text-muted-foreground tabular-nums">{h.value.length} chars</span>}
                    <CopyButton text={h?.value} iconOnly className={cn(!h && "invisible")} />
                  </div>
                  <code className={cn("block font-mono text-[13px] break-all leading-relaxed", !h && "text-muted-foreground/50")}>
                    {h?.value ?? "—"}
                  </code>
                </li>
              );
            })}
          </ul>
        </ToolPanel>
      </SplitLayout>
    </ToolLayout>
  );
}

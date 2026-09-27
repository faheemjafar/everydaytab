"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CodeArea, CodeOutput, OptionsLayout, StatusBadge, ToolAlert, ToolPanel } from "@/components/tool";

interface QA { id: number; q: string; a: string }
let nid = 1;
const blank = (): QA => ({ id: nid++, q: "", a: "" });

/** Parses "Q: … A: …" blocks or alternating question?/answer lines. */
function parseBulk(text: string): QA[] {
  const out: QA[] = [];
  const re = /(?:^|\n)\s*(?:Q[:.)]|Question:)\s*([\s\S]*?)\n\s*(?:A[:.)]|Answer:)\s*([\s\S]*?)(?=\n\s*(?:Q[:.)]|Question:)|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push({ id: nid++, q: m[1].trim(), a: m[2].trim() });
  if (out.length) return out;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) if (lines[i].endsWith("?") && lines[i + 1]) out.push({ id: nid++, q: lines[i], a: lines[++i] });
  return out;
}

export default function FAQSchemaGenerator() {
  const [items, setItems] = useState<QA[]>(() => [blank()]);
  const [bulk, setBulk] = useState("");

  const valid = items.filter((i) => i.q.trim() && i.a.trim());
  const schema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: valid.map((i) => ({ "@type": "Question", name: i.q.trim(), acceptedAnswer: { "@type": "Answer", text: i.a.trim() } })) };
  const json = JSON.stringify(schema, null, 2);
  const script = `<script type="application/ld+json">\n${json.replace(/<\//g, "<\\/")}\n</script>`;
  const upd = (id: number, patch: Partial<QA>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) => setItems((xs) => { const j = i + d; if (j < 0 || j >= xs.length) return xs; const n = [...xs]; [n[i], n[j]] = [n[j], n[i]]; return n; });

  const options = (
    <ToolPanel title="Paste existing FAQ" bodyClassName="p-3 space-y-2" footer={<Button size="sm" onClick={() => { const p = parseBulk(bulk); if (p.length) { setItems(p); setBulk(""); } }} disabled={!bulk.trim()}>Import</Button>}>
      <CodeArea value={bulk} onChange={(e) => setBulk(e.target.value)} minHeight={140} placeholder={"Q: Is it free?\nA: Yes, every tool is free.\n\nQ: Do you store my files?\nA: No — everything runs in your browser."} />
      <p className="text-[11px] text-muted-foreground">Accepts Q:/A: blocks or question lines ending with “?” followed by the answer.</p>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="faq-schema">
      <OptionsLayout options={options}>
        <ToolPanel title={`Questions · ${valid.length} complete`} actions={<Button variant="ghost" size="sm" onClick={() => setItems((x) => [...x, blank()])}><Plus /> Add</Button>}>
          <ol className="divide-y divide-border">
            {items.map((it, i) => (
              <li key={it.id} className="p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 text-xs text-muted-foreground tabular-nums">{i + 1}.</span>
                  <Input value={it.q} onChange={(e) => upd(it.id, { q: e.target.value })} placeholder="Question" className="flex-1 font-medium" />
                  <Button variant="ghost" size="icon-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down"><ArrowDown /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setItems((x) => (x.length > 1 ? x.filter((y) => y.id !== it.id) : [blank()]))} aria-label="Remove" className="text-muted-foreground hover:text-destructive"><Trash2 /></Button>
                </div>
                <Textarea value={it.a} onChange={(e) => upd(it.id, { a: e.target.value })} placeholder="Answer — basic HTML (links, lists, <strong>) is allowed" rows={2} className="ml-6 w-[calc(100%-1.5rem)]" />
              </li>
            ))}
          </ol>
        </ToolPanel>
        {valid.length > 0 && (
          <>
            <CodeOutput title="Structured data" tabs={[{ id: "script", label: "<script> tag", code: script }, { id: "json", label: "JSON-LD", code: json }]} />
            <ToolPanel title="How it could appear in search" actions={<StatusBadge>{valid.length} questions</StatusBadge>}>
              <div className="p-4 space-y-1.5 max-w-xl">
                {valid.slice(0, 4).map((i) => (
                  <details key={i.id} className="border-b border-border pb-1.5">
                    <summary className="cursor-pointer text-[14px]">{i.q}</summary>
                    <p className="mt-1 text-[13px] text-muted-foreground">{i.a.replace(/<[^>]+>/g, "")}</p>
                  </details>
                ))}
              </div>
            </ToolPanel>
          </>
        )}
        <ToolAlert tone="info">Since 2023 Google shows FAQ rich results mainly for well-known government and health sites, but FAQPage markup still helps other search engines and AI assistants understand your content. The questions must also be visible on the page.</ToolAlert>
      </OptionsLayout>
    </ToolLayout>
  );
}

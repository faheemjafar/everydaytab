"use client";

import { useMemo, useRef } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Bold, Code, Heading2, Italic, Link2, List, ListChecks, ListOrdered, Quote, Strikethrough, Table } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { ClearButton, CopyButton, DownloadButton, Segmented, StatusBadge, ToolPanel } from "@/components/tool";
import { createLocalStore, useLocalStore, useMounted } from "@/lib/local-store";
import { cn } from "@/lib/utils";

const WELCOME = `# Welcome

Write **Markdown** on the left and see it rendered on the right. Your text is saved in this browser automatically.

## Formatting

- **Bold** (Ctrl/⌘+B), *italic* (Ctrl/⌘+I), ~~strikethrough~~, \`inline code\`
- [Links](https://example.com) (Ctrl/⌘+K)
- [x] Task lists

> Blockquotes for callouts.

| Feature | Supported |
| ------- | :-------: |
| Tables  | ✓ |
| GFM     | ✓ |

\`\`\`js
console.log("Code blocks too");
\`\`\`
`;

const doc = createLocalStore<string>("markdown-editor-doc", WELCOME, (r) => (typeof r === "string" ? r : WELCOME));
const layout = createLocalStore<"split" | "write" | "preview">("markdown-editor-layout", "split");

type Action = { icon: typeof Bold; label: string; key?: string; wrap?: [string, string]; line?: string; block?: string };
const ACTIONS: Action[] = [
  { icon: Heading2, label: "Heading", line: "## " },
  { icon: Bold, label: "Bold", key: "b", wrap: ["**", "**"] },
  { icon: Italic, label: "Italic", key: "i", wrap: ["*", "*"] },
  { icon: Strikethrough, label: "Strikethrough", wrap: ["~~", "~~"] },
  { icon: Code, label: "Code", key: "e", wrap: ["`", "`"] },
  { icon: Link2, label: "Link", key: "k", wrap: ["[", "](https://)"] },
  { icon: Quote, label: "Quote", line: "> " },
  { icon: List, label: "Bullet list", line: "- " },
  { icon: ListOrdered, label: "Numbered list", line: "1. " },
  { icon: ListChecks, label: "Task list", line: "- [ ] " },
  { icon: Table, label: "Table", block: "\n| Column | Column |\n| ------ | ------ |\n| Cell   | Cell   |\n" },
];

export default function MarkdownEditor() {
  const mounted = useMounted();
  const [text, setText] = useLocalStore(doc);
  const [view, setView] = useLocalStore(layout);
  const ta = useRef<HTMLTextAreaElement>(null);

  const html = useMemo(() => (mounted ? DOMPurify.sanitize(marked.parse(text, { gfm: true, async: false }) as string) : ""), [text, mounted]);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const apply = (a: Action) => {
    const el = ta.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    let next: string;
    let cs = s;
    let ce = e;
    if (a.wrap) {
      const sel = value.slice(s, e) || a.label.toLowerCase();
      next = value.slice(0, s) + a.wrap[0] + sel + a.wrap[1] + value.slice(e);
      cs = s + a.wrap[0].length;
      ce = cs + sel.length;
    } else if (a.line) {
      // Prefix every selected line.
      const ls = value.lastIndexOf("\n", s - 1) + 1;
      const chunk = value.slice(ls, e).split("\n").map((l) => a.line + l).join("\n");
      next = value.slice(0, ls) + chunk + value.slice(e);
      cs = ls;
      ce = ls + chunk.length;
    } else {
      next = value.slice(0, s) + a.block + value.slice(e);
      cs = ce = s + a.block!.length;
    }
    setText(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(cs, ce); });
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey)) {
      if (e.key === "Tab") { e.preventDefault(); apply({ icon: Code, label: "", block: "  " }); }
      return;
    }
    const a = ACTIONS.find((x) => x.key === e.key.toLowerCase());
    if (a) { e.preventDefault(); apply(a); }
  };

  const htmlDoc = `<!doctype html>\n<html><head><meta charset="utf-8"><title>Document</title></head>\n<body>\n${html}\n</body></html>`;

  return (
    <ToolLayout toolId="markdown-editor">
      <ToolPanel
        title={
          <div className="flex items-center gap-0.5 -ml-1">
            {ACTIONS.map((a) => (
              <Button key={a.label} variant="ghost" size="icon-sm" onClick={() => apply(a)} title={`${a.label}${a.key ? ` (Ctrl/⌘+${a.key.toUpperCase()})` : ""}`} aria-label={a.label} disabled={view === "preview"}>
                <a.icon />
              </Button>
            ))}
          </div>
        }
        actions={
          <>
            <StatusBadge className="hidden md:inline-flex">{words} words</StatusBadge>
            <Segmented size="sm" value={view} onChange={setView} options={[{ value: "write", label: "Write" }, { value: "split", label: "Split" }, { value: "preview", label: "Preview" }]} />
            <CopyButton text={text} iconOnly />
            <DownloadButton content={text} filename="document.md" mime="text/markdown" iconOnly />
            <DownloadButton content={htmlDoc} filename="document.html" mime="text/html" label="HTML" />
            <ClearButton onClick={() => setText("")} iconOnly disabled={!text} />
          </>
        }
      >
        <div className={cn("grid min-h-[560px]", view === "split" && "md:grid-cols-2 md:divide-x divide-border")}>
          {view !== "preview" && (
            <textarea
              ref={ta}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKey}
              spellCheck
              aria-label="Markdown"
              placeholder="Start writing Markdown…"
              className="w-full h-full min-h-[560px] resize-none bg-transparent p-4 font-mono text-[13.5px] leading-relaxed outline-none"
            />
          )}
          {view !== "write" && <div className="md-preview p-5 overflow-auto max-h-[75vh]" dangerouslySetInnerHTML={{ __html: html }} />}
        </div>
      </ToolPanel>
    </ToolLayout>
  );
}

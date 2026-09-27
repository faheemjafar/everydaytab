"use client";

import { useMemo, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CopyButton, StatusBadge, ToolPanel } from "@/components/tool";
import { useMounted } from "@/lib/local-store";

type Entry = { name: string; md: string; note?: string; gfm?: boolean; preview?: false };
const SECTIONS: { title: string; items: Entry[] }[] = [
  { title: "Headings", items: [
    { name: "Heading 1–3", md: "# Heading 1\n## Heading 2\n### Heading 3" },
    { name: "Alternative H1 / H2", md: "Heading 1\n=========\n\nHeading 2\n---------" },
  ] },
  { title: "Text", items: [
    { name: "Bold", md: "**bold text**" },
    { name: "Italic", md: "*italic text*" },
    { name: "Bold italic", md: "***bold and italic***" },
    { name: "Strikethrough", md: "~~deleted~~", gfm: true },
    { name: "Inline code", md: "Use `npm install`" },
    { name: "Line break", md: "First line  \nSecond line", note: "End a line with two spaces or a backslash." },
    { name: "Escaping", md: "\\*not italic\\* and \\# not a heading", note: "Backslash escapes \\ ` * _ { } [ ] ( ) # + - . ! |" },
  ] },
  { title: "Lists", items: [
    { name: "Bullet list", md: "- Apples\n- Oranges\n  - Blood orange" },
    { name: "Numbered list", md: "1. First\n2. Second\n3. Third" },
    { name: "Task list", md: "- [x] Done\n- [ ] To do", gfm: true },
  ] },
  { title: "Links & images", items: [
    { name: "Link", md: "[EverydayTab](https://everydaytab.com)" },
    { name: "Link with title", md: '[Docs](https://example.com "Hover text")' },
    { name: "Reference link", md: "Read the [guide][1].\n\n[1]: https://example.com/guide" },
    { name: "Autolink", md: "<https://example.com>" },
    { name: "Image", md: "![Alt text](https://example.com/image.png)", preview: false, note: "Alt text is shown if the image fails to load and read by screen readers." },
  ] },
  { title: "Blocks", items: [
    { name: "Blockquote", md: "> Quoted text\n>\n> > Nested quote" },
    { name: "Code block", md: "```js\nconst x = 1;\n```", note: "Add a language after the backticks for syntax highlighting." },
    { name: "Horizontal rule", md: "Above\n\n---\n\nBelow" },
    { name: "Table", md: "| Left | Center | Right |\n| :--- | :----: | ----: |\n| a    |   b    |     c |", gfm: true },
  ] },
  { title: "GitHub extras", items: [
    { name: "Alert / callout", md: "> [!NOTE]\n> Useful information.\n\n> [!WARNING]\n> Be careful.", gfm: true, note: "Also [!TIP], [!IMPORTANT] and [!CAUTION]. Rendered on GitHub; shown as quotes elsewhere." },
    { name: "Collapsible section", md: "<details>\n<summary>Click to expand</summary>\n\nHidden content.\n\n</details>" },
    { name: "Footnote", md: "A claim.[^1]\n\n[^1]: The source.", gfm: true, preview: false, note: "Supported on GitHub, GitLab and most static-site generators." },
    { name: "Mention / issue", md: "@octocat fixed #123", gfm: true, preview: false, note: "Linked automatically on GitHub only." },
    { name: "Emoji shortcode", md: ":tada: :rocket:", gfm: true, preview: false, note: "GitHub, Slack and Discord convert shortcodes." },
  ] },
];

export default function MarkdownCheatsheet() {
  const mounted = useMounted();
  const [q, setQ] = useState("");
  const t = q.trim().toLowerCase();
  const sections = useMemo(() => SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => !t || `${s.title} ${i.name} ${i.md} ${i.note ?? ""}`.toLowerCase().includes(t)) })).filter((s) => s.items.length), [t]);
  const render = (md: string) => (mounted ? DOMPurify.sanitize(marked.parse(md, { gfm: true, async: false }) as string) : "");

  return (
    <ToolLayout toolId="markdown-cheatsheet">
      <div className="space-y-3">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search syntax — e.g. table, link, checkbox" className="h-10 max-w-md" autoFocus />
        {sections.map((s) => (
          <ToolPanel key={s.title} title={s.title}>
            <div className="divide-y divide-border">
              {s.items.map((i) => (
                <div key={i.name} className="grid gap-3 p-3 md:grid-cols-[160px_1fr_1fr] items-start">
                  <div className="space-y-1">
                    <p className="text-[13px] font-medium">{i.name}</p>
                    {i.gfm && <StatusBadge>GFM</StatusBadge>}
                  </div>
                  <div className="group relative">
                    <pre className="rounded-md bg-muted/60 px-3 py-2 font-mono text-[12.5px] whitespace-pre-wrap">{i.md}</pre>
                    <CopyButton text={i.md} iconOnly className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 focus:opacity-100" />
                    {i.note && <p className="mt-1 text-[11px] text-muted-foreground">{i.note}</p>}
                  </div>
                  {i.preview === false ? (
                    <p className="text-[11px] text-muted-foreground italic">No live preview</p>
                  ) : (
                    <div className="md-preview text-[13px] rounded-md border border-border px-3 py-2 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: render(i.md) }} />
                  )}
                </div>
              ))}
            </div>
          </ToolPanel>
        ))}
        {!sections.length && <p className="py-8 text-center text-xs text-muted-foreground">Nothing matches “{q}”.</p>}
      </div>
    </ToolLayout>
  );
}

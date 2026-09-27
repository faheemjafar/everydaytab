"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Code, Heading1, Heading2, Italic, Link, List, ListOrdered, Quote, RemoveFormatting, Underline } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { CodeArea, CopyButton, DownloadButton, Segmented, SplitLayout, ToolPanel, Toggle } from "@/components/tool";

const START_HTML = `<h1>Hello, world</h1>
<p>Edit the <strong>HTML</strong> on the left, or switch to <em>Visual</em> mode to format it like a document.</p>
<ul>
  <li>Live preview</li>
  <li>Sandboxed — scripts can't touch this page</li>
</ul>
<button onclick="this.textContent = 'Clicked!'">Click me</button>`;

const START_CSS = `body { font-family: system-ui, sans-serif; line-height: 1.6; padding: 1.5rem; color: #1c1917; }
h1 { color: #0d9488; }
button { padding: .5rem 1rem; border-radius: 6px; border: 1px solid #d6d3d1; background: white; cursor: pointer; }`;

type Mode = "code" | "visual";

/** Light pretty-printer so HTML produced by the visual editor is readable. */
function tidy(html: string) {
  return html
    .replace(/>\s*</g, "><")
    .replace(/<(\/?)(h[1-6]|p|ul|ol|li|blockquote|div|pre|table|tr|thead|tbody|hr)([^>]*)>/gi, (m, close, tag) => (close || /^(ul|ol|table|tr|thead|tbody|blockquote|div)$/i.test(tag) ? `${m}\n` : `\n${m}`))
    .replace(/\n{2,}/g, "\n")
    .trim();
}

const TOOLS: { icon: typeof Bold; label: string; cmd: string; arg?: string }[] = [
  { icon: Heading1, label: "Heading 1", cmd: "formatBlock", arg: "h1" },
  { icon: Heading2, label: "Heading 2", cmd: "formatBlock", arg: "h2" },
  { icon: Bold, label: "Bold", cmd: "bold" },
  { icon: Italic, label: "Italic", cmd: "italic" },
  { icon: Underline, label: "Underline", cmd: "underline" },
  { icon: List, label: "Bulleted list", cmd: "insertUnorderedList" },
  { icon: ListOrdered, label: "Numbered list", cmd: "insertOrderedList" },
  { icon: Quote, label: "Quote", cmd: "formatBlock", arg: "blockquote" },
  { icon: Code, label: "Code block", cmd: "formatBlock", arg: "pre" },
  { icon: RemoveFormatting, label: "Clear formatting", cmd: "removeFormat" },
];

export default function HtmlEditor() {
  const [mode, setMode] = useState<Mode>("code");
  const [html, setHtml] = useState(START_HTML);
  const [css, setCss] = useState(START_CSS);
  const [tab, setTab] = useState<"html" | "css">("html");
  const [scripts, setScripts] = useState(true);
  const visualRef = useRef<HTMLDivElement>(null);

  // Seed the contentEditable only when entering visual mode; afterwards the DOM is the source of truth.
  useEffect(() => {
    if (mode === "visual" && visualRef.current) visualRef.current.innerHTML = html;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const exec = (cmd: string, arg?: string) => {
    visualRef.current?.focus();
    document.execCommand(cmd, false, arg);
    if (visualRef.current) setHtml(tidy(visualRef.current.innerHTML));
  };

  const addLink = () => {
    const url = window.prompt("Link URL", "https://");
    if (url) exec("createLink", url);
  };

  const doc = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`;

  return (
    <ToolLayout toolId="html-editor">
      <div className="space-y-3">
        <ToolPanel bodyClassName="p-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <Segmented value={mode} onChange={setMode} options={[{ value: "code", label: "Code" }, { value: "visual", label: "Visual (WYSIWYG)" }]} />
          {mode === "code" && <Toggle label="Run scripts in preview" checked={scripts} onChange={setScripts} />}
          <span className="flex-1" />
          <CopyButton text={html} label="Copy HTML" />
          <DownloadButton content={doc} filename="page.html" mime="text/html" label="Download page" />
        </ToolPanel>

        {mode === "code" ? (
          <SplitLayout>
            <ToolPanel title={<Segmented size="sm" value={tab} onChange={setTab} options={[{ value: "html", label: "HTML" }, { value: "css", label: "CSS" }]} />}>
              {tab === "html" ? <CodeArea value={html} onChange={(e) => setHtml(e.target.value)} minHeight={460} /> : <CodeArea value={css} onChange={(e) => setCss(e.target.value)} minHeight={460} />}
            </ToolPanel>
            <ToolPanel title="Preview">
              {/* No allow-same-origin: scripts run isolated from this page. */}
              <iframe title="Preview" srcDoc={doc} sandbox={scripts ? "allow-scripts allow-modals" : ""} className="w-full h-[500px] bg-white" />
            </ToolPanel>
          </SplitLayout>
        ) : (
          <SplitLayout>
            <ToolPanel
              title="Visual editor"
              actions={
                <div className="flex flex-wrap gap-0.5">
                  {TOOLS.map((t) => (
                    <Button key={t.label} variant="ghost" size="icon-sm" title={t.label} aria-label={t.label} onMouseDown={(e) => e.preventDefault()} onClick={() => exec(t.cmd, t.arg ? `<${t.arg}>` : undefined)}>
                      <t.icon />
                    </Button>
                  ))}
                  <Button variant="ghost" size="icon-sm" title="Link" aria-label="Link" onMouseDown={(e) => e.preventDefault()} onClick={addLink}>
                    <Link />
                  </Button>
                </div>
              }
            >
              <div
                ref={visualRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => setHtml(tidy(e.currentTarget.innerHTML))}
                className="md-preview min-h-[460px] px-4 py-3 outline-none"
              />
            </ToolPanel>
            <ToolPanel title="HTML source">
              <CodeArea value={html} readOnly minHeight={460} />
            </ToolPanel>
          </SplitLayout>
        )}
      </div>
    </ToolLayout>
  );
}

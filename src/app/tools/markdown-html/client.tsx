"use client";

import { useMemo, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { ToolLayout } from "@/components/tool-layout";
import { CodeArea, Segmented, TextTransform, Toggle } from "@/components/tool";
import { useMounted } from "@/lib/local-store";

const SAMPLE = `# Project title

A short description with **bold**, *italic* and \`inline code\`.

## Features

- Live preview
- GitHub-flavoured Markdown
- [x] Task lists

| Option | Default |
| ------ | ------- |
| gfm    | true    |

\`\`\`js
console.log("Hello");
\`\`\`

> Output is sanitised with DOMPurify.`;

export default function MarkdownToHTML() {
  const mounted = useMounted();
  const [input, setInput] = useState("");
  const [view, setView] = useState<"preview" | "html">("preview");
  const [gfm, setGfm] = useState(true);
  const [breaks, setBreaks] = useState(false);
  const [sanitize, setSanitize] = useState(true);

  // DOMPurify needs a DOM, so render only in the browser.
  const html = useMemo(() => {
    if (!mounted || !input) return "";
    const raw = marked.parse(input, { gfm, breaks, async: false }) as string;
    return sanitize ? DOMPurify.sanitize(raw) : raw;
  }, [input, gfm, breaks, sanitize, mounted]);

  // The preview is always sanitised, even when the copied HTML isn't.
  const safePreview = useMemo(() => (mounted && html ? DOMPurify.sanitize(html) : ""), [html, mounted]);

  return (
    <ToolLayout toolId="markdown-html">
      <TextTransform
        input={input}
        onInput={setInput}
        output={html}
        sample={SAMPLE}
        inputLabel="Markdown"
        outputLabel="HTML"
        filename="converted.html"
        placeholder="Write or paste Markdown…"
        outputNode={
          <div>
            <div className="px-3 pt-2">
              <Segmented size="sm" value={view} onChange={setView} options={[{ value: "preview", label: "Preview" }, { value: "html", label: "HTML source" }]} />
            </div>
            {view === "preview" ? (
              <div className="md-preview px-4 py-3 min-h-[280px] max-h-[640px] overflow-auto custom-scrollbar" dangerouslySetInnerHTML={{ __html: safePreview }} />
            ) : (
              <CodeArea value={html} readOnly minHeight={280} />
            )}
          </div>
        }
        options={
          <>
            <Toggle label="GitHub-flavoured (tables, task lists)" checked={gfm} onChange={setGfm} />
            <Toggle label="Line breaks → <br>" checked={breaks} onChange={setBreaks} />
            <Toggle label="Sanitise HTML output" checked={sanitize} onChange={setSanitize} hint="Removes scripts and event handlers (XSS protection)" />
          </>
        }
      />
    </ToolLayout>
  );
}

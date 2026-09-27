"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { CodeArea, CopyButton, DownloadButton, Field, FileDropzone, FileList, FileListItem, OptionsLayout, Segmented, StatusBadge, ToolPanel, Toggle } from "@/components/tool";

interface MdFile { id: number; name: string; content: string }
type Sep = "rule" | "blank" | "pagebreak";
const SEPS: Record<Sep, string> = { rule: "\n\n---\n\n", blank: "\n\n", pagebreak: '\n\n<div style="page-break-after: always"></div>\n\n' };

let nid = 1;
const slug = (s: string) => s.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
const title = (name: string) => name.replace(/\.(md|markdown|mdx|txt)$/i, "").replace(/[-_]+/g, " ").replace(/^\d+\s*/, "").replace(/\b\w/g, (c) => c.toUpperCase());

/** Shift every ATX heading down by n levels (max ######), skipping fenced code. */
function demote(md: string, n: number) {
  if (!n) return md;
  let fence = false;
  return md.split("\n").map((l) => {
    if (/^\s*(```|~~~)/.test(l)) fence = !fence;
    return !fence && /^#{1,6}\s/.test(l) ? "#".repeat(Math.min(6, l.match(/^#+/)![0].length + n)) + l.replace(/^#+/, "") : l;
  }).join("\n");
}

export default function CombineMarkdown() {
  const [files, setFiles] = useState<MdFile[]>([]);
  const [sep, setSep] = useState<Sep>("rule");
  const [headings, setHeadings] = useState(true);
  const [shift, setShift] = useState(false);
  const [toc, setToc] = useState(false);
  const [stripFront, setStripFront] = useState(true);

  const add = async (list: File[]) => {
    const read = await Promise.all(list.map(async (f) => ({ id: nid++, name: f.name, content: await f.text() })));
    // Natural sort (01-intro, 02-setup, 10-faq) so numbered chapters land in order.
    setFiles((cur) => [...cur, ...read.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))]);
  };
  const move = (i: number, d: -1 | 1) => setFiles((f) => { const j = i + d; if (j < 0 || j >= f.length) return f; const n = [...f]; [n[i], n[j]] = [n[j], n[i]]; return n; });

  const parts = files.map((f) => {
    let body = stripFront ? f.content.replace(/^---\n[\s\S]*?\n---\n+/, "") : f.content;
    body = demote(body.trim(), shift && headings ? 1 : 0);
    return headings ? `# ${title(f.name)}\n\n${body}` : body;
  });
  const tocMd = toc && headings ? `## Contents\n\n${files.map((f) => `- [${title(f.name)}](#${slug(title(f.name))})`).join("\n")}\n\n---\n\n` : "";
  const out = files.length ? tocMd + parts.join(SEPS[sep]) + "\n" : "";

  const options = (
    <ToolPanel title="Options" bodyClassName="p-3 space-y-3">
      <Field label="Between files"><Segmented size="sm" value={sep} onChange={setSep} options={[{ value: "rule", label: "--- rule" }, { value: "blank", label: "Blank line" }, { value: "pagebreak", label: "Page break" }]} /></Field>
      <Toggle label="Add a heading from each filename" checked={headings} onChange={setHeadings} />
      {headings && <Toggle label="Demote headings inside files (# → ##)" checked={shift} onChange={setShift} />}
      {headings && <Toggle label="Table of contents" checked={toc} onChange={setToc} />}
      <Toggle label="Remove YAML front matter" checked={stripFront} onChange={setStripFront} />
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="combine-markdown">
      <OptionsLayout options={options}>
        <FileDropzone onFiles={add} accept=".md,.markdown,.mdx,.txt,text/markdown,text/plain" multiple size={files.length ? "sm" : "lg"} title={files.length ? "Add more files" : "Drop Markdown files here or click to browse"} hint="Files are sorted by name (01-, 02-…); reorder below." />
        {files.length > 0 && (
          <FileList>
            {files.map((f, i) => (
              <FileListItem key={f.id} index={i} name={f.name} icon={<FileText />} meta={`${f.content.split(/\s+/).filter(Boolean).length} words`} onMoveUp={i ? () => move(i, -1) : undefined} onMoveDown={i < files.length - 1 ? () => move(i, 1) : undefined} onRemove={() => setFiles((x) => x.filter((y) => y.id !== f.id))} />
            ))}
          </FileList>
        )}
        {out && (
          <ToolPanel title="Combined" actions={<><StatusBadge>{files.length} files · {out.split(/\s+/).filter(Boolean).length} words</StatusBadge><CopyButton text={out} iconOnly /><DownloadButton content={out} filename="combined.md" mime="text/markdown" /></>}>
            <CodeArea value={out} readOnly minHeight={320} />
          </ToolPanel>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}

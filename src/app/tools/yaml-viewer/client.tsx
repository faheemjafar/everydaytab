"use client";

import { useMemo, useState } from "react";
import yaml from "js-yaml";
import { ToolLayout } from "@/components/tool-layout";
import { Field, JsonTree, Segmented, StatusBadge, TextTransform, Toggle } from "@/components/tool";

const SAMPLE = `# docker-compose style example
version: "3.9"
services:
  web:
    image: nginx:1.27
    ports: ["80:80", "443:443"]
    depends_on: [api]
  api:
    build: ./api
    environment:
      DATABASE_URL: postgres://db/app
      LOG_LEVEL: info
    deploy: { replicas: 2 }`;

export default function YAMLViewer() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<"2" | "4">("2");
  const [sortKeys, setSortKeys] = useState(false);
  const [view, setView] = useState<"yaml" | "tree">("yaml");
  const [, setPath] = useState<string | null>(null);

  const { value, output, error } = useMemo(() => {
    if (!input.trim()) return { value: undefined, output: "", error: null };
    try {
      const v = yaml.load(input);
      return { value: v, output: yaml.dump(v, { indent: Number(indent), sortKeys, lineWidth: 120, noRefs: true }), error: null };
    } catch (e) {
      const err = e as yaml.YAMLException;
      return { value: undefined, output: "", error: err.mark ? `Line ${err.mark.line + 1}, column ${err.mark.column + 1}: ${err.reason}` : err.message };
    }
  }, [input, indent, sortKeys]);

  return (
    <ToolLayout toolId="yaml-viewer">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        error={error}
        sample={SAMPLE}
        inputLabel="YAML"
        outputLabel="Formatted"
        filename="formatted.yaml"
        outputNode={view === "tree" && value !== undefined ? <div className="max-h-[480px] overflow-auto custom-scrollbar"><JsonTree data={value} onPath={setPath} /></div> : undefined}
        options={
          <>
            {input.trim() && <StatusBadge tone={error ? "error" : "success"}>{error ? "Invalid YAML" : "Valid YAML"}</StatusBadge>}
            <Field label="View">
              <Segmented size="sm" value={view} onChange={setView} options={[{ value: "yaml", label: "Formatted" }, { value: "tree", label: "Tree" }]} />
            </Field>
            <Field label="Indent">
              <Segmented size="sm" value={indent} onChange={setIndent} options={[{ value: "2", label: "2" }, { value: "4", label: "4" }]} />
            </Field>
            <Toggle label="Sort keys" checked={sortKeys} onChange={setSortKeys} />
            <p className="text-[11px] text-muted-foreground">Formatting normalises quoting and drops comments.</p>
          </>
        }
      />
    </ToolLayout>
  );
}

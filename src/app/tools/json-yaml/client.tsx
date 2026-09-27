"use client";

import { useMemo, useState } from "react";
import yaml from "js-yaml";
import { ArrowLeftRight } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Field, Segmented, TextTransform, Toggle } from "@/components/tool";

type Dir = "json-yaml" | "yaml-json";

const SAMPLE_JSON = `{\n  "service": "api",\n  "replicas": 3,\n  "ports": [80, 443],\n  "env": { "NODE_ENV": "production", "DEBUG": false },\n  "healthcheck": { "path": "/health", "interval": "30s" }\n}`;
const SAMPLE_YAML = `service: api\nreplicas: 3\nports:\n  - 80\n  - 443\nenv:\n  NODE_ENV: production\n  DEBUG: false   # comments are allowed in YAML\nhealthcheck:\n  path: /health\n  interval: 30s`;

export default function JSONYAMLConverter() {
  const [dir, setDir] = useState<Dir>("json-yaml");
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<"2" | "4">("2");
  const [sortKeys, setSortKeys] = useState(false);
  const [multiDoc, setMultiDoc] = useState(false);

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: null };
    try {
      if (dir === "json-yaml") return { output: yaml.dump(JSON.parse(input), { indent: Number(indent), sortKeys, lineWidth: 120, noRefs: true }), error: null };
      // Multi-document YAML (---) becomes a JSON array.
      const docs = multiDoc ? yaml.loadAll(input) : [yaml.load(input)];
      return { output: JSON.stringify(multiDoc ? docs : docs[0], null, Number(indent)), error: null };
    } catch (e) {
      return { output: "", error: (e as Error).message };
    }
  }, [input, dir, indent, sortKeys, multiDoc]);

  return (
    <ToolLayout toolId="json-yaml">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        error={error}
        sample={dir === "json-yaml" ? SAMPLE_JSON : SAMPLE_YAML}
        inputLabel={dir === "json-yaml" ? "JSON" : "YAML"}
        outputLabel={dir === "json-yaml" ? "YAML" : "JSON"}
        filename={dir === "json-yaml" ? "converted.yaml" : "converted.json"}
        options={
          <>
            <Segmented value={dir} onChange={(d) => { setDir(d); setInput(output); }} options={[{ value: "json-yaml", label: "JSON → YAML" }, { value: "yaml-json", label: "YAML → JSON" }]} />
            <Button variant="ghost" size="icon" onClick={() => { setDir(dir === "json-yaml" ? "yaml-json" : "json-yaml"); setInput(output); }} aria-label="Swap" title="Swap">
              <ArrowLeftRight />
            </Button>
            <Field label="Indent">
              <Segmented size="sm" value={indent} onChange={setIndent} options={[{ value: "2", label: "2" }, { value: "4", label: "4" }]} />
            </Field>
            {dir === "json-yaml" ? <Toggle label="Sort keys" checked={sortKeys} onChange={setSortKeys} /> : <Toggle label="Multiple documents (---)" checked={multiDoc} onChange={setMultiDoc} />}
          </>
        }
      />
    </ToolLayout>
  );
}

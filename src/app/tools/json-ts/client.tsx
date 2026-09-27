"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Field, JsonCodegen, Segmented, Toggle, parseJsonInput } from "@/components/tool";
import { inferRoot, pascal, toTypeScript } from "@/lib/json-types";

const SAMPLE = `{
  "id": 42,
  "name": "Ada",
  "createdAt": "2024-03-01T10:00:00Z",
  "tags": ["admin", "beta"],
  "address": { "city": "London", "postcode": null },
  "orders": [
    { "id": 1, "total": 19.99, "items": 2 },
    { "id": 2, "total": 5, "coupon": "SPRING" }
  ]
}`;

export default function JSONToTypeScript() {
  const [input, setInput] = useState("");
  const [name, setName] = useState("Root");
  const [style, setStyle] = useState<"interface" | "type">("interface");
  const [optionalNull, setOptionalNull] = useState(false);
  const [readonly, setReadonly] = useState(false);
  const [exportTypes, setExportTypes] = useState(true);

  const { output, error } = useMemo(() => {
    const p = parseJsonInput(input);
    if (p.error || p.value === undefined) return { output: "", error: p.error };
    return { output: toTypeScript(inferRoot(p.value, pascal(name) || "Root"), { style, optionalNull, readonly, exportTypes }), error: null };
  }, [input, name, style, optionalNull, readonly, exportTypes]);

  return (
    <ToolLayout toolId="json-ts">
      <JsonCodegen
        input={input}
        onInput={setInput}
        output={output}
        error={error}
        sample={SAMPLE}
        outputLabel="TypeScript"
        filename="types.ts"
        options={
          <>
            <Field label="Root name" htmlFor="rn">
              <Input id="rn" value={name} onChange={(e) => setName(e.target.value)} className="w-36 font-mono" />
            </Field>
            <Field label="Declare as">
              <Segmented size="sm" value={style} onChange={setStyle} options={[{ value: "interface", label: "interface" }, { value: "type", label: "type" }]} />
            </Field>
            <Toggle label="export" checked={exportTypes} onChange={setExportTypes} />
            <Toggle label="readonly" checked={readonly} onChange={setReadonly} />
            <Toggle label="null → optional (?)" checked={optionalNull} onChange={setOptionalNull} />
          </>
        }
      />
    </ToolLayout>
  );
}

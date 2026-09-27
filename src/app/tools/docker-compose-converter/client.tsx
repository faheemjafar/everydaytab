"use client";

import { useMemo, useState } from "react";
import composerize from "composerize";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Field, Segmented, TextTransform } from "@/components/tool";

const SAMPLE = `docker run -d --name web -p 80:80 -p 443:443 \\
  -v ./site:/usr/share/nginx/html:ro \\
  --restart unless-stopped nginx:1.27

docker run -d --name db \\
  -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=app \\
  -v pgdata:/var/lib/postgresql/data \\
  --health-cmd "pg_isready -U postgres" postgres:16`;

/** Splits input into individual `docker run` commands (handles \\ continuations). */
const commands = (s: string) =>
  s
    .replace(/\\\r?\n/g, " ")
    .split(/\n|(?=\bdocker\s+(?:container\s+)?run\b)/)
    .map((c) => c.replace(/\s+/g, " ").trim())
    .filter((c) => /^(sudo\s+)?docker\s+(container\s+)?run\b/.test(c))
    .map((c) => c.replace(/^sudo\s+/, "").replace(/^docker container run/, "docker run"));

export default function DockerComposeConverter() {
  const [input, setInput] = useState("");
  const [project, setProject] = useState("myapp");
  const [indent, setIndent] = useState<"2" | "4">("2");

  const { output, error, count } = useMemo(() => {
    if (!input.trim()) return { output: "", error: null, count: 0 };
    const cmds = commands(input);
    if (!cmds.length) return { output: "", error: "No `docker run` commands found.", count: 0 };
    try {
      // Feed each command the compose built so far, so services merge into one file.
      const yaml = cmds.reduce((acc, c) => composerize(c, acc, "latest", Number(indent)), "");
      return { output: yaml.replace("<your project name>", project || "myapp"), error: null, count: cmds.length };
    } catch (e) {
      return { output: "", error: (e as Error).message || "Couldn't convert that command.", count: 0 };
    }
  }, [input, project, indent]);

  return (
    <ToolLayout toolId="docker-compose-converter">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        error={error}
        sample={SAMPLE}
        inputLabel="docker run commands"
        outputLabel={`compose.yaml${count > 1 ? ` · ${count} services` : ""}`}
        filename="compose.yaml"
        placeholder="docker run -d -p 8080:80 --name web nginx"
        options={
          <>
            <Field label="Project name" htmlFor="pn">
              <Input id="pn" value={project} onChange={(e) => setProject(e.target.value.replace(/[^a-z0-9_-]/gi, "").toLowerCase())} className="w-36 font-mono" />
            </Field>
            <Field label="Indent">
              <Segmented size="sm" value={indent} onChange={setIndent} options={[{ value: "2", label: "2" }, { value: "4", label: "4" }]} />
            </Field>
            <p className="text-[11px] text-muted-foreground">Paste several commands to build a multi-service compose file. Save it as compose.yaml and run <code className="font-mono">docker compose up -d</code>.</p>
          </>
        }
      />
    </ToolLayout>
  );
}

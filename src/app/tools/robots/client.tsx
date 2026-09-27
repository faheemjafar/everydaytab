"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CodeArea, CodeOutput, Field, OptionsLayout, ToolPanel, Toggle } from "@/components/tool";

interface Group { id: number; agents: string; allow: string; disallow: string; delay: string }

const AI_BOTS = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "anthropic-ai", "Google-Extended", "PerplexityBot", "CCBot", "Bytespider", "Applebot-Extended", "meta-externalagent", "Amazonbot", "cohere-ai"];

const PRESETS: Record<string, { label: string; groups: Omit<Group, "id">[] }> = {
  allow: { label: "Allow everything", groups: [{ agents: "*", allow: "", disallow: "", delay: "" }] },
  common: { label: "Typical website", groups: [{ agents: "*", allow: "", disallow: "/admin/\n/api/\n/cart\n/checkout\n/search\n/*?*sort=", delay: "" }] },
  wordpress: { label: "WordPress", groups: [{ agents: "*", allow: "/wp-admin/admin-ajax.php", disallow: "/wp-admin/\n/?s=\n/search/", delay: "" }] },
  block: { label: "Block everything (staging)", groups: [{ agents: "*", allow: "", disallow: "/", delay: "" }] },
};

let nid = 1;
const withIds = (g: Omit<Group, "id">[]) => g.map((x) => ({ ...x, id: nid++ }));
const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean).map((p) => (p.startsWith("/") || p.startsWith("*") ? p : `/${p}`));

export default function RobotsGenerator() {
  const [groups, setGroups] = useState<Group[]>(() => withIds(PRESETS.common.groups));
  const [sitemaps, setSitemaps] = useState("https://example.com/sitemap.xml");
  const [blockAI, setBlockAI] = useState(false);
  const [testPath, setTestPath] = useState("/admin/users");

  const upd = (id: number, patch: Partial<Group>) => setGroups((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)));

  const out = [
    ...groups.map((g) =>
      [
        ...g.agents.split(/[,\n]/).map((a) => a.trim()).filter(Boolean).map((a) => `User-agent: ${a}`),
        ...lines(g.allow).map((p) => `Allow: ${p}`),
        ...lines(g.disallow).map((p) => `Disallow: ${p}`),
        ...(g.disallow.trim() || g.allow.trim() ? [] : ["Disallow:"]),
        ...(g.delay ? [`Crawl-delay: ${g.delay}`] : []),
      ].join("\n")
    ),
    ...(blockAI ? [`# AI training / answer-engine crawlers\n${AI_BOTS.map((b) => `User-agent: ${b}`).join("\n")}\nDisallow: /`] : []),
    sitemaps.split("\n").map((s) => s.trim()).filter(Boolean).map((s) => `Sitemap: ${s}`).join("\n"),
  ].filter(Boolean).join("\n\n");

  // Longest-match rule evaluation for the "*" group, like Google does.
  const star = groups.find((g) => g.agents.split(/[,\n]/).map((a) => a.trim()).includes("*"));
  const rules = star ? [...lines(star.allow).map((p) => ({ p, allow: true })), ...lines(star.disallow).map((p) => ({ p, allow: false }))] : [];
  const toRe = (p: string) => new RegExp(`^${p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$")}`);
  const matching = rules.filter((r) => toRe(r.p).test(testPath)).sort((a, b) => b.p.length - a.p.length || Number(b.allow) - Number(a.allow));
  const verdict = matching[0] ? matching[0].allow : true;

  const options = (
    <ToolPanel title="Presets" bodyClassName="p-3 space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(PRESETS).map(([k, p]) => (
          <Button key={k} variant="outline" size="sm" onClick={() => setGroups(withIds(p.groups))}>{p.label}</Button>
        ))}
      </div>
      <Toggle label={`Block AI crawlers (${AI_BOTS.length})`} checked={blockAI} onChange={setBlockAI} hint={AI_BOTS.join(", ")} />
      <Field label="Sitemap URLs (one per line)" htmlFor="sm">
        <CodeArea id="sm" value={sitemaps} onChange={(e) => setSitemaps(e.target.value)} minHeight={60} />
      </Field>
      <Field label="Test a path (User-agent: *)" htmlFor="tp">
        <Input id="tp" value={testPath} onChange={(e) => setTestPath(e.target.value)} className="font-mono" />
      </Field>
      <p className={verdict ? "text-xs font-medium text-emerald-600 dark:text-emerald-400" : "text-xs font-medium text-destructive"}>
        {verdict ? "Allowed" : "Blocked"}{matching[0] ? ` by “${matching[0].allow ? "Allow" : "Disallow"}: ${matching[0].p}”` : " (no matching rule)"}
      </p>
      <p className="text-[11px] text-muted-foreground">robots.txt controls crawling, not indexing — use a noindex meta tag to keep a page out of results.</p>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="robots">
      <OptionsLayout options={options}>
        {groups.map((g) => (
          <ToolPanel
            key={g.id}
            title="Rule group"
            actions={groups.length > 1 && <Button variant="ghost" size="icon-sm" onClick={() => setGroups((gs) => gs.filter((x) => x.id !== g.id))} aria-label="Remove group" className="text-muted-foreground hover:text-destructive"><Trash2 /></Button>}
            bodyClassName="p-3 grid gap-3 sm:grid-cols-2"
          >
            <Field label="User-agent(s)" hint="* for all, or e.g. Googlebot" htmlFor={`ua${g.id}`}><Input id={`ua${g.id}`} value={g.agents} onChange={(e) => upd(g.id, { agents: e.target.value })} className="font-mono" /></Field>
            <Field label="Crawl-delay (s)" hint="Ignored by Google" htmlFor={`cd${g.id}`}><Input id={`cd${g.id}`} value={g.delay} onChange={(e) => upd(g.id, { delay: e.target.value.replace(/[^\d.]/g, "") })} className="font-mono w-24" /></Field>
            <Field label="Disallow (one path per line)" htmlFor={`d${g.id}`}><CodeArea id={`d${g.id}`} value={g.disallow} onChange={(e) => upd(g.id, { disallow: e.target.value })} minHeight={100} /></Field>
            <Field label="Allow (exceptions)" htmlFor={`a${g.id}`}><CodeArea id={`a${g.id}`} value={g.allow} onChange={(e) => upd(g.id, { allow: e.target.value })} minHeight={100} /></Field>
          </ToolPanel>
        ))}
        <Button variant="outline" size="sm" onClick={() => setGroups((gs) => [...gs, ...withIds([{ agents: "Googlebot", allow: "", disallow: "", delay: "" }])])}><Plus /> Add user-agent group</Button>
        <CodeOutput title="robots.txt" tabs={[{ id: "txt", label: "robots.txt", code: out }]} />
      </OptionsLayout>
    </ToolLayout>
  );
}

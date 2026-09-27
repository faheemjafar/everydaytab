"use client";

import { useMemo, useState } from "react";
import { RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { CopyButton, Field, OptionsLayout, PrivacyNote, Segmented, ToolPanel } from "@/components/tool";
import { cn } from "@/lib/utils";

const SETS = {
  upper: { label: "Uppercase", sub: "A–Z", chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
  lower: { label: "Lowercase", sub: "a–z", chars: "abcdefghijklmnopqrstuvwxyz" },
  digits: { label: "Numbers", sub: "0–9", chars: "0123456789" },
  symbols: { label: "Symbols", sub: "!@#$%…", chars: "!@#$%^&*()_+-=[]{}|;:,.<>?" },
} as const;
type SetKey = keyof typeof SETS;
const AMBIGUOUS = /[Il1O0o|`'"]/g;

function generate(length: number, sets: Set<SetKey>, excludeAmbiguous: boolean): string {
  let chars = Array.from(sets)
    .map((k) => SETS[k].chars)
    .join("");
  if (excludeAmbiguous) chars = chars.replace(AMBIGUOUS, "");
  if (!chars) return "";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

function entropyBits(length: number, sets: Set<SetKey>, excludeAmbiguous: boolean) {
  let chars = Array.from(sets).map((k) => SETS[k].chars).join("");
  if (excludeAmbiguous) chars = chars.replace(AMBIGUOUS, "");
  return chars.length ? Math.round(length * Math.log2(chars.length)) : 0;
}

function strength(bits: number) {
  if (bits < 40) return { label: "Very weak", tone: "bg-destructive", pct: 15 };
  if (bits < 60) return { label: "Weak", tone: "bg-orange-500", pct: 35 };
  if (bits < 80) return { label: "Fair", tone: "bg-amber-500", pct: 55 };
  if (bits < 110) return { label: "Strong", tone: "bg-emerald-500", pct: 80 };
  return { label: "Very strong", tone: "bg-primary", pct: 100 };
}

export default function PasswordGenerator() {
  const [length, setLength] = useState(20);
  const [sets, setSets] = useState<Set<SetKey>>(new Set(["upper", "lower", "digits", "symbols"]));
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [count, setCount] = useState<"1" | "5" | "10">("1");
  // Regenerated whenever an option changes; seed bumps on "Regenerate".
  const [seed, setSeed] = useState(0);
  const passwords = useMemo(
    () => Array.from({ length: Number(count) }, () => generate(length, sets, excludeAmbiguous)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [length, sets, excludeAmbiguous, count, seed]
  );
  const regenerate = () => setSeed((s) => s + 1);

  const toggleSet = (k: SetKey) =>
    setSets((prev) => {
      const next = new Set(prev);
      if (next.has(k)) {
        if (next.size === 1) return prev;
        next.delete(k);
      } else next.add(k);
      return next;
    });

  const bits = entropyBits(length, sets, excludeAmbiguous);
  const s = strength(bits);

  const options = (
    <ToolPanel title="Options" bodyClassName="p-3 space-y-4">
      <Field label={`Length — ${length}`}>
        <Slider min={4} max={128} step={1} value={[length]} onValueChange={(v) => setLength(v[0])} />
        <div className="flex gap-1 mt-2">
          {[12, 16, 24, 32, 64].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setLength(v)}
              className={cn(
                "flex-1 h-6 rounded-sm text-[11px] font-mono border transition-colors",
                length === v ? "border-foreground bg-muted" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </Field>

      <div className="space-y-2.5">
        {(Object.keys(SETS) as SetKey[]).map((k) => (
          <Field key={k} label={SETS[k].label} hint={SETS[k].sub} inline>
            <Switch checked={sets.has(k)} onCheckedChange={() => toggleSet(k)} />
          </Field>
        ))}
        <Field label="Exclude ambiguous" hint="I l 1 O 0 o | ` ' &quot;" inline>
          <Switch checked={excludeAmbiguous} onCheckedChange={setExcludeAmbiguous} />
        </Field>
      </div>

      <Field label="How many" inline>
        <Segmented
          size="sm"
          value={count}
          onChange={setCount}
          options={[
            { value: "1", label: "1" },
            { value: "5", label: "5" },
            { value: "10", label: "10" },
          ]}
        />
      </Field>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="password-generator">
      <OptionsLayout options={options}>
        <ToolPanel
          title="Password"
          actions={
            <>
              <Button variant="ghost" size="sm" onClick={regenerate}>
                <RefreshCw /> Regenerate
              </Button>
              <CopyButton text={passwords.join("\n")} label={passwords.length > 1 ? "Copy all" : "Copy"} />
            </>
          }
          footer={
            <div className="flex items-center gap-3 w-full">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                {bits < 60 ? <ShieldAlert className="w-3.5 h-3.5 text-destructive" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                {s.label}
              </div>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-48">
                <div className={cn("h-full rounded-full transition-all", s.tone)} style={{ width: `${s.pct}%` }} />
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums">{bits} bits</span>
              <span className="flex-1" />
              <PrivacyNote>Generated with crypto.getRandomValues — never leaves this tab.</PrivacyNote>
            </div>
          }
        >
          <ul className="divide-y divide-border">
            {passwords.map((p, i) => (
              <li key={i} className="group flex items-center gap-3 px-3.5 min-h-12 py-2">
                <code className={cn("flex-1 font-mono break-all leading-relaxed", passwords.length === 1 ? "text-lg" : "text-sm")}>
                  {Array.from(p).map((ch, j) => (
                    <span
                      key={j}
                      className={cn(
                        /\d/.test(ch) && "text-sky-600 dark:text-sky-400",
                        /[^A-Za-z0-9]/.test(ch) && "text-rose-600 dark:text-rose-400"
                      )}
                    >
                      {ch}
                    </span>
                  ))}
                </code>
                <CopyButton text={p} iconOnly className={cn(passwords.length > 1 && "opacity-0 group-hover:opacity-100")} />
              </li>
            ))}
          </ul>
        </ToolPanel>
      </OptionsLayout>
    </ToolLayout>
  );
}

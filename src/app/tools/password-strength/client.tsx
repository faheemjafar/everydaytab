"use client";

import { useMemo, useState } from "react";
import zxcvbn from "zxcvbn";
import { Eye, EyeOff, Lightbulb, TriangleAlert } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PrivacyNote, StatusBadge, ToolPanel } from "@/components/tool";
import { cn } from "@/lib/utils";

const LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
const BAR = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"];
const PATTERN: Record<string, string> = { dictionary: "Dictionary word", spatial: "Keyboard pattern", repeat: "Repetition", sequence: "Sequence", regex: "Common pattern", date: "Date", bruteforce: "Random characters" };

export default function PasswordStrengthAnalyzer() {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const r = useMemo(() => (pw ? zxcvbn(pw.slice(0, 100)) : null), [pw]);

  const charset = pw ? [/[a-z]/.test(pw) && 26, /[A-Z]/.test(pw) && 26, /\d/.test(pw) && 10, /[^A-Za-z0-9]/.test(pw) && 33].filter(Boolean).reduce((a, b) => (a as number) + (b as number), 0) as number : 0;
  const entropy = pw ? Math.log2(charset || 1) * Array.from(pw).length : 0;

  const scenarios: [string, string, string][] = r
    ? [
        ["Online, rate-limited", "100 guesses/hour", String(r.crack_times_display.online_throttling_100_per_hour)],
        ["Online, not rate-limited", "10 guesses/second", String(r.crack_times_display.online_no_throttling_10_per_second)],
        ["Offline, slow hash (bcrypt)", "10k guesses/second", String(r.crack_times_display.offline_slow_hashing_1e4_per_second)],
        ["Offline, fast hash (MD5, GPU)", "10B guesses/second", String(r.crack_times_display.offline_fast_hashing_1e10_per_second)],
      ]
    : [];

  return (
    <ToolLayout toolId="password-strength">
      <div className="space-y-3 max-w-3xl">
        <ToolPanel bodyClassName="p-3.5 space-y-3" footer={<PrivacyNote>Checked entirely in your browser — the password is never sent or stored.</PrivacyNote>}>
          <div className="flex gap-1.5">
            <Input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Type a password to test" autoComplete="off" spellCheck={false} className="h-12 text-lg font-mono" autoFocus />
            <Button variant="ghost" size="icon" className="h-12 w-12" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff /> : <Eye />}</Button>
          </div>
          <div className="grid grid-cols-5 gap-1" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className={cn("h-1.5 rounded-full", r && i <= r.score ? BAR[r.score] : "bg-muted")} />
            ))}
          </div>
          {r && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold">{LABELS[r.score]}</span>
              <StatusBadge>~10^{r.guesses_log10.toFixed(1)} guesses</StatusBadge>
              <StatusBadge>{Array.from(pw).length} characters</StatusBadge>
              <StatusBadge>{Math.round(entropy)} bits (naive)</StatusBadge>
            </div>
          )}
        </ToolPanel>

        {r && (
          <>
            {(r.feedback.warning || r.feedback.suggestions.length > 0) && (
              <ToolPanel bodyClassName="p-3.5 space-y-2">
                {r.feedback.warning && <p className="flex items-start gap-2 text-sm text-destructive"><TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />{r.feedback.warning}</p>}
                {r.feedback.suggestions.map((s) => <p key={s} className="flex items-start gap-2 text-sm text-muted-foreground"><Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />{s}</p>)}
              </ToolPanel>
            )}
            <ToolPanel title="Time to crack">
              <ul className="divide-y divide-border">
                {scenarios.map(([k, rate, t]) => (
                  <li key={k} className="flex items-center gap-3 px-3.5 h-11">
                    <div className="flex-1 min-w-0"><p className="text-[13px]">{k}</p><p className="text-[11px] text-muted-foreground">{rate}</p></div>
                    <span className="font-medium text-sm">{t}</span>
                  </li>
                ))}
              </ul>
            </ToolPanel>
            <ToolPanel title="What an attacker would try">
              <div className="p-3 flex flex-wrap gap-1.5">
                {r.sequence.map((m, i) => (
                  <span key={i} className="inline-flex flex-col rounded-md border border-border px-2 py-1">
                    <code className="font-mono text-sm">{show ? m.token : "•".repeat(m.token.length)}</code>
                    <span className="text-[10px] text-muted-foreground">{PATTERN[m.pattern] ?? m.pattern}{(m as { l33t?: boolean }).l33t ? " (l33t)" : ""}{(m as { reversed?: boolean }).reversed ? " (reversed)" : ""}</span>
                  </span>
                ))}
              </div>
            </ToolPanel>
          </>
        )}
        <p className="text-[11px] text-muted-foreground">Estimates use Dropbox&apos;s zxcvbn, which models dictionary words, names, keyboard patterns, dates and l33t substitutions — far more realistic than “has a symbol” rules. The best protection is a long, unique passphrase stored in a password manager, plus 2FA.</p>
      </div>
    </ToolLayout>
  );
}

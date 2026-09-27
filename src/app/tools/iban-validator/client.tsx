"use client";

import { useMemo, useState } from "react";
import * as ibantools from "ibantools";
import { Check, X } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CodeArea, CopyButton, DownloadButton, OptionsLayout, Segmented, StatusBadge, ToolPanel } from "@/components/tool";
import { cn } from "@/lib/utils";

const E = ibantools.ValidationErrorsIBAN;
const MESSAGES: Record<number, string> = {
  [E.NoIBANProvided]: "Enter an IBAN.",
  [E.NoIBANCountry]: "Unknown country code — the first two letters must be an IBAN country (e.g. DE, GB, FR).",
  [E.WrongBBANLength]: "Wrong length for this country.",
  [E.WrongBBANFormat]: "The account part has characters in the wrong places for this country.",
  [E.ChecksumNotNumber]: "Characters 3–4 must be the two check digits.",
  [E.WrongIBANChecksum]: "Check digits don't match — likely a typo or swapped digits.",
  [E.WrongAccountBankBranchChecksum]: "The national bank/account checksum is invalid.",
  [E.QRIBANNotAllowed]: "QR-IBANs aren't allowed here.",
};

const regionName = (cc: string) => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(cc) ?? cc;
  } catch {
    return cc;
  }
};

interface Checked {
  raw: string;
  clean: string;
  valid: boolean;
  errors: string[];
  country?: string;
  details?: ReturnType<typeof ibantools.extractIBAN>;
}

function check(raw: string): Checked {
  const clean = ibantools.electronicFormatIBAN(raw) ?? raw.replace(/[\s-]/g, "").toUpperCase();
  const v = ibantools.validateIBAN(clean);
  const cc = clean.slice(0, 2);
  return {
    raw,
    clean,
    valid: v.valid,
    errors: v.valid ? [] : v.errorCodes.map((c) => MESSAGES[c] ?? "Invalid IBAN."),
    country: /^[A-Z]{2}$/.test(cc) ? cc : undefined,
    details: v.valid ? ibantools.extractIBAN(clean) : undefined,
  };
}

const SAMPLES = ["DE89 3704 0044 0532 0130 00", "GB82 WEST 1234 5698 7654 32", "FR14 2004 1010 0505 0001 3M02 606", "NL91ABNA0417164300"];

export default function IBANValidator() {
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [input, setInput] = useState("");
  const [batch, setBatch] = useState("");

  const r = useMemo(() => (input.trim() ? check(input) : null), [input]);
  const batchResults = useMemo(() => batch.split(/\n/).map((l) => l.trim()).filter(Boolean).map(check), [batch]);

  const spec = r?.country ? ibantools.countrySpecs[r.country] : undefined;
  const expected = spec?.chars;

  const rows: [string, string | undefined][] = r?.valid && r.details
    ? [
        ["Country", `${regionName(r.details.countryCode ?? "")} (${r.details.countryCode})`],
        ["Check digits", r.clean.slice(2, 4)],
        ["Bank code", r.details.bankIdentifier || undefined],
        ["Branch code", r.details.branchIdentifier || undefined],
        ["Account number", r.details.accountNumber || undefined],
        ["BBAN", r.details.bban],
        ["SEPA", ibantools.isSEPACountry(r.details.countryCode ?? "") ? "Yes — euro transfers supported" : "No"],
        ["Electronic format", r.clean],
      ]
    : [];

  const csv = ["iban,valid,country,error", ...batchResults.map((b) => `${b.clean},${b.valid},${b.country ?? ""},"${b.errors[0] ?? ""}"`)].join("\n");
  const validCount = batchResults.filter((b) => b.valid).length;

  const options = (
    <ToolPanel title="Mode" bodyClassName="p-3 space-y-3">
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: "single", label: "One IBAN" },
          { value: "batch", label: "Many (one per line)" },
        ]}
      />
      <div className="space-y-1">
        <p className="text-xs font-medium">Try an example</p>
        {SAMPLES.map((s) => (
          <button key={s} type="button" onClick={() => (mode === "single" ? setInput(s) : setBatch((b) => (b ? `${b}\n${s}` : s)))} className="block w-full text-left font-mono text-[11px] px-2 py-1 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            {s}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">Checks country format, length and the ISO 13616 check digits. It can&apos;t tell whether the account exists or is open.</p>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="iban-validator">
      <OptionsLayout options={options}>
        {mode === "single" ? (
          <>
            <ToolPanel bodyClassName="p-3.5 space-y-2">
              <div className="relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="DE89 3704 0044 0532 0130 00"
                  spellCheck={false}
                  autoFocus
                  className={cn("h-12 text-lg font-mono tracking-wide pr-28 uppercase", r && (r.valid ? "border-emerald-500/60" : "border-destructive/60"))}
                  aria-invalid={r ? !r.valid : undefined}
                />
                {r && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <StatusBadge tone={r.valid ? "success" : "error"}>{r.valid ? "Valid" : "Invalid"}</StatusBadge>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground tabular-nums">
                <span>{r?.clean.length ?? 0} characters{expected ? ` · ${expected} expected for ${r?.country}` : ""}</span>
              </div>
            </ToolPanel>

            {r && !r.valid && (
              <ToolPanel title="Problems">
                <ul className="divide-y divide-border">
                  {r.errors.map((e) => (
                    <li key={e} className="flex items-start gap-2 px-3.5 py-2.5 text-sm">
                      <X className="w-4 h-4 text-destructive shrink-0 mt-0.5" /> {e}
                    </li>
                  ))}
                </ul>
              </ToolPanel>
            )}

            {r?.valid && (
              <ToolPanel
                title="Details"
                actions={
                  <>
                    <code className="hidden sm:block font-mono text-xs mr-1">{ibantools.friendlyFormatIBAN(r.clean)}</code>
                    <CopyButton text={ibantools.friendlyFormatIBAN(r.clean) ?? r.clean} label="Copy formatted" />
                  </>
                }
              >
                <dl className="divide-y divide-border">
                  {rows
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k} className="group flex items-center gap-3 px-3.5 h-10">
                        <dt className="w-36 shrink-0 text-xs text-muted-foreground">{k}</dt>
                        <dd className="flex-1 font-mono text-[13px] truncate">{v}</dd>
                        <CopyButton text={v} iconOnly className="opacity-0 group-hover:opacity-100 focus:opacity-100" />
                      </div>
                    ))}
                </dl>
              </ToolPanel>
            )}
          </>
        ) : (
          <>
            <ToolPanel title="IBANs">
              <CodeArea value={batch} onChange={(e) => setBatch(e.target.value)} placeholder={"Paste IBANs, one per line…"} minHeight={180} />
            </ToolPanel>
            {batchResults.length > 0 && (
              <ToolPanel
                title={`Results · ${validCount}/${batchResults.length} valid`}
                actions={<DownloadButton content={csv} filename="iban-check.csv" mime="text/csv" label="CSV" />}
              >
                <ul className="divide-y divide-border max-h-[480px] overflow-y-auto custom-scrollbar">
                  {batchResults.map((b, i) => (
                    <li key={i} className="flex items-center gap-3 px-3.5 py-2 text-sm">
                      {b.valid ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <X className="w-4 h-4 text-destructive shrink-0" />}
                      <code className="font-mono text-[13px] flex-1 truncate">{ibantools.friendlyFormatIBAN(b.clean) ?? b.raw}</code>
                      <span className="text-xs text-muted-foreground truncate max-w-[45%]">{b.valid ? regionName(b.country ?? "") : b.errors[0]}</span>
                    </li>
                  ))}
                </ul>
              </ToolPanel>
            )}
          </>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}

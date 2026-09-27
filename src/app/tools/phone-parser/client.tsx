"use client";

import { useMemo, useState } from "react";
import { AsYouType, findPhoneNumbersInText, getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { Check, X } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CodeArea, CopyButton, DownloadButton, Field, OptionsLayout, Segmented, StatusBadge, ToolPanel } from "@/components/tool";
import { useMounted } from "@/lib/local-store";

const regionName = (cc: string) => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(cc) ?? cc;
  } catch {
    return cc;
  }
};

const COUNTRIES = getCountries()
  .map((c) => ({ code: c, name: regionName(c), dial: getCountryCallingCode(c) }))
  .sort((a, b) => a.name.localeCompare(b.name));

const TYPE_LABEL: Record<string, string> = {
  MOBILE: "Mobile",
  FIXED_LINE: "Landline",
  FIXED_LINE_OR_MOBILE: "Landline or mobile",
  TOLL_FREE: "Toll-free",
  PREMIUM_RATE: "Premium rate",
  SHARED_COST: "Shared cost",
  VOIP: "VoIP",
  PERSONAL_NUMBER: "Personal number",
  PAGER: "Pager",
  UAN: "Universal access",
  VOICEMAIL: "Voicemail",
};

/** Guess the visitor's country from the browser locale (e.g. en-GB → GB). */
function guessCountry(): CountryCode {
  const region = (typeof navigator !== "undefined" ? navigator.language : "en-US").split("-")[1]?.toUpperCase();
  return (getCountries() as string[]).includes(region ?? "") ? (region as CountryCode) : "US";
}

export default function PhoneParser() {
  const mounted = useMounted();
  if (!mounted) return <ToolLayout toolId="phone-parser"><div className="h-96 rounded-md border border-border bg-card" /></ToolLayout>;
  return <Parser />;
}

function Parser() {
  const [mode, setMode] = useState<"single" | "extract">("single");
  const [country, setCountry] = useState<CountryCode>(guessCountry);
  const [input, setInput] = useState("");
  const [text, setText] = useState("");

  const p = useMemo(() => (input.trim() ? parsePhoneNumberFromString(input, country) : undefined), [input, country]);
  const typed = useMemo(() => (input.trim() ? new AsYouType(country).input(input) : ""), [input, country]);
  const found = useMemo(() => (text.trim() ? findPhoneNumbersInText(text, { defaultCountry: country, extended: true }) : []), [text, country]);

  const rows: [string, string][] = p
    ? [
        ["E.164", p.format("E.164")],
        ["International", p.formatInternational()],
        ["National", p.formatNational()],
        ["RFC 3966 (tel: link)", p.getURI()],
        ["Country", p.country ? `${regionName(p.country)} (${p.country})` : "—"],
        ["Calling code", `+${p.countryCallingCode}`],
        ["National number", p.nationalNumber],
        ["Type", TYPE_LABEL[p.getType() ?? ""] ?? "Unknown"],
      ]
    : [];

  const csv = ["number,e164,country,valid", ...found.map((f) => `"${f.number.formatInternational()}",${f.number.number},${f.number.country ?? ""},${f.number.isValid()}`)].join("\n");

  const options = (
    <ToolPanel title="Settings" bodyClassName="p-3 space-y-3">
      <Segmented value={mode} onChange={setMode} options={[{ value: "single", label: "One number" }, { value: "extract", label: "Find in text" }]} />
      <Field label="Default country" hint="Used for numbers written without a +country code." htmlFor="cc">
        <select id="cc" value={country} onChange={(e) => setCountry(e.target.value as CountryCode)} className="h-(--control-h) w-full rounded-md border border-input bg-card px-2 text-sm dark:bg-input/30">
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name} (+{c.dial})
            </option>
          ))}
        </select>
      </Field>
      <p className="text-[11px] text-muted-foreground">Uses Google&apos;s libphonenumber metadata. Validity means the number is correctly formed for its country — not that it&apos;s in service.</p>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="phone-parser">
      <OptionsLayout options={options}>
        {mode === "single" ? (
          <>
            <ToolPanel bodyClassName="p-3.5 space-y-1.5">
              <div className="relative">
                <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="+44 20 7946 0958 or 020 7946 0958" inputMode="tel" autoFocus className="h-12 text-lg font-mono pr-24" />
                {p && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <StatusBadge tone={p.isValid() ? "success" : p.isPossible() ? "warning" : "error"}>{p.isValid() ? "Valid" : p.isPossible() ? "Possible" : "Invalid"}</StatusBadge>
                  </span>
                )}
              </div>
              {typed && typed !== input && <p className="text-xs text-muted-foreground font-mono">{typed}</p>}
              {input.trim() && !p && <p className="text-xs text-destructive">Couldn&apos;t read a phone number from that.</p>}
              {p && !p.isValid() && <p className="text-xs text-muted-foreground">{p.isPossible() ? "The length is plausible, but this isn't a valid number range for the country." : "Wrong length for this country."}</p>}
            </ToolPanel>
            {p && (
              <ToolPanel title="Details">
                <dl className="divide-y divide-border">
                  {rows.map(([k, v]) => (
                    <div key={k} className="group flex items-center gap-3 px-3.5 h-10">
                      <dt className="w-40 shrink-0 text-xs text-muted-foreground">{k}</dt>
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
            <ToolPanel title="Text">
              <CodeArea value={text} onChange={(e) => setText(e.target.value)} minHeight={180} placeholder={"Paste an email, CSV or notes — e.g. \"Call John on 07700 900123 or the office +1 (415) 555-2671\""} />
            </ToolPanel>
            {found.length > 0 && (
              <ToolPanel title={`${found.length} number${found.length === 1 ? "" : "s"} found`} actions={<DownloadButton content={csv} filename="phone-numbers.csv" mime="text/csv" label="CSV" />}>
                <ul className="divide-y divide-border">
                  {found.map((f, i) => (
                    <li key={i} className="group flex items-center gap-3 px-3.5 h-10 text-sm">
                      {f.number.isValid() ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <X className="w-4 h-4 text-destructive shrink-0" />}
                      <code className="font-mono text-[13px] flex-1 truncate">{f.number.formatInternational()}</code>
                      <span className="text-xs text-muted-foreground">{f.number.country ?? ""} · {TYPE_LABEL[f.number.getType() ?? ""] ?? "—"}</span>
                      <CopyButton text={f.number.number} iconOnly className="opacity-0 group-hover:opacity-100 focus:opacity-100" />
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

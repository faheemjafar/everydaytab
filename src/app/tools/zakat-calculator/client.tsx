"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, OptionsLayout, Segmented, Stat, StatGrid, StatusBadge, ToolAlert, ToolPanel } from "@/components/tool";
import { createLocalStore, useLocalStore, useMounted } from "@/lib/local-store";

const NISAB_GOLD_G = 87.48;
const NISAB_SILVER_G = 612.36;
const KARAT: Record<string, number> = { "24": 1, "22": 22 / 24, "21": 21 / 24, "18": 18 / 24, "14": 14 / 24 };
const CURRENCIES = ["USD", "EUR", "GBP", "PKR", "INR", "BDT", "SAR", "AED", "QAR", "KWD", "EGP", "TRY", "MYR", "IDR", "NGN", "CAD", "AUD", "ZAR"];
const TROY_OZ_G = 31.1034768;
const CACHE_MS = 60 * 60 * 1000;

// Time zone → currency (instant, no request). Covers the main zakat-paying regions.
const TZ: Record<string, string> = {
  "Asia/Karachi": "PKR", "Asia/Kolkata": "INR", "Asia/Calcutta": "INR", "Asia/Dhaka": "BDT", "Asia/Riyadh": "SAR", "Asia/Dubai": "AED", "Asia/Qatar": "QAR",
  "Asia/Kuwait": "KWD", "Asia/Bahrain": "BHD", "Asia/Muscat": "OMR", "Asia/Amman": "JOD", "Asia/Baghdad": "IQD", "Asia/Tehran": "IRR", "Asia/Kabul": "AFN",
  "Asia/Kuala_Lumpur": "MYR", "Asia/Jakarta": "IDR", "Asia/Makassar": "IDR", "Asia/Singapore": "SGD", "Asia/Tashkent": "UZS", "Asia/Almaty": "KZT", "Asia/Baku": "AZN",
  "Europe/Istanbul": "TRY", "Africa/Cairo": "EGP", "Africa/Lagos": "NGN", "Africa/Casablanca": "MAD", "Africa/Algiers": "DZD", "Africa/Tunis": "TND", "Africa/Nairobi": "KES",
  "Africa/Johannesburg": "ZAR", "Asia/Colombo": "LKR", "Asia/Kathmandu": "NPR", "Asia/Manila": "PHP", "Asia/Bangkok": "THB", "Europe/London": "GBP", "America/Toronto": "CAD", "America/Vancouver": "CAD", "Australia/Sydney": "AUD", "Australia/Melbourne": "AUD",
};
const EURO_ZONES = /^Europe\/(Berlin|Paris|Madrid|Rome|Amsterdam|Brussels|Vienna|Dublin|Lisbon|Helsinki|Athens|Luxembourg|Bratislava|Ljubljana|Tallinn|Riga|Vilnius|Valletta|Zagreb)$/;

function currencyFromZone(): string | null {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (TZ[tz]) return TZ[tz];
  if (EURO_ZONES.test(tz)) return "EUR";
  if (/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit)|^Pacific\/Honolulu/.test(tz)) return "USD";
  return null;
}

interface Rates { goldUsdOz: number; silverUsdOz: number; fx: Record<string, number>; at: number }
const ratesStore = createLocalStore<Rates | null>("zakat-rates", null);

interface S {
  currency: string; nisab: "silver" | "gold"; goldPrice: string; silverPrice: string;
  cash: string; bank: string; goldG: string; karat: string; silverG: string; investments: string; business: string; receivables: string; other: string;
  debts: string; bills: string;
}
const EMPTY: S = { currency: "", nisab: "silver", goldPrice: "", silverPrice: "", cash: "", bank: "", goldG: "", karat: "24", silverG: "", investments: "", business: "", receivables: "", other: "", debts: "", bills: "" };
const store = createLocalStore<S>("zakat-calculator", EMPTY, (r) => ({ ...EMPTY, ...(r as Partial<S>) }));
const n = (s: string) => Math.max(0, parseFloat(s.replace(/,/g, "")) || 0);

const ASSETS: [keyof S, string, string?][] = [
  ["cash", "Cash in hand"],
  ["bank", "Bank balances", "Current, savings and deposit accounts"],
  ["investments", "Shares, funds & crypto", "Market value of tradable holdings"],
  ["business", "Business stock", "Inventory at sale value, plus business cash"],
  ["receivables", "Money owed to you", "Loans you expect to be repaid"],
  ["other", "Other savings", "Pension withdrawable now, rental income saved…"],
];

/** Shows 2,500,000 while idle and the raw number while editing. */
function AmountInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const num = parseFloat(value.replace(/,/g, ""));
  const shown = editing || !value || !Number.isFinite(num) ? value : num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return (
    <Input
      id={id}
      value={shown}
      onFocus={() => setEditing(true)}
      onBlur={() => setEditing(false)}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
      inputMode="decimal"
      placeholder="0"
      className="text-right font-mono tabular-nums"
    />
  );
}

export default function ZakatCalculator() {
  const mounted = useMounted();
  const [s, setS] = useLocalStore(store);
  const [rates, setRates] = useLocalStore(ratesStore);
  const [detected, setDetected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof S) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setS((x) => ({ ...x, [k]: e.target.value }));

  const fetchRates = async () => {
    setLoading(true);
    setError(null);
    try {
      const [g, sv, fx] = await Promise.all(["https://api.gold-api.com/price/XAU", "https://api.gold-api.com/price/XAG", "https://open.er-api.com/v6/latest/USD"].map((u) => fetch(u).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })));
      if (!(g.price > 0 && sv.price > 0 && fx.rates)) throw new Error("Unexpected response");
      setRates({ goldUsdOz: g.price, silverUsdOz: sv.price, fx: fx.rates, at: Date.now() });
    } catch {
      setError("Couldn't load live prices. Check your connection and retry, or enter today's prices below.");
    } finally {
      setLoading(false);
    }
  };

  // Detect currency (time zone, then IP lookup) and load prices (cached for an hour).
  useEffect(() => {
    if (!s.currency) {
      const tz = currencyFromZone();
      if (tz) setTimeout(() => setDetected(tz), 0);
      else fetch("https://ipapi.co/currency/").then((r) => r.text()).then((c) => /^[A-Z]{3}$/.test(c.trim()) && setDetected(c.trim())).catch(() => {});
    }
    const cached = ratesStore.get();
    if (!cached || Date.now() - cached.at > CACHE_MS) setTimeout(fetchRates, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currency = s.currency || detected || "USD";
  const fx = rates?.fx[currency];
  const money = (v: number) => (mounted ? new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(v) : v.toFixed(2));

  // Live prices per gram in the chosen currency; manual entry only if live data is unavailable.
  const live = rates && fx ? { gold: (rates.goldUsdOz / TROY_OZ_G) * fx, silver: (rates.silverUsdOz / TROY_OZ_G) * fx } : null;
  const gp = live ? live.gold : n(s.goldPrice);
  const sp = live ? live.silver : n(s.silverPrice);
  const goldValue = n(s.goldG) * KARAT[s.karat] * gp;
  const silverValue = n(s.silverG) * sp;
  const assets = ASSETS.reduce((t, [k]) => t + n(s[k]), 0) + goldValue + silverValue;
  const liabilities = n(s.debts) + n(s.bills);
  const net = Math.max(0, assets - liabilities);
  const nisab = s.nisab === "gold" ? NISAB_GOLD_G * gp : NISAB_SILVER_G * sp;
  const priced = s.nisab === "gold" ? gp > 0 : sp > 0;
  const due = priced && net >= nisab;
  const zakat = due ? net * 0.025 : 0;

  const money$ = (k: keyof S, label: string, hint?: string) => (
    <Field key={k} label={label} hint={hint} htmlFor={`z-${k}`}>
      <AmountInput id={`z-${k}`} value={s[k]} onChange={(v) => setS((x) => ({ ...x, [k]: v }))} />
    </Field>
  );

  const options = (
    <ToolPanel
      title="Prices & nisab"
      bodyClassName="p-3 space-y-3"
      footer={<p className="text-[11px] text-muted-foreground">Live spot prices from gold-api.com, exchange rates from open.er-api.com. Your amounts never leave this browser.</p>}
    >
      <Field label="Currency" hint={!s.currency && detected ? "Detected automatically" : undefined} htmlFor="z-cur">
        <select id="z-cur" value={currency} onChange={set("currency")} className="h-(--control-h) w-full rounded-md border border-input bg-card px-2 text-sm dark:bg-input/30">
          {[...new Set([currency, ...CURRENCIES, ...Object.keys(rates?.fx ?? {})])].map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      {live ? (
        <div className="space-y-2">
          <dl className="rounded-md border border-border divide-y divide-border">
            {[["Gold (24k)", live.gold], ["Silver", live.silver]].map(([k, v]) => (
              <div key={k as string} className="flex items-baseline justify-between gap-2 px-3 py-2">
                <dt className="text-xs text-muted-foreground">{k} <span className="text-[10px]">/ gram</span></dt>
                <dd className="font-mono text-sm font-medium tabular-nums">{money(v as number)}</dd>
              </div>
            ))}
          </dl>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Updated {mounted && rates ? new Date(rates.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : ""}</span>
            <Button variant="ghost" size="sm" onClick={fetchRates} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} /> Refresh</Button>
          </div>
        </div>
      ) : loading ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading live gold and silver prices…</p>
      ) : (
        <>
          {error && <ToolAlert tone="warning">{error}</ToolAlert>}
          {rates && !fx && <ToolAlert tone="warning">No exchange rate available for {currency}.</ToolAlert>}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Gold price / gram (24k)" htmlFor="z-gp"><Input id="z-gp" value={s.goldPrice} onChange={set("goldPrice")} inputMode="decimal" className="font-mono" /></Field>
            <Field label="Silver price / gram" htmlFor="z-sp"><Input id="z-sp" value={s.silverPrice} onChange={set("silverPrice")} inputMode="decimal" className="font-mono" /></Field>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRates}><RefreshCw /> Retry live prices</Button>
        </>
      )}
      <Field label="Nisab standard" hint={s.nisab === "silver" ? `${NISAB_SILVER_G} g silver — lower threshold, recommended by many scholars as it benefits more recipients.` : `${NISAB_GOLD_G} g gold (7.5 tola).`}>
        <Segmented size="sm" value={s.nisab} onChange={(v) => setS((x) => ({ ...x, nisab: v }))} options={[{ value: "silver", label: "Silver" }, { value: "gold", label: "Gold" }]} />
      </Field>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="zakat-calculator">
      <OptionsLayout options={options}>
        <ToolPanel bodyClassName="p-5 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-48">
            <p className="text-xs text-muted-foreground">Zakat due (2.5%)</p>
            <p className="text-4xl font-semibold tabular-nums">{money(zakat)}</p>
          </div>
          {!priced ? <StatusBadge tone="warning">{loading ? "Loading prices…" : `${s.nisab} price unavailable`}</StatusBadge> : due ? <StatusBadge tone="success">Above nisab — zakat is due</StatusBadge> : <StatusBadge>Below nisab — no zakat due</StatusBadge>}
        </ToolPanel>
        <StatGrid>
          <Stat label="Total assets" value={money(assets)} />
          <Stat label="Deductions" value={money(liabilities)} />
          <Stat label="Net zakatable" value={money(net)} hint={liabilities > assets ? "Deductions exceed assets" : undefined} />
          <Stat label="Nisab" value={priced ? money(nisab) : "—"} hint={s.nisab} />
        </StatGrid>
        <ToolPanel title="Assets held for a lunar year" bodyClassName="p-3 grid gap-3 sm:grid-cols-2">
          {ASSETS.map(([k, l, h]) => money$(k, l, h))}
          <Field label="Gold owned (grams)" hint={goldValue ? `≈ ${money(goldValue)}` : "Jewellery, coins, bars"} htmlFor="z-gg">
            <div className="flex gap-1.5">
              <AmountInput id="z-gg" value={s.goldG} onChange={(v) => setS((x) => ({ ...x, goldG: v }))} />
              <select value={s.karat} onChange={set("karat")} aria-label="Karat" className="h-(--control-h) rounded-md border border-input bg-card px-2 text-sm dark:bg-input/30">{Object.keys(KARAT).map((k) => <option key={k} value={k}>{k}k</option>)}</select>
            </div>
          </Field>
          <Field label="Silver owned (grams)" hint={silverValue ? `≈ ${money(silverValue)}` : undefined} htmlFor="z-sg"><AmountInput id="z-sg" value={s.silverG} onChange={(v) => setS((x) => ({ ...x, silverG: v }))} /></Field>
        </ToolPanel>
        <ToolPanel title="Deductions" bodyClassName="p-3 grid gap-3 sm:grid-cols-2">
          {money$("debts", "Debts due now", "Loan instalments and money owed that are currently payable")}
          {money$("bills", "Unpaid bills", "Rent, utilities, taxes and wages due")}
        </ToolPanel>
        <p className="text-[11px] text-muted-foreground">A general guide following common scholarly positions. Treatment of jewellery for personal use, pensions and long-term debts differs between schools — consult a scholar for your situation.</p>
      </OptionsLayout>
    </ToolLayout>
  );
}

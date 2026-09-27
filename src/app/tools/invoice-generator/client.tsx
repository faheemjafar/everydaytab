"use client";

import { useState } from "react";
import { Download, ImagePlus, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, PrivacyNote, ToolPanel } from "@/components/tool";
import { createLocalStore, useLocalStore, useMounted } from "@/lib/local-store";

interface Item { id: number; desc: string; qty: string; rate: string }
interface Draft {
  number: string; date: string; due: string; currency: string;
  from: string; to: string; items: Item[]; taxLabel: string; tax: string; discount: string; notes: string;
}

const BLANK: Draft = {
  number: "INV-0001", date: "", due: "", currency: "USD",
  from: "", to: "", items: [{ id: 1, desc: "", qty: "1", rate: "" }], taxLabel: "Tax", tax: "", discount: "", notes: "Thank you for your business.",
};
const store = createLocalStore<Draft>("invoice-draft", BLANK, (raw) => ({ ...BLANK, ...(raw as Partial<Draft>) }));
const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AED", "SAR", "PKR", "CAD", "AUD", "JPY", "CNY", "CHF", "SGD", "ZAR", "BRL", "MXN", "NGN", "TRY"];
const n = (s: string) => Math.max(0, parseFloat(s) || 0);

export default function InvoiceGenerator() {
  const mounted = useMounted();
  const [d, setD] = useLocalStore(store);
  const [logo, setLogo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const setItem = (id: number, patch: Partial<Item>) => set("items", d.items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const money = (v: number) => (mounted ? new Intl.NumberFormat(undefined, { style: "currency", currency: d.currency }).format(v) : v.toFixed(2));
  const today = mounted ? new Date().toISOString().slice(0, 10) : "";
  const date = d.date || today;
  const subtotal = d.items.reduce((s, i) => s + n(i.qty) * n(i.rate), 0);
  const discount = Math.min(subtotal, n(d.discount));
  const tax = ((subtotal - discount) * n(d.tax)) / 100;
  const total = subtotal - discount + tax;

  const loadLogo = (f: File | undefined) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setLogo(String(r.result));
    r.readAsDataURL(f);
  };

  const pdf = async () => {
    setBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const M = 48;
      let y = M;
      if (logo) {
        const img = new Image();
        img.src = logo;
        await img.decode();
        const h = 48;
        const w = Math.min(160, (img.width / img.height) * h);
        doc.addImage(logo, M, y, w, h);
      }
      doc.setFont("helvetica", "bold").setFontSize(24).text("INVOICE", W - M, y + 20, { align: "right" });
      doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(90);
      doc.text([`No. ${d.number}`, `Date: ${date}`, ...(d.due ? [`Due: ${d.due}`] : [])], W - M, y + 38, { align: "right" });
      y += 90;
      doc.setTextColor(120).setFontSize(9).text("FROM", M, y).text("BILL TO", W / 2, y);
      doc.setTextColor(20).setFontSize(10);
      const fromL = doc.splitTextToSize(d.from || "—", W / 2 - M - 12);
      const toL = doc.splitTextToSize(d.to || "—", W / 2 - M);
      doc.text(fromL, M, y + 14).text(toL, W / 2, y + 14);
      y += 14 + Math.max(fromL.length, toL.length) * 13 + 24;

      const cols = [M, W - M - 230, W - M - 140, W - M];
      doc.setFillColor(243, 242, 240).rect(M, y - 13, W - 2 * M, 20, "F");
      doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(80);
      doc.text("DESCRIPTION", cols[0] + 6, y).text("QTY", cols[1], y, { align: "right" }).text("RATE", cols[2], y, { align: "right" }).text("AMOUNT", cols[3] - 6, y, { align: "right" });
      y += 22;
      doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(20);
      for (const i of d.items.filter((x) => x.desc || n(x.rate))) {
        const lines = doc.splitTextToSize(i.desc || "—", cols[1] - cols[0] - 50);
        if (y + lines.length * 13 > doc.internal.pageSize.getHeight() - 160) { doc.addPage(); y = M; }
        doc.text(lines, cols[0] + 6, y);
        doc.text(String(n(i.qty)), cols[1], y, { align: "right" }).text(money(n(i.rate)), cols[2], y, { align: "right" }).text(money(n(i.qty) * n(i.rate)), cols[3] - 6, y, { align: "right" });
        y += lines.length * 13 + 8;
        doc.setDrawColor(230).line(M, y - 6, W - M, y - 6);
      }
      y += 10;
      const row = (label: string, value: string, bold = false) => {
        doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(bold ? 12 : 10);
        doc.text(label, W - M - 150, y).text(value, W - M - 6, y, { align: "right" });
        y += bold ? 20 : 16;
      };
      row("Subtotal", money(subtotal));
      if (discount) row("Discount", `−${money(discount)}`);
      if (n(d.tax)) row(`${d.taxLabel || "Tax"} (${n(d.tax)}%)`, money(tax));
      row("Total", money(total), true);
      if (d.notes) {
        y += 20;
        doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(100).text(doc.splitTextToSize(d.notes, W - 2 * M), M, y);
      }
      doc.save(`${d.number.replace(/[^\w-]+/g, "_") || "invoice"}.pdf`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolLayout toolId="invoice-generator">
      <div className="grid gap-3 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          <ToolPanel title="Details" actions={<Button variant="ghost" size="sm" onClick={() => { setD(BLANK); setLogo(null); }}><RotateCcw /> New</Button>} bodyClassName="p-3 grid gap-3 sm:grid-cols-2">
            <Field label="Invoice number" htmlFor="in"><Input id="in" value={d.number} onChange={(e) => set("number", e.target.value)} /></Field>
            <Field label="Currency" htmlFor="cur">
              <select id="cur" value={d.currency} onChange={(e) => set("currency", e.target.value)} className="h-(--control-h) w-full rounded-md border border-input bg-card px-2 text-sm dark:bg-input/30">
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Date" htmlFor="idate"><Input id="idate" type="date" value={date} onChange={(e) => set("date", e.target.value)} /></Field>
            <Field label="Due date" htmlFor="idue"><Input id="idue" type="date" value={d.due} onChange={(e) => set("due", e.target.value)} /></Field>
            <Field label="From (your business)" htmlFor="ifrom"><Textarea id="ifrom" value={d.from} onChange={(e) => set("from", e.target.value)} rows={4} placeholder={"Your Company\n123 Street\nCity, Country\nbilling@you.com"} /></Field>
            <Field label="Bill to" htmlFor="ito"><Textarea id="ito" value={d.to} onChange={(e) => set("to", e.target.value)} rows={4} placeholder={"Client name\nAddress\nVAT / Tax ID"} /></Field>
            <div className="sm:col-span-2 flex items-center gap-2">
              <label className="inline-flex items-center gap-2 h-8 px-2.5 rounded-md border border-input text-[13px] cursor-pointer hover:bg-muted">
                <ImagePlus className="w-4 h-4" /> {logo ? "Change logo" : "Add logo"}
                <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(e) => loadLogo(e.target.files?.[0])} />
              </label>
              {logo && <Button variant="ghost" size="icon-sm" onClick={() => setLogo(null)} aria-label="Remove logo"><X /></Button>}
            </div>
          </ToolPanel>

          <ToolPanel title="Line items" actions={<Button variant="ghost" size="sm" onClick={() => set("items", [...d.items, { id: Math.max(0, ...d.items.map((i) => i.id)) + 1, desc: "", qty: "1", rate: "" }])}><Plus /> Add</Button>}>
            <div className="divide-y divide-border">
              {d.items.map((i) => (
                <div key={i.id} className="flex items-center gap-1.5 px-2.5 py-1.5">
                  <Input value={i.desc} onChange={(e) => setItem(i.id, { desc: e.target.value })} placeholder="Description" className="flex-1" aria-label="Description" />
                  <Input value={i.qty} onChange={(e) => setItem(i.id, { qty: e.target.value })} inputMode="decimal" className="w-16 text-right" aria-label="Quantity" />
                  <Input value={i.rate} onChange={(e) => setItem(i.id, { rate: e.target.value })} inputMode="decimal" placeholder="Rate" className="w-24 text-right" aria-label="Rate" />
                  <span className="w-24 text-right text-[13px] tabular-nums">{money(n(i.qty) * n(i.rate))}</span>
                  <Button variant="ghost" size="icon-sm" onClick={() => set("items", d.items.length > 1 ? d.items.filter((x) => x.id !== i.id) : [{ ...BLANK.items[0] }])} aria-label="Remove item" className="text-muted-foreground hover:text-destructive"><Trash2 /></Button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 p-3 border-t border-border">
              <Field label="Discount (amount)" htmlFor="idisc"><Input id="idisc" value={d.discount} onChange={(e) => set("discount", e.target.value)} inputMode="decimal" /></Field>
              <Field label="Tax label" htmlFor="itl"><Input id="itl" value={d.taxLabel} onChange={(e) => set("taxLabel", e.target.value)} placeholder="VAT / GST" /></Field>
              <Field label="Tax %" htmlFor="itax"><Input id="itax" value={d.tax} onChange={(e) => set("tax", e.target.value)} inputMode="decimal" /></Field>
            </div>
          </ToolPanel>
          <ToolPanel title="Notes / payment terms" bodyClassName="p-3"><Textarea value={d.notes} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder="Bank details, payment terms…" /></ToolPanel>
        </div>

        <ToolPanel
          title="Preview"
          className="xl:sticky xl:top-3 self-start"
          footer={<div className="w-full space-y-2"><Button size="lg" onClick={pdf} disabled={busy} className="w-full"><Download /> {busy ? "Building PDF…" : "Download PDF"}</Button><PrivacyNote>The draft is saved in this browser only; nothing is uploaded.</PrivacyNote></div>}
        >
          <div className="p-6 bg-white text-stone-900 text-[12px] leading-relaxed min-h-[560px]">
            <div className="flex items-start justify-between">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {logo ? <img src={logo} alt="" className="h-12 max-w-40 object-contain" /> : <span />}
              <div className="text-right">
                <p className="text-2xl font-bold tracking-tight">INVOICE</p>
                <p className="text-stone-500">No. {d.number}<br />Date: {date}{d.due && <><br />Due: {d.due}</>}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mt-8">
              <div><p className="text-[10px] text-stone-400 font-medium">FROM</p><p className="whitespace-pre-line">{d.from || "—"}</p></div>
              <div><p className="text-[10px] text-stone-400 font-medium">BILL TO</p><p className="whitespace-pre-line">{d.to || "—"}</p></div>
            </div>
            <table className="w-full mt-8">
              <thead><tr className="bg-stone-100 text-[10px] text-stone-500"><th className="text-left font-semibold px-2 py-1.5">DESCRIPTION</th><th className="text-right font-semibold px-2">QTY</th><th className="text-right font-semibold px-2">RATE</th><th className="text-right font-semibold px-2">AMOUNT</th></tr></thead>
              <tbody className="divide-y divide-stone-200">
                {d.items.filter((i) => i.desc || n(i.rate)).map((i) => (
                  <tr key={i.id}><td className="px-2 py-1.5">{i.desc || "—"}</td><td className="text-right px-2 tabular-nums">{n(i.qty)}</td><td className="text-right px-2 tabular-nums">{money(n(i.rate))}</td><td className="text-right px-2 tabular-nums">{money(n(i.qty) * n(i.rate))}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="ml-auto mt-4 w-56 space-y-1 tabular-nums">
              <p className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></p>
              {discount > 0 && <p className="flex justify-between"><span>Discount</span><span>−{money(discount)}</span></p>}
              {n(d.tax) > 0 && <p className="flex justify-between"><span>{d.taxLabel || "Tax"} ({n(d.tax)}%)</span><span>{money(tax)}</span></p>}
              <p className="flex justify-between border-t border-stone-300 pt-1 text-sm font-bold"><span>Total</span><span>{money(total)}</span></p>
            </div>
            {d.notes && <p className="mt-10 text-stone-500 whitespace-pre-line">{d.notes}</p>}
          </div>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}

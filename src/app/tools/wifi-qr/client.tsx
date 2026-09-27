"use client";

import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Eye, EyeOff, Printer, Wifi } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton, Field, OptionsLayout, PrivacyNote, Segmented, ToolPanel, Toggle } from "@/components/tool";

type Sec = "WPA" | "SAE" | "WEP" | "nopass";
// Wi-Fi QR format (ZXing / Wi-Fi Alliance): special characters \ ; , : " must be backslash-escaped.
const esc = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");

export default function WiFiQRGenerator() {
  const [ssid, setSsid] = useState("");
  const [pass, setPass] = useState("");
  const [sec, setSec] = useState<Sec>("WPA");
  const [hidden, setHidden] = useState(false);
  const [show, setShow] = useState(false);
  const [card, setCard] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);

  const value = ssid ? `WIFI:T:${sec === "SAE" ? "WPA" : sec};S:${esc(ssid)};${sec !== "nopass" ? `P:${esc(pass)};` : ""}${sec === "SAE" ? "R:1;" : ""}${hidden ? "H:true;" : ""};` : "";
  const weak = sec !== "nopass" && pass.length > 0 && pass.length < 8;

  const downloadPng = async () => {
    if (!svgRef.current) return;
    const xml = new XMLSerializer().serializeToString(svgRef.current);
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = c.height = 1024;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.drawImage(img, 0, 0, 1024, 1024);
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `wifi-${ssid.replace(/[^\w-]+/g, "_") || "network"}.png`;
    a.click();
  };

  const options = (
    <ToolPanel title="Network" bodyClassName="p-3 space-y-3" footer={<PrivacyNote>The password never leaves your browser.</PrivacyNote>}>
      <Field label="Network name (SSID)" htmlFor="ssid"><Input id="ssid" value={ssid} onChange={(e) => setSsid(e.target.value)} placeholder="Home WiFi" autoFocus /></Field>
      <Field label="Security">
        <Segmented size="sm" value={sec} onChange={setSec} options={[{ value: "WPA", label: "WPA/WPA2" }, { value: "SAE", label: "WPA3" }, { value: "WEP", label: "WEP" }, { value: "nopass", label: "None" }]} />
      </Field>
      {sec !== "nopass" && (
        <Field label="Password" htmlFor="wpw">
          <div className="flex gap-1">
            <Input id="wpw" type={show ? "text" : "password"} value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="off" />
            <Button variant="ghost" size="icon" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff /> : <Eye />}</Button>
          </div>
        </Field>
      )}
      {weak && <p className="text-xs text-amber-600 dark:text-amber-400">WPA passwords must be at least 8 characters.</p>}
      {sec === "WEP" && <p className="text-xs text-amber-600 dark:text-amber-400">WEP is broken and easily cracked — switch your router to WPA2 or WPA3 if possible.</p>}
      <Toggle label="Hidden network" checked={hidden} onChange={setHidden} />
      <Toggle label="Show printable card" checked={card} onChange={setCard} />
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="wifi-qr">
      <OptionsLayout options={options}>
        {value ? (
          <>
            <ToolPanel
              title="QR code"
              footer={
                <>
                  <span className="text-xs text-muted-foreground">Point a phone camera at it to join — works on iOS 11+ and Android 10+.</span>
                  <span className="flex-1" />
                  <Button variant="outline" onClick={() => window.print()}><Printer /> Print</Button>
                  <Button onClick={downloadPng}><Download /> PNG</Button>
                </>
              }
            >
              <div className="p-6 flex justify-center bg-white print:p-0">
                <div className={card ? "w-72 rounded-xl border-2 border-stone-200 p-5 text-center text-stone-900 space-y-3" : ""}>
                  {card && <p className="flex items-center justify-center gap-2 text-lg font-semibold"><Wifi className="w-5 h-5" /> Wi-Fi</p>}
                  <QRCodeSVG ref={svgRef} value={value} size={card ? 232 : 280} level="M" marginSize={2} className="mx-auto" />
                  {card && (
                    <div className="text-left text-sm space-y-0.5">
                      <p><span className="text-stone-500">Network:</span> <strong>{ssid}</strong></p>
                      {sec !== "nopass" && <p><span className="text-stone-500">Password:</span> <strong className="font-mono break-all">{pass}</strong></p>}
                      <p className="pt-1 text-xs text-stone-500">Scan with your camera to connect</p>
                    </div>
                  )}
                </div>
              </div>
            </ToolPanel>
            <ToolPanel title="Encoded string" actions={<CopyButton text={value} iconOnly />}>
              <p className="px-3.5 py-2.5 font-mono text-[12.5px] break-all">{show || sec === "nopass" ? value : value.replace(/P:(?:\\.|[^;])*;/, "P:••••••;")}</p>
            </ToolPanel>
          </>
        ) : (
          <ToolPanel bodyClassName="py-16 text-center text-sm text-muted-foreground">Enter your network name to create a scannable Wi-Fi QR code.</ToolPanel>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}

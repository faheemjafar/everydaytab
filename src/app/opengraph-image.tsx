import { ImageResponse } from "next/og";
import { tools } from "@/lib/tools";

export const alt = "EverydayTab - 250+ Free Online Developer & Utility Tools";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const PILLS = ["Merge PDF", "Image Compressor", "Video Trimmer", "Audio Converter", "JSON Formatter", "QR Generator", "Word Counter", "Color Converter"];

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1c1917",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Logo area */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "36px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              background: "#292524",
              borderRadius: "18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "8px",
              padding: "0 19px",
            }}
          >
            <div style={{ height: "10px", width: "42px", borderRadius: "5px", background: "#14b8a6", display: "flex" }} />
            <div style={{ height: "10px", width: "32px", borderRadius: "5px", background: "#5eead4", display: "flex" }} />
            <div style={{ height: "10px", width: "42px", borderRadius: "5px", background: "#14b8a6", display: "flex" }} />
          </div>
          <span style={{ fontSize: "56px", fontWeight: 700, color: "#fafaf9", letterSpacing: "-2px" }}>EverydayTab</span>
        </div>

        <div style={{ fontSize: "26px", color: "#a8a29e", textAlign: "center", maxWidth: "760px", lineHeight: 1.4, display: "flex" }}>
          {tools.length}+ free tools for PDF, image, audio, video, text and code — all in your browser.
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "44px", flexWrap: "wrap", justifyContent: "center", maxWidth: "900px" }}>
          {PILLS.map((tool) => (
            <div
              key={tool}
              style={{
                padding: "9px 18px",
                background: "#292524",
                borderRadius: "8px",
                color: "#e7e5e4",
                fontSize: "17px",
                fontWeight: 500,
                border: "1px solid #44403c",
                display: "flex",
              }}
            >
              {tool}
            </div>
          ))}
        </div>

        <div style={{ position: "absolute", bottom: "30px", fontSize: "17px", color: "#78716c", display: "flex" }}>
          everydaytab.com — no sign-up, no uploads, no watermarks
        </div>
      </div>
    ),
    { ...size }
  );
}

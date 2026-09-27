import { ImageResponse } from "next/og";
import { formatHex } from "culori";
import { getCategory, getToolById, getToolsByCategory, tools } from "@/lib/tools";

export const runtime = "nodejs";

const HUE_FALLBACK = 190;

// Satori can't parse oklch(); convert the category hue to hex up front.
const oklchHex = (l: number, c: number, h: number) => formatHex({ mode: "oklch", l, c, h }) ?? "#14b8a6";

/**
 * Dynamic Open Graph image for tool and category pages.
 *   /og?tool=<id>        → tool card
 *   /og?category=<id>    → category card
 * Cached at the edge/CDN via Cache-Control; content only changes on deploy.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const toolId = searchParams.get("tool");
  const categoryId = searchParams.get("category");

  const tool = toolId ? getToolById(toolId) : undefined;
  const category = tool ? getCategory(tool.category) : categoryId ? getCategory(categoryId) : undefined;
  if (!tool && !category) return new Response("Not found", { status: 404 });

  const hue = category?.hue ?? HUE_FALLBACK;
  const accent = oklchHex(0.72, 0.12, hue);
  const accentSoft = oklchHex(0.3, 0.06, hue);

  const eyebrow = tool ? category?.name ?? "Tool" : `${getToolsByCategory(category!.id).length} free tools`;
  const title = tool ? tool.name : category!.name;
  const rawDesc = tool ? tool.description : category!.description.split(" — ")[1]?.split(".")[0] ?? category!.description;
  const description = rawDesc.charAt(0).toUpperCase() + rawDesc.slice(1);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1c1917",
          color: "#fafaf9",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "14px", background: accent, display: "flex" }} />

        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ padding: "8px 16px", borderRadius: "8px", background: accentSoft, color: accent, fontSize: "22px", fontWeight: 600, display: "flex" }}>
            {eyebrow}
          </div>
          <div style={{ fontSize: "22px", color: "#78716c", display: "flex" }}>Free · in your browser · no sign-up</div>
        </div>

        {/* Title + description */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "980px" }}>
          <div style={{ fontSize: title.length > 28 ? "64px" : "80px", fontWeight: 700, letterSpacing: "-2.5px", lineHeight: 1.05, display: "flex" }}>{title}</div>
          <div style={{ fontSize: "30px", color: "#a8a29e", lineHeight: 1.35, display: "flex" }}>{description}</div>
        </div>

        {/* Footer brand */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                background: "#292524",
                borderRadius: "10px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "5px",
                padding: "0 10px",
              }}
            >
              <div style={{ height: "6px", width: "24px", borderRadius: "3px", background: "#14b8a6", display: "flex" }} />
              <div style={{ height: "6px", width: "18px", borderRadius: "3px", background: "#5eead4", display: "flex" }} />
              <div style={{ height: "6px", width: "24px", borderRadius: "3px", background: "#14b8a6", display: "flex" }} />
            </div>
            <div style={{ fontSize: "28px", fontWeight: 600, letterSpacing: "-1px", display: "flex" }}>EverydayTab</div>
          </div>
          <div style={{ fontSize: "22px", color: "#78716c", display: "flex" }}>everydaytab.com · {tools.length}+ tools</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable" },
    }
  );
}

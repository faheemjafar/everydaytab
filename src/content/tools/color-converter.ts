import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Color Converter – HEX to RGB, RGB to HSL & CSS Color Codes Online",
  seoDescription:
    "Convert colors between HEX, RGB and HSL instantly with a live preview and one-click copy of the CSS. Free color code converter for designers and developers — no sign-up.",
  intro:
    "Pick or paste a colour and get every common code for it at once: the HEX value, rgb() and hsl() functions, and a ready-to-paste CSS declaration. Edit any representation and the others update live, with a swatch so you can see what you are working with. Use it to translate a designer's HEX into HSL for easy tinting, or to turn an rgb() from a screenshot tool into a HEX code for your stylesheet.",
  sections: [
    {
      heading: "The formats explained",
      bullets: [
        "HEX (#1E90FF) — three pairs of hexadecimal digits for red, green and blue, 00–FF each. The most common format in CSS, design tools and brand guidelines. A fourth pair adds alpha (#1E90FF80).",
        "RGB (rgb(30, 144, 255)) — the same three channels as decimal 0–255. Easy to reason about programmatically; rgba() or the modern rgb(30 144 255 / 50%) adds transparency.",
        "HSL (hsl(210, 100%, 56%)) — hue as an angle on the colour wheel, saturation and lightness as percentages. The most intuitive format for humans: lighten a colour by raising L, mute it by lowering S, find a complementary by adding 180° to H.",
        "CSS — a complete background-color declaration for pasting straight into a stylesheet.",
      ],
    },
    {
      heading: "How the conversion works",
      paragraphs: [
        "HEX and RGB are two spellings of the same numbers: each HEX pair is a byte, so 1E is 30, 90 is 144 and FF is 255. HSL is derived from RGB by finding the maximum and minimum channel values — lightness is their average, saturation is their spread relative to lightness, and hue depends on which channel dominates and by how much. All three describe the same sRGB colour, so converting between them is lossless (aside from rounding HSL to whole numbers).",
      ],
    },
    {
      heading: "Practical tips",
      bullets: [
        "Use HSL when building palettes: keep H and S fixed and step L for consistent tints and shades.",
        "For perceptually uniform adjustments and wider gamuts, the Modern Color tool works in OKLCH and LAB.",
        "Check text/background pairs with the Contrast Checker before shipping — a colour that converts perfectly can still fail WCAG.",
        "Need the colour's name? Paste the HEX into the Color Name Finder.",
      ],
    },
  ],
  howTo: [
    { name: "Enter a colour", text: "Use the picker, or type a HEX code or RGB values." },
    { name: "Read the conversions", text: "HEX, RGB, HSL and the CSS declaration update instantly with a preview swatch." },
    { name: "Copy", text: "Click any format to copy it to your clipboard." },
  ],
  faqs: [
    {
      question: "How do I convert HEX to RGB by hand?",
      answer: "Split the HEX into three pairs and convert each from base 16: #FF8800 → FF=255, 88=136, 00=0 → rgb(255, 136, 0). The Integer Base Converter can do the hex-to-decimal step.",
    },
    {
      question: "Why does my HSL value look slightly different after converting back?",
      answer: "HSL values are rounded to whole degrees and percentages for readability; converting back can shift a channel by one unit. The visible difference is negligible.",
    },
    {
      question: "Can I convert to CMYK for print?",
      answer:
        "Not here — CMYK depends on the ink and paper profile, so a reliable conversion needs your printer's ICC profile in a tool like Photoshop or Affinity. Screen formats (HEX/RGB/HSL) are covered.",
    },
    {
      question: "Does the converter support transparency (alpha)?",
      answer: "The converter works with opaque colours. Add an alpha channel in your CSS with rgb(r g b / a%) or an 8-digit HEX after converting.",
    },
  ],
  related: ["color-name-finder", "contrast-checker", "color-mixer", "color-palette", "gradient-studio"],
};

export default content;

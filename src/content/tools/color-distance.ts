import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Color Distance Calculator – Delta E, Euclidean & Manhattan Online",
  seoDescription:
    "Measure how different two colours are. Enter two hex values to get Delta E (CIE76 in LAB space), RGB Euclidean and Manhattan distances, with a side-by-side preview. Free colour tool.",
  intro:
    "Compare two colours numerically. Enter two hex codes and see three distance measures — perceptual Delta E computed in CIE LAB space, plus straightforward Euclidean and Manhattan distances in RGB — alongside a swatch preview. Use it to check whether two brand colours are distinguishable, whether a compressed image shifted a colour, or how far a substitute is from a reference.",
  sections: [
    {
      heading: "The three distance measures",
      bullets: [
        "Delta E (ΔE, CIE76) — the distance between the two colours in the LAB colour space, which is designed so equal distances look equally different to the human eye. This is the number colour scientists, print shops and brand teams use.",
        "Euclidean RGB — the straight-line distance between the two colours' R, G, B values: √((R₁−R₂)² + (G₁−G₂)² + (B₁−B₂)²). Simple and fast, but does not match perception — a small change in blue looks different from the same numeric change in green.",
        "Manhattan RGB — the sum of the absolute channel differences |R₁−R₂| + |G₁−G₂| + |B₁−B₂|. Useful as a quick threshold in image-processing code.",
      ],
    },
    {
      heading: "How to read a Delta E value",
      bullets: [
        "ΔE < 1 — not perceptible by human eyes.",
        "ΔE 1–2 — perceptible only through close observation; acceptable for most print and screen work.",
        "ΔE 2–10 — perceptible at a glance; typical tolerance for consumer products is 2–3.",
        "ΔE 11–49 — colours are clearly different but still in the same family.",
        "ΔE ≥ 100 — the colours are opposites (black vs white is about 100).",
      ],
    },
    {
      heading: "Practical uses",
      bullets: [
        "Brand compliance — check that a printed or screen colour is within tolerance of the official swatch.",
        "Palette design — make sure adjacent colours in a chart or map are distinguishable (aim for ΔE above 10–15).",
        "Image processing — pick a threshold for \"same colour\" when clustering pixels or removing backgrounds.",
        "Compression QA — measure how much JPEG or video encoding shifted a key colour.",
        "Accessibility — pair with the Contrast Checker; distance and luminance contrast are different things and both matter.",
      ],
    },
  ],
  howTo: [
    { name: "Enter the first colour", text: "Type or pick a hex value for the reference colour." },
    { name: "Enter the second colour", text: "Type or pick the colour to compare against it." },
    { name: "Read the distances", text: "Delta E, Euclidean and Manhattan values appear instantly with a side-by-side preview." },
  ],
  faqs: [
    {
      question: "Which Delta E formula does this use?",
      answer:
        "CIE76 — the Euclidean distance in LAB space, computed via sRGB → XYZ (D65) → LAB. It is the classic, widely understood formula. CIEDE2000 refines it for very saturated colours and small differences; for most design decisions the two agree on whether colours are \"close\".",
    },
    {
      question: "Why do two colours with a large RGB distance have a small Delta E?",
      answer:
        "RGB is not perceptually uniform. Large numeric changes in some regions (very dark or very saturated colours) produce small visible differences, and vice versa. Delta E corrects for that, which is why it is preferred.",
    },
    {
      question: "What Delta E is acceptable for print?",
      answer: "Commercial print typically targets ΔE ≤ 2 against the proof; premium packaging and brand-critical work may demand ≤ 1.",
    },
    {
      question: "Can I compare colours in RGB or HSL instead of hex?",
      answer: "Convert them to hex first with the Color Converter, then paste both values here.",
    },
  ],
  related: ["color-converter", "color-name-finder", "contrast-checker", "color-mixer", "color-palette", "color-blindness"],
};

export default content;

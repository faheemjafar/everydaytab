import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Color Blindness Simulator – Preview Images as Colour-Blind Users See Them",
  seoDescription:
    "Upload an image and preview how it looks with protanopia, deuteranopia, tritanopia and achromatopsia. Check charts, UI and designs for colour-blind accessibility. Free, runs in your browser.",
  intro:
    "Upload a screenshot, chart, map or design and see an approximation of how people with the four main types of colour vision deficiency perceive it. Around 8% of men and 0.5% of women have some form of colour blindness — roughly 300 million people — so a red/green status indicator or a rainbow heat map that looks obvious to you may be unreadable to a sizeable part of your audience. Images are processed in your browser and never uploaded.",
  sections: [
    {
      heading: "The four simulations",
      bullets: [
        "Protanopia — red-blind. Reds appear dark and are confused with greens and browns; about 1% of men.",
        "Deuteranopia — green-blind. The most common form; greens shift toward beige and reds toward brown; about 1% of men (with milder deuteranomaly affecting another 5%).",
        "Tritanopia — blue-blind. Blues and greens are confused, yellows look pink; very rare (under 0.01%).",
        "Achromatopsia — total colour blindness. Everything is seen in shades of grey; rare, but the grayscale view is also a great test of whether your design relies on colour alone.",
      ],
    },
    {
      heading: "Designing for colour vision deficiency",
      bullets: [
        "Never use colour as the only signal — add icons, labels, patterns or text (a red X and a green tick, not just red and green dots).",
        "Avoid red/green and blue/purple pairings for adjacent categories; blue/orange is the safest contrasting pair.",
        "Use lightness contrast as well as hue contrast so the difference survives in grayscale.",
        "For data visualisation, prefer colour-blind-safe palettes such as Okabe-Ito, Viridis or ColorBrewer's qualitative sets.",
        "Check text and background contrast with the Contrast Checker; colour-blind users are also affected by low contrast.",
      ],
    },
    {
      heading: "About the simulation",
      paragraphs: [
        "This tool applies CSS filter approximations to give a fast, visual sense of each condition. It is a good first check for spotting designs that depend on colour, but it is not a colorimetrically exact model. For compliance work or scientific figures, follow up with a matrix-based simulator (Brettel/Viénot/Machado models are implemented in Chrome DevTools' Rendering panel, Figma plugins and Photoshop's Proof Setup) and, ideally, feedback from colour-blind users.",
      ],
    },
  ],
  howTo: [
    { name: "Upload an image", text: "Drop a screenshot, chart or design onto the page. It is loaded locally." },
    { name: "Select a condition", text: "Switch between protanopia, deuteranopia, tritanopia and achromatopsia." },
    { name: "Compare", text: "Look for elements that become indistinguishable, then adjust colours, add labels or patterns." },
  ],
  faqs: [
    {
      question: "How accurate is the simulation?",
      answer:
        "It uses approximate CSS filters — useful for catching obvious problems quickly, less precise than matrix-based scientific models. Treat it as a screening tool and verify important work with a full simulator.",
    },
    {
      question: "What is the most common type of colour blindness?",
      answer: "Deuteranomaly (reduced green sensitivity) affects about 5% of men, and red-green deficiencies together account for the vast majority of cases.",
    },
    {
      question: "Can I test a live website instead of a screenshot?",
      answer: "Take a screenshot and upload it here, or use Chrome DevTools → Rendering → Emulate vision deficiencies for a live view.",
    },
    {
      question: "Is my image uploaded?",
      answer: "No. The image is displayed and filtered in your browser only.",
    },
  ],
  related: ["contrast-checker", "color-palette", "color-harmony", "color-distance", "color-converter"],
};

export default content;

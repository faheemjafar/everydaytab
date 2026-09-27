import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Color Picker from Image – Get Hex Codes from Any Photo Online, Free",
  seoDescription:
    "Upload an image and click anywhere to get the exact hex colour of that pixel. Build a palette from a photo, logo or screenshot and copy the codes. Free eyedropper tool, runs in your browser.",
  intro:
    "Upload a photo, logo, screenshot or design and click on it to read the exact colour of any pixel as a hex code. Collect the colours you pick into a palette and copy them for your CSS, design system or brand guide. It is the eyedropper from your design app, available in any browser, with the image processed locally on your device.",
  sections: [
    {
      heading: "What you can do with it",
      bullets: [
        "Match a brand colour from a logo or marketing image when the style guide is nowhere to be found.",
        "Pull a palette from a photograph to theme a website, slide deck or interior mood board.",
        "Check the actual rendered colour in a screenshot when debugging CSS or a design hand-off.",
        "Grab colours from a competitor's or reference site for analysis.",
        "Sample skin, sky or product colours for colour grading and retouching.",
      ],
    },
    {
      heading: "How pixel sampling works",
      paragraphs: [
        "The image is drawn onto an off-screen canvas at its native resolution. When you click, the click position is mapped from the displayed size back to the original pixel coordinates and that pixel's red, green and blue values are read with getImageData and converted to hex. Because sampling is per pixel, clicking on a photograph returns the colour of that exact point — which in noisy or gradient areas can vary from its neighbours. Zoom in and click a flat area for the most representative reading, or sample a few nearby points and average them with the Color Mixer.",
      ],
    },
    {
      heading: "Turning picks into a usable palette",
      bullets: [
        "Aim for 4–6 colours: a dominant, one or two accents, and neutrals.",
        "Check text/background combinations with the Contrast Checker before using them in UI.",
        "Name the colours with the Color Name Finder for documentation.",
        "Generate tints and shades of each pick with the Color Harmony tool or by mixing with white/black.",
        "Convert to HSL with the Color Converter if you want to adjust lightness consistently across the set.",
      ],
    },
  ],
  howTo: [
    { name: "Upload an image", text: "Drop a JPG, PNG, WebP or GIF onto the page. It stays on your device." },
    { name: "Activate the eyedropper", text: "Click the Eyedropper button, then click any point on the image." },
    { name: "Collect colours", text: "Each pick is added to your palette with its hex code." },
    { name: "Copy", text: "Copy individual codes or the whole palette." },
  ],
  faqs: [
    {
      question: "Why does the colour I picked look slightly different from what I expected?",
      answer:
        "Sampling reads a single pixel. Photos contain noise, compression artefacts and gradients, so adjacent pixels differ. Click on a flat, evenly lit area or sample several points and average them.",
    },
    {
      question: "Can I extract the dominant colours automatically?",
      answer: "This tool is a manual eyedropper for precise picks. Use the Color Palette tool to generate a dominant-colour palette from an image automatically.",
    },
    {
      question: "Does it work on transparent PNGs?",
      answer: "Yes. Transparent pixels report the underlying RGB values; fully transparent areas may return black.",
    },
    {
      question: "Is my image uploaded?",
      answer: "No. The image is loaded and sampled entirely in your browser.",
    },
  ],
  related: ["color-name-finder", "color-converter", "contrast-checker", "color-harmony", "color-mixer"],
};

export default content;

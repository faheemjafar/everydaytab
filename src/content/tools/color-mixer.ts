import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Color Mixer Online – Blend Two Colors & Get the Hex Code Instantly",
  seoDescription:
    "Mix two colours in any ratio and get the resulting hex code with a live preview. Find midpoints, tints and blends for palettes, gradients and UI states. Free colour mixing tool.",
  intro:
    "Pick two colours, slide the ratio, and see the blend — with its hex code ready to copy. Use it to find the exact midpoint between two brand colours, to create hover and pressed states by mixing a base colour with white or black, or to preview what two overlapping semi-transparent layers will produce. The mixing is instant and runs in your browser.",
  sections: [
    {
      heading: "How the mix is calculated",
      paragraphs: [
        "The mixer interpolates linearly in RGB: each channel of the result is the weighted average of the two inputs according to the ratio. At 50% the result sits exactly halfway between the two colours in RGB space; at 80/20 it is much closer to the first colour. This is the same maths as CSS color-mix(in srgb, A 80%, B) and as stacking a colour at 80% opacity over another, so results translate directly to code.",
        "RGB mixing is predictable and matches how screens compose colours, but it can produce slightly dull midpoints between saturated complementary colours (red and green mix to a muddy olive). For perceptually smoother blends, mix in OKLCH or LAB using the Modern Color tool — or simply choose a ratio that looks right, which is what the live preview is for.",
      ],
    },
    {
      heading: "Practical mixing recipes",
      bullets: [
        "Hover state: mix your button colour with white at 90/10 for a subtle lift, or with black at 90/10 for a pressed look.",
        "Disabled state: mix the colour with the background at 40/60.",
        "Tint scale: mix with white at 80, 60, 40 and 20% to build a light-to-dark ramp for charts and badges.",
        "Brand midpoint: mix two brand colours 50/50 to find a harmonious accent that belongs to both.",
        "Overlay preview: mixing A with B at X% shows what A at X% opacity looks like over B.",
      ],
    },
    {
      heading: "Related colour tasks",
      paragraphs: [
        "To build a multi-stop gradient from your blend, take the endpoints to the Gradient Studio. To check that text on the mixed colour meets WCAG contrast, use the Contrast Checker. To learn what the resulting colour is called, paste it into the Color Name Finder, and to see how far it is from either input, use the Color Distance calculator.",
      ],
    },
  ],
  howTo: [
    { name: "Choose two colours", text: "Use the pickers or type hex codes for colour A and colour B." },
    { name: "Set the ratio", text: "Drag the slider to control how much of each colour goes into the mix." },
    { name: "Copy the result", text: "The blended colour and its hex code update live; click Copy to use it." },
  ],
  faqs: [
    {
      question: "Why does mixing red and green give a brownish colour?",
      answer:
        "In RGB, red (255,0,0) and green (0,255,0) average to (128,128,0), an olive-brown. That is how screen colours combine; paint mixes differently because it is subtractive. Perceptual spaces like OKLCH give brighter midpoints.",
    },
    {
      question: "Is this the same as CSS color-mix()?",
      answer: "Yes, for color-mix(in srgb, …). The ratio slider corresponds to the percentages in the CSS function.",
    },
    {
      question: "Can I mix more than two colours?",
      answer: "Mix two, then use the result as an input to mix with a third. For smooth multi-colour transitions the Gradient Studio is a better fit.",
    },
    {
      question: "Does it support transparency?",
      answer: "The mixer works with opaque colours, but mixing A with B at X% is exactly what you would see with A at X% opacity over B.",
    },
  ],
  related: ["gradient-studio", "color-converter", "color-harmony", "color-distance", "contrast-checker"],
};

export default content;

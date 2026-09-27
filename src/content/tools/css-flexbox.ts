import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "CSS Flexbox Generator – Visual Flex Layout Builder with Live Code",
  seoDescription:
    "Build CSS flexbox layouts visually. Set direction, wrap, justify-content, align-items, gap and per-item order, see the result live and copy the generated CSS. Free, no sign-up.",
  intro:
    "Design a flex container by clicking options instead of memorising property values. Choose direction, wrapping, justification, alignment and gap, add or reorder items, and watch the layout update in real time with the exact CSS shown alongside. Copy the code straight into your stylesheet. Ideal for learning how flexbox behaves and for prototyping navbars, card rows, toolbars and centring problems.",
  sections: [
    {
      heading: "The flexbox properties, explained by what they do",
      bullets: [
        "flex-direction — row lays items out left to right; column stacks them; the -reverse variants flip the order.",
        "flex-wrap — nowrap squeezes everything onto one line; wrap lets items flow onto new lines when space runs out.",
        "justify-content — distributes items along the main axis: flex-start, center, flex-end, space-between, space-around, space-evenly.",
        "align-items — aligns items on the cross axis: stretch (default), flex-start, center, flex-end.",
        "gap — spacing between items without the margin hacks of the past; works in every modern browser.",
        "order — changes an individual item's visual position without touching the HTML.",
      ],
    },
    {
      heading: "Common layouts you can build in seconds",
      bullets: [
        "Perfectly centred content: justify-content: center + align-items: center on a full-height container.",
        "Navbar with logo left and links right: justify-content: space-between.",
        "Responsive card row: flex-wrap: wrap with a gap, and a flex-basis on the cards.",
        "Equal-height columns: the default align-items: stretch does it automatically.",
        "Sticky footer: a column container with the main area set to flex: 1.",
      ],
    },
    {
      heading: "Flexbox vs CSS Grid",
      paragraphs: [
        "Flexbox is one-dimensional: it arranges items along a single row or column and is excellent for distributing space between components whose size is driven by their content. Grid is two-dimensional and is the better choice when you need rows and columns to line up — page layouts, galleries, dashboards. They are complementary: a Grid page skeleton with Flexbox inside each cell is the most common modern pattern. When your design needs strict alignment in both directions, switch to the CSS Grid Generator.",
      ],
    },
  ],
  howTo: [
    { name: "Set the container", text: "Pick a direction, whether items wrap, and how they are justified and aligned. Adjust the gap." },
    { name: "Add items", text: "Add or remove child items and change an item's order to see how it moves." },
    { name: "Preview", text: "The layout preview updates live so you can confirm the behaviour before writing any code." },
    { name: "Copy the CSS", text: "Click Copy to grab the container and item rules and paste them into your stylesheet." },
  ],
  faqs: [
    {
      question: "How do I centre a div with flexbox?",
      answer:
        "On the parent, set display: flex; justify-content: center; align-items: center. If the parent should fill the viewport, add min-height: 100vh. Select Center for both options in the generator to see it working.",
    },
    {
      question: "What is the difference between justify-content and align-items?",
      answer:
        "justify-content works along the main axis (horizontal in a row, vertical in a column); align-items works along the cross axis. Switching flex-direction swaps which axis each property controls.",
    },
    {
      question: "Does flexbox work in all browsers?",
      answer: "Yes. Flexbox, including the gap property, is supported in every current browser. Only very old versions of Internet Explorer had partial support.",
    },
    {
      question: "Can I generate Tailwind classes instead of CSS?",
      answer:
        "The generator outputs standard CSS. The mapping to Tailwind is direct — flex, flex-row, flex-wrap, justify-between, items-center, gap-4 — so you can translate the generated rules line by line.",
    },
  ],
  related: ["css-grid", "box-shadow", "gradient-studio", "glassmorphism", "aspect-ratio"],
};

export default content;

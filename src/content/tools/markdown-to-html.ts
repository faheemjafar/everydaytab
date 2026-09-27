import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Markdown to HTML Converter – Free, Instant, Clean Output",
  seoDescription:
    "Convert Markdown to HTML online for free. Paste .md text or upload a file and get clean, semantic HTML with tables, code blocks and lists — ready to copy or download. No sign-up.",
  intro:
    "Paste Markdown and get well-formed HTML you can drop straight into a web page, CMS, email template or documentation system. Headings become <h1>–<h6>, lists become <ul> and <ol>, fenced code becomes <pre><code>, and GitHub-style tables and task lists are supported. Copy the result or download it as an .html file — the conversion runs in your browser.",
  sections: [
    {
      heading: "What the converter produces",
      paragraphs: [
        "The output is semantic HTML without inline styles or wrapper divs, so it inherits whatever CSS the destination page already has. Headings, paragraphs, emphasis, links, images, blockquotes, horizontal rules, nested lists, tables, fenced code blocks (with a language class on the <code> element for highlighters such as Prism or highlight.js) and task-list checkboxes are all handled. Raw HTML embedded in the Markdown is passed through unchanged, which is convenient for the occasional <br> or <details> block.",
      ],
    },
    {
      heading: "Where you'd use it",
      bullets: [
        "Publishing a README or docs page on a platform whose editor only accepts HTML.",
        "Building HTML email content from a Markdown draft.",
        "Converting Markdown notes (Obsidian, Bear, Notion exports) into a web page.",
        "Generating static HTML for a simple site without setting up a build tool.",
        "Checking how a Markdown renderer will interpret a tricky construct by reading the generated tags.",
      ],
    },
    {
      heading: "Tips for clean conversions",
      bullets: [
        "Leave a blank line before and after headings, lists, code fences and tables — most rendering glitches come from missing blank lines.",
        "Indent nested list items by two or four spaces consistently.",
        "Specify a language after the opening code fence (```js) so the <code> tag carries a language class.",
        "If the destination sanitises HTML, avoid raw tags in your Markdown and let the converter generate everything.",
        "Need the reverse? The HTML to Markdown tool converts existing pages back to Markdown.",
      ],
    },
  ],
  howTo: [
    { name: "Paste your Markdown", text: "Type or paste Markdown into the input pane, or upload a .md file." },
    { name: "Review the HTML", text: "The converted HTML appears instantly; a rendered preview shows how it looks." },
    { name: "Copy or download", text: "Click Copy for the clipboard or Download to save an .html file." },
  ],
  faqs: [
    {
      question: "Is the HTML output a full page?",
      answer:
        "The converter produces the body content — the HTML fragment corresponding to your Markdown — so it can be pasted into an existing page or template. Wrap it in <html><head>…</head><body>…</body></html> if you need a standalone file.",
    },
    {
      question: "Does it support GitHub Flavored Markdown tables and task lists?",
      answer: "Yes. Pipe tables become <table> elements and - [ ] / - [x] items become list items with checkbox inputs.",
    },
    {
      question: "Are code blocks syntax-highlighted in the output?",
      answer:
        "The HTML includes a language-xxx class on the <code> element. Add a highlighter such as Prism or highlight.js to the destination page to colour it.",
    },
    {
      question: "Is my content sent to a server?",
      answer: "No. Conversion happens entirely in your browser; your text is never uploaded.",
    },
  ],
  related: ["markdown-editor", "html-markdown", "markdown-table-generator", "html-entities", "html-editor", "markdown-cheatsheet"],
};

export default content;

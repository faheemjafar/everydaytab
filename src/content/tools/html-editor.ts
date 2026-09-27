import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Free Online WYSIWYG HTML Editor – Visual Editor with Live Source",
  seoDescription:
    "Write and format content visually and get clean HTML instantly. Free online WYSIWYG editor with headings, bold, italic, lists, alignment and a live source view. No sign-up, nothing uploaded.",
  intro:
    "Format text the way you would in a word processor — headings, bold and italic, bulleted and numbered lists, alignment — and watch the HTML appear alongside it in real time. Edit either side: change the visual version and the source updates, or tweak the source and see it rendered. Perfect for drafting email newsletters, CMS content, product descriptions and documentation without hand-writing tags.",
  sections: [
    {
      heading: "What WYSIWYG means",
      paragraphs: [
        "\"What You See Is What You Get\" editors let you work with formatted content directly rather than with markup. Under the hood every action — making a word bold, inserting a list — produces the corresponding HTML element, so the visual view and the code view are always two representations of the same document. Because this editor shows both at once, it doubles as a way to learn HTML: apply a format and see exactly which tags it generates.",
      ],
    },
    {
      heading: "Common uses",
      bullets: [
        "Composing HTML email content for Mailchimp, Brevo, HubSpot or a custom sender.",
        "Writing product descriptions or blog posts to paste into a CMS field that expects HTML.",
        "Cleaning up messy HTML copied from Word or Google Docs — paste it, tidy the formatting visually, copy the result.",
        "Building quick HTML snippets for documentation, README files (via the HTML to Markdown converter) or support articles.",
        "Prototyping a page section before handing it to a developer.",
      ],
    },
    {
      heading: "Getting clean HTML out",
      paragraphs: [
        "Content pasted from word processors often carries inline styles, font tags and empty spans. After pasting, use the toolbar to re-apply the formatting you actually want and check the source panel for leftover clutter. For an even cleaner result, strip everything with the HTML Tag Stripper and rebuild the formatting here. When you are done, click Copy HTML to grab the result.",
      ],
    },
  ],
  howTo: [
    { name: "Write or paste", text: "Type your content in the visual editor or paste text from another document." },
    { name: "Format", text: "Use the toolbar for headings, bold, italic, bulleted and numbered lists, alignment, and undo/redo." },
    { name: "Check the source", text: "Watch the HTML update live in the source panel; edit it directly if you need finer control." },
    { name: "Copy the HTML", text: "Click Copy HTML to put the generated markup on your clipboard." },
  ],
  faqs: [
    {
      question: "Is this HTML editor really free with no sign-up?",
      answer: "Yes. There is no account, no trial and no watermark. The editor runs entirely in your browser.",
    },
    {
      question: "Is my content saved anywhere?",
      answer:
        "No. Nothing is sent to a server, and the content is discarded when you close the tab — copy your HTML before leaving.",
    },
    {
      question: "Can I paste from Microsoft Word or Google Docs?",
      answer:
        "Yes. Formatting is preserved as HTML. Word in particular adds a lot of extra markup; review the source panel and simplify if you need clean code.",
    },
    {
      question: "Does it support images?",
      answer:
        "Add an <img> tag in the source view with the image URL. To embed an image directly inside the HTML, convert it with the Base64 File Converter and use the data URI as the src.",
    },
    {
      question: "Can I edit the HTML directly?",
      answer: "Yes — the source panel is editable, and changes are reflected in the visual editor immediately.",
    },
  ],
  related: ["html-markdown", "strip-html", "markdown-editor", "html-entities", "base64-file"],
};

export default content;

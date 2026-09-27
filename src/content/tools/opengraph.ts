import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Open Graph Generator & Preview – OG and Twitter Card Tags, Free",
  seoDescription:
    "Generate Open Graph and Twitter Card meta tags and preview how your link will look on Facebook, LinkedIn, X, Slack and WhatsApp. Paste existing page HTML to audit its tags. Runs in your browser.",
  intro:
    "Fill in a title, description, image and URL and get copy-ready og: and twitter: tags, with live previews of the cards each platform will render. Already have a page? Paste its HTML source to extract and audit the tags it contains — missing images, over-long titles and absent Twitter Card tags are flagged — without sending the URL or page to any third-party service.",
  sections: [
    {
      heading: "What Open Graph tags do",
      paragraphs: [
        "When you paste a link into Facebook, LinkedIn, Slack, Discord, WhatsApp, iMessage or X, the platform fetches the page and looks for <meta property=\"og:…\"> tags in the <head>. Those tags — introduced by Facebook in 2010 and now universal — tell the platform which title, description and image to show in the link preview. Without them the platform guesses, often picking the wrong image or the first paragraph of navigation text. X additionally reads twitter:card tags, falling back to Open Graph when they are absent.",
      ],
    },
    {
      heading: "The tags that matter",
      bullets: [
        "og:title — 60 characters or fewer to avoid truncation; can differ from the HTML <title>.",
        "og:description — 1–2 sentences, about 155 characters; shown under the title on most platforms.",
        "og:image — an absolute URL to a 1200×630 px image (1.91:1). Under 8 MB; PNG or JPG. Also set og:image:width and og:image:height so the first share renders correctly.",
        "og:url — the canonical URL, so shares of tracking-parameter variants are counted together.",
        "og:type — usually website or article.",
        "twitter:card — summary_large_image for a big image, summary for a small square one; twitter:site for your handle.",
      ],
    },
    {
      heading: "Common preview problems",
      bullets: [
        "No image — og:image is missing, relative, blocked by robots.txt, or served only after JavaScript runs.",
        "Old image or title still showing — the platform cached the page; use Facebook's Sharing Debugger or LinkedIn's Post Inspector to force a re-scrape after fixing the tags.",
        "Wrong image — several og:image tags present; the first one wins on most platforms.",
        "Blurry image — smaller than 600×315; use 1200×630.",
        "Tags not found — the page returns different HTML to bots, requires login, or the tags sit in the <body> instead of the <head>.",
      ],
    },
  ],
  howTo: [
    { name: "Enter a URL", text: "Paste the full public URL including https://." },
    { name: "Fetch", text: "Click Debug. The page's metadata is retrieved and parsed." },
    { name: "Review the preview", text: "Check the title, description and image as they will appear in a share card, and the raw tag values below." },
    { name: "Fix and re-test", text: "Update the tags on your page, redeploy and run the check again." },
  ],
  faqs: [
    {
      question: "Why does the preview here differ from what Facebook shows?",
      answer:
        "Facebook, LinkedIn and others cache previews, sometimes for days. If you recently changed your tags, use the platform's own debugger to request a re-scrape. This tool always fetches the live page.",
    },
    {
      question: "Does this work for pages behind a login or on localhost?",
      answer: "No. The URL must be publicly reachable, exactly as it would be for a social network's crawler.",
    },
    {
      question: "How is the page fetched?",
      answer:
        "Browsers cannot fetch arbitrary third-party pages directly because of CORS, so the metadata is retrieved through a public link-preview API. Only the URL you enter is sent; no personal data is included.",
    },
    {
      question: "How do I generate Open Graph tags for my site?",
      answer: "Use the Open Graph Generator or Meta Tag Generator on EverydayTab to produce a complete, correctly formatted tag block to paste into your <head>.",
    },
  ],
  related: ["meta-tag-generator", "faq-schema", "sitemap", "robots", "url-parser"],
};

export default content;

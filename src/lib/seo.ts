import type { Metadata } from "next";
import { getToolById, categories, tools } from "@/lib/tools";
import { getToolContent } from "@/content/tools";
import { getCategoryContent } from "@/content/categories";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://everydaytab.com";

const CATEGORY_TITLE_SUFFIX: Record<string, string> = {
  pdf: "PDF Tool",
  developer: "Developer Tool",
  text: "Text Tool",
  converter: "Converter",
  math: "Math Tool",
  image: "Image Tool",
  color: "Color Tool",
  file: "File Tool",
  seo: "SEO Tool",
  markdown: "Markdown Tool",
  generator: "Generator",
  security: "Security Tool",
  audio: "Audio Tool",
  video: "Video Tool",
};

const CATEGORY_EXTRA_KEYWORDS: Record<string, string[]> = {
  pdf: ["free pdf tools", "pdf editing tools online free", "best free pdf tools", "merge pdf online free", "compress pdf online free", "online pdf editor", "free pdf editor"],
  developer: ["free developer tools online", "best free developer tools", "best free tools for developers", "web developer tools", "online dev tools", "coding tools"],
  text: ["free text tools online", "text editor online free", "online text formatter", "text utility tools"],
  converter: ["free online converter", "best free online converter", "unit converter online free", "file converter online"],
  math: ["free math tools online", "online calculator free", "math calculator online", "percentage calculator online"],
  image: ["free image tools online", "online image editor free", "image resizer online free", "svg optimizer online"],
  color: ["free color tools online", "color converter online", "hex to rgb online", "online color picker"],
  file: ["free file tools online", "zip compressor online", "archive extractor online", "batch file renamer online", "online file utilities"],
  seo: ["free seo tools online", "meta tag generator online", "sitemap generator online", "robots txt generator online", "open graph generator online"],
  markdown: ["free markdown tools online", "markdown editor online free", "markdown table generator", "markdown to html online", "markdown editor browser"],
  generator: ["free generator tools online", "online password generator free", "qr code generator online free", "uuid generator online"],
  security: ["free security tools online", "online encryption tool free", "hash generator online", "password strength checker online"],
  audio: ["free audio tools online", "audio converter online free", "online audio editor free", "mp3 converter online"],
  video: ["free video tools online", "video converter online free", "online video compressor free", "mp4 converter online"],
};

// Near-duplicate tools that split ranking signals. The secondary (key) points
// its canonical at the primary (value) and is left out of the sitemap so Google
// consolidates the two URLs instead of choosing between them.
export const CANONICAL_TOOL: Record<string, string> = {
  "md-table-generator": "markdown-table-generator",
};

export function getCanonicalToolId(toolId: string): string {
  return CANONICAL_TOOL[toolId] ?? toolId;
}

export function generateToolMetadata(toolId: string): Metadata {
  const tool = getToolById(toolId);
  if (!tool) {
    return {
      title: "Tool Not Found",
      description: "The requested tool could not be found.",
    };
  }

  const category = categories.find((c) => c.id === tool.category);
  const content = getToolContent(toolId);
  const canonicalTool = getToolById(getCanonicalToolId(toolId)) ?? tool;
  const titleSuffix = CATEGORY_TITLE_SUFFIX[tool.category] ?? (category?.name || "Tool");
  const title = content?.seoTitle ?? `${tool.name} - Free Online ${titleSuffix}`;
  const descBase = tool.description.replace(/\.$/, "");
  const description =
    content?.seoDescription ?? `${descBase}. Free ${titleSuffix.toLowerCase()} that runs in your browser — no upload, no sign-up, instant results.`;
  const enhancedKeywords = [
    ...(tool.tags || []),
    "free online tool",
    "browser based",
    "no signup",
    "privacy first",
    titleSuffix.toLowerCase(),
  ];

  return {
    title,
    description,
    keywords: enhancedKeywords,
    alternates: {
      canonical: `${BASE_URL}${canonicalTool.path}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: tool.name,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}${tool.path}`,
      siteName: "EverydayTab",
      type: "website",
      images: [{ url: `/og?tool=${tool.id}`, width: 1200, height: 630, alt: `${tool.name} — free online tool on EverydayTab` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/og?tool=${tool.id}`],
    },
  };
}

export function generateToolJsonLd(toolId: string) {
  const tool = getToolById(toolId);
  if (!tool) return null;

  const category = categories.find((c) => c.id === tool.category);
  const content = getToolContent(toolId);
  const url = `${BASE_URL}${(getToolById(getCanonicalToolId(toolId)) ?? tool).path}`;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebApplication",
      "@id": `${url}#app`,
      name: tool.name,
      description: content?.seoDescription ?? tool.description,
      url,
      applicationCategory: category?.name || "Utility",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      isPartOf: { "@type": "WebSite", name: "EverydayTab", url: BASE_URL },
      publisher: { "@type": "Organization", name: "EverydayTab", url: BASE_URL },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: BASE_URL,
        },
        ...(category
          ? [
              {
                "@type": "ListItem",
                position: 2,
                name: category.name,
                item: `${BASE_URL}/category/${category.id}`,
              },
            ]
          : []),
        {
          "@type": "ListItem",
          position: category ? 3 : 2,
          name: tool.name,
          item: url,
        },
      ],
    },
  ];

  if (content?.faqs.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: content.faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }

  if (content?.howTo.length) {
    graph.push({
      "@type": "HowTo",
      "@id": `${url}#howto`,
      name: `How to use the ${tool.name}`,
      description: content.intro,
      totalTime: "PT1M",
      tool: { "@type": "HowToTool", name: tool.name },
      step: content.howTo.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.name,
        text: s.text,
        url: `${url}#step-${i + 1}`,
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export const TOOL_COUNT = tools.length;

export function generateCategoryJsonLd(categoryId: string) {
  const category = categories.find((c) => c.id === categoryId);
  if (!category) return null;
  const content = getCategoryContent(categoryId);
  const url = `${BASE_URL}/category/${category.id}`;
  const categoryTools = tools.filter((t) => t.category === categoryId);

  const graph: Record<string, unknown>[] = [
    {
      "@type": "CollectionPage",
      "@id": `${url}#page`,
      name: `${category.name} - Free Online Tools`,
      description: content?.tagline ?? category.description,
      url,
      isPartOf: { "@type": "WebSite", name: "EverydayTab", url: BASE_URL },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: categoryTools.length,
        itemListElement: categoryTools.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.name,
          url: `${BASE_URL}${t.path}`,
        })),
      },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: category.name, item: url },
      ],
    },
  ];

  if (content?.faqs.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: content.faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export function generateCategoryMetadata(categoryId: string, toolCount: number): Metadata {
  const category = categories.find((c) => c.id === categoryId);
  if (!category) return { title: "Category Not Found" };

  const content = getCategoryContent(categoryId);
  const description = content
    ? `${content.tagline} Browse ${toolCount} free online ${category.name.toLowerCase()} on EverydayTab — private, browser-based, no sign-up.`
    : `${category.description}. Browse ${toolCount} free online ${category.name.toLowerCase()} on EverydayTab. No sign-up required.`;

  return {
    title: `${category.name} - ${toolCount} Free Online Tools`,
    description,
    keywords: [
      category.name.toLowerCase(),
      "free online tools",
      "developer tools",
      "utility tools",
      "web tools",
      "no signup",
      "browser based",
      "privacy first",
      ...(CATEGORY_EXTRA_KEYWORDS[categoryId] || []),
    ],
    alternates: { canonical: `/category/${categoryId}` },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: `${category.name} - ${toolCount} Free Online Tools | EverydayTab`,
      description,
      url: `/category/${categoryId}`,
      siteName: "EverydayTab",
      type: "website",
      images: [{ url: `/og?category=${categoryId}`, width: 1200, height: 630, alt: `${category.name} on EverydayTab` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} - ${toolCount} Free Online Tools | EverydayTab`,
      description,
      images: [`/og?category=${categoryId}`],
    },
  };
}

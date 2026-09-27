import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categories, categoryStyle, getToolsByCategory, getToolById, type Tool } from "@/lib/tools";
import { generateCategoryMetadata, generateCategoryJsonLd } from "@/lib/seo";
import { getCategoryContent } from "@/content/categories";
import { JsonLd } from "@/components/json-ld";
import { CategoryBrowser } from "@/components/category-browser";
import { LucideIcon } from "@/components/lucide-icon";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return categories.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const toolCount = getToolsByCategory(id).length;
  return generateCategoryMetadata(id, toolCount);
}

export default async function CategoryPage({ params }: PageProps) {
  const { id } = await params;
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  const categoryTools = getToolsByCategory(id);
  const jsonLd = generateCategoryJsonLd(id);
  const content = getCategoryContent(id);
  const featured = (content?.featured ?? []).map((tid) => getToolById(tid)).filter((t): t is Tool => !!t);

  return (
    <div className="px-4 md:px-6 py-6 md:py-8 max-w-[1400px] mx-auto space-y-6">
      {jsonLd && <JsonLd data={jsonLd} />}

      {/* Header */}
      <header className="flex items-start gap-3">
        <span style={categoryStyle(category)} className="cat-chip w-10 h-10 rounded-md flex items-center justify-center shrink-0">
          <LucideIcon name={category.icon} className="w-5 h-5" />
        </span>
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight flex items-baseline gap-2">
            {category.name}
            <span className="text-sm font-normal text-muted-foreground tabular-nums">{categoryTools.length} tools</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">{content?.tagline ?? category.description}</p>
        </div>
      </header>

      {featured.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={`Popular ${category.name}`}>
          {featured.map((t) => (
            <li key={t.id}>
              <Link
                href={t.path}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-card text-xs font-medium hover:border-ring/50 hover:bg-muted/40 transition-colors"
              >
                <LucideIcon name={t.icon} className="w-3.5 h-3.5 text-muted-foreground" />
                {t.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <CategoryBrowser categoryId={category.id} tools={categoryTools} />

      {/* SEO prose below the tools */}
      {(content?.intro?.length || content?.faqs?.length) ? (
        <section className="pt-6 border-t border-border grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          {content?.intro && content.intro.length > 0 && (
            <div className="space-y-3 max-w-2xl">
              <h2 className="text-base font-semibold tracking-tight">About {category.name.toLowerCase()}</h2>
              {content.intro.map((para, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          )}
          {content?.faqs && content.faqs.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold tracking-tight">Frequently asked questions</h2>
              <dl className="divide-y divide-border rounded-md border border-border bg-card">
                {content.faqs.map((faq) => (
                  <div key={faq.question} className="p-3">
                    <dt className="text-[13px] font-medium">{faq.question}</dt>
                    <dd className="mt-1 text-xs text-muted-foreground leading-relaxed">{faq.answer}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </section>
      ) : null}

      <nav className="pt-4 border-t border-border space-y-2" aria-label="Other categories">
        <h2 className="text-[13px] font-semibold tracking-tight">Other categories</h2>
        <div className="flex flex-wrap gap-1.5">
          {categories
            .filter((c) => c.id !== id)
            .map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.id}`}
                className="inline-flex items-center gap-1.5 h-7 pl-1.5 pr-2.5 rounded-md border border-border bg-card text-xs text-muted-foreground hover:text-foreground hover:border-ring/50 transition-colors"
              >
                <span style={categoryStyle(c)} className="cat-chip w-4.5 h-4.5 rounded-xs flex items-center justify-center">
                  <LucideIcon name={c.icon} className="w-3 h-3" />
                </span>
                {c.name}
              </Link>
            ))}
        </div>
      </nav>
    </div>
  );
}

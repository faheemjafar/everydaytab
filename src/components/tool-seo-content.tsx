import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getToolById, getToolsByCategory, categories, categoryStyle, type Tool } from "@/lib/tools";
import { getToolContent } from "@/content/tools";
import { LucideIcon } from "@/components/lucide-icon";
import { SeoDisclosure } from "@/components/seo-disclosure";

interface ToolSeoContentProps {
  toolId: string;
}

function pickRelated(toolId: string, explicit?: string[]): Tool[] {
  const tool = getToolById(toolId);
  if (!tool) return [];
  const fromExplicit = (explicit ?? []).map((id) => getToolById(id)).filter((t): t is Tool => !!t && t.id !== toolId);
  if (fromExplicit.length >= 4) return fromExplicit.slice(0, 6);
  const sameCategory = getToolsByCategory(tool.category).filter((t) => t.id !== toolId && !fromExplicit.some((e) => e.id === t.id));
  return [...fromExplicit, ...sameCategory].slice(0, 6);
}

// Server-rendered, crawlable content block shown under every tool workspace.
// Rich sections come from src/content/tools/<id>.ts; related-tool links are
// always rendered so each page has unique internal linking even without prose.
export function ToolSeoContent({ toolId }: ToolSeoContentProps) {
  const tool = getToolById(toolId);
  if (!tool) return null;
  const content = getToolContent(toolId);
  const category = categories.find((c) => c.id === tool.category);
  const related = pickRelated(toolId, content?.related);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pb-10 space-y-5">
      {related.length > 0 && (
        <section className="space-y-2" aria-labelledby="related-tools-heading">
          <div className="flex items-center gap-2 h-7">
            <h2 id="related-tools-heading" className="text-[13px] font-semibold tracking-tight">
              Related tools
            </h2>
            <span className="flex-1" />
            {category && (
              <Link href={`/category/${category.id}`} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                All {category.name} <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {related.map((t) => (
              <li key={t.id}>
                <Link
                  href={t.path}
                  className="inline-flex items-center gap-1.5 h-8 pl-1.5 pr-3 rounded-md border border-border bg-card text-xs font-medium hover:border-ring/50 hover:bg-muted/40 transition-colors"
                >
                  <span style={categoryStyle(t.category)} className="cat-chip w-5 h-5 rounded-sm flex items-center justify-center">
                    <LucideIcon name={t.icon} className="w-3 h-3" />
                  </span>
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {content && (
        <SeoDisclosure title={`About the ${tool.name}`}>
          <article className="space-y-8 max-w-3xl">
            <p className="text-sm text-muted-foreground leading-relaxed">{content.intro}</p>

            {content.sections.map((section) => (
              <section key={section.heading} className="space-y-2">
                <h3 className="text-sm font-semibold tracking-tight">{section.heading}</h3>
                {section.paragraphs?.map((p, i) => (
                  <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                    {p}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground leading-relaxed">
                    {section.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            {content.howTo.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold tracking-tight">How to use the {tool.name}</h3>
                <ol className="space-y-2">
                  {content.howTo.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed">
                      <span className="shrink-0 w-5 h-5 rounded-sm bg-muted text-foreground text-[11px] font-semibold flex items-center justify-center mt-0.5 tabular-nums">
                        {i + 1}
                      </span>
                      <span>
                        <span className="font-medium">{step.name}.</span>{" "}
                        <span className="text-muted-foreground">{step.text}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {content.faqs.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold tracking-tight">Frequently asked questions</h3>
                <dl className="divide-y divide-border rounded-md border border-border">
                  {content.faqs.map((faq) => (
                    <div key={faq.question} className="p-3">
                      <dt className="text-[13px] font-medium">{faq.question}</dt>
                      <dd className="mt-1 text-sm text-muted-foreground leading-relaxed">{faq.answer}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </article>
        </SeoDisclosure>
      )}
    </div>
  );
}

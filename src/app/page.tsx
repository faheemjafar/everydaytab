import { HomeLanding, HOME_FAQS } from "@/components/home-landing";
import { JsonLd } from "@/components/json-ld";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://everydaytab.com";

export default function HomePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${BASE_URL}/#faq`,
    mainEntity: HOME_FAQS.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <HomeLanding />
    </>
  );
}

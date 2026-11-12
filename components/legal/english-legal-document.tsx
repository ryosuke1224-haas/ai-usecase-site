import type { EnglishLegalDocument } from "@/src/lib/legal/english";

export function EnglishLegalDocumentView({ document }: { document: EnglishLegalDocument }) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{document.title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">{document.description}</p>
      <div className="mt-10 space-y-8">
        {document.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-semibold tracking-tight">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-sm leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}

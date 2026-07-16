export const metadata = {
  title: "Contact",
  description: "Get in touch about AI workflow blueprints for your business.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact</h1>
      <p className="mt-3 text-lg text-muted">
        Building an AI workflow for your business? This database is a starting
        point — each blueprint maps problems to data, APIs, and implementation
        paths.
      </p>

      <div className="mt-10 space-y-6 rounded-2xl border border-border/60 bg-card p-8">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Suggest a use case
          </h2>
          <p className="mt-2 text-sm text-muted">
            Missing a workflow your industry needs? Describe the business problem,
            data you have available, and tools you already use.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Report an issue
          </h2>
          <p className="mt-2 text-sm text-muted">
            Found outdated API info or an incorrect implementation step? Let us
            know so the blueprint stays accurate.
          </p>
        </div>
        <div className="rounded-xl bg-surface p-4">
          <p className="text-sm font-medium text-foreground">Email</p>
          <p className="mt-1 text-sm text-muted">hello@aiusecasehub.example</p>
          <p className="mt-3 text-xs text-muted">
            Placeholder contact — replace with your actual support email.
          </p>
        </div>
      </div>
    </div>
  );
}

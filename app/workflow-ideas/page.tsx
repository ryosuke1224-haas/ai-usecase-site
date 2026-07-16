import { WorkflowIdeaCard } from "@/components/workflow-idea-card";
import { loadPublishedContent } from "@/src/content/load-published";

export const metadata = {
  title: "Workflow Ideas",
  description: "API combination ideas for SMB AI workflows.",
};

export default function WorkflowIdeasPage() {
  const { workflowIdeas } = loadPublishedContent();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="border-b border-border/60 pb-4">
        <p className="font-mono text-xs text-muted">Reference · {workflowIdeas.length} stacks</p>
        <h1 className="mt-1 text-2xl font-bold">Workflow Stacks</h1>
        <p className="mt-1 text-sm text-muted">
          API combinations that unlock multiple use cases — with example data flows
          and missing-tool notes.
        </p>
      </header>
      <div className="mt-6 space-y-6">
        {workflowIdeas.map((idea) => (
          <WorkflowIdeaCard key={idea.slug} idea={idea} />
        ))}
      </div>
    </div>
  );
}

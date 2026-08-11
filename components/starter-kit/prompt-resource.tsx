import { CopyPromptButton } from "@/components/starter-kit/copy-prompt-button";

type PromptResourceProps = {
  prompt: string;
  tips?: string[];
};

export function PromptResource({ prompt, tips }: PromptResourceProps) {
  return (
    <div className="space-y-5">
      <CopyPromptButton text={prompt} />

      <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Prompt
        </p>
        <pre className="mt-3 max-h-[32rem] overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-foreground sm:text-sm">
          {prompt}
        </pre>
      </div>

      <CopyPromptButton text={prompt} />

      {tips && tips.length > 0 ? (
        <div className="rounded-2xl border border-border/60 bg-surface/60 p-5">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            How to use this prompt
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
            {tips.map((tip) => (
              <li key={tip} className="flex gap-2">
                <span aria-hidden="true" className="text-accent">
                  •
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

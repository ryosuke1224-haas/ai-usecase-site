import { articleBlocks, type ArticleInline } from "@/src/lib/blog/model";

function Inlines({ items }: { items: ArticleInline[] }) {
  return (
    <>
      {items.map((item, index) =>
        item.type === "link" ? (
          <a key={index} href={item.href} className="font-medium text-accent underline" rel="noreferrer">
            {item.text}
          </a>
        ) : (
          <span key={index}>{item.text}</span>
        ),
      )}
    </>
  );
}

export function ArticleBody({ body }: { body: string }) {
  const blocks = articleBlocks(body);
  return (
    <div className="space-y-4 text-base leading-relaxed text-foreground">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h2 key={index} className="pt-2 text-xl font-semibold tracking-tight">
              {block.text}
            </h2>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Inlines items={item} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index}>
            <Inlines items={block.inlines} />
          </p>
        );
      })}
    </div>
  );
}

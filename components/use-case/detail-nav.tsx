"use client";

import { useEffect, useState } from "react";

type Section = { id: string; label: string };

const defaultSections: Section[] = [
  { id: "requirements", label: "What you need" },
  { id: "problem", label: "Problem" },
  { id: "data-sources", label: "Data sources" },
  { id: "ai-inputs", label: "AI inputs" },
  { id: "ai-outputs", label: "AI outputs" },
  { id: "apis", label: "APIs" },
  { id: "behavior", label: "System behavior" },
  { id: "paths", label: "Build paths" },
  { id: "steps", label: "Steps" },
  { id: "risks", label: "Risks" },
];

export function UseCaseDetailNav({
  sections = defaultSections,
}: {
  sections?: Section[];
}) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );

    for (const { id } of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav className="sticky top-20 hidden lg:block">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        On this page
      </p>
      <ul className="mt-3 space-y-1 border-l border-border/60">
        {sections.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={`block border-l-2 py-1 pl-3 text-sm transition-colors ${
                active === id
                  ? "border-accent font-medium text-accent"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

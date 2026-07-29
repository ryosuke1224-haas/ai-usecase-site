"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type ResourceLink = {
  href: string;
  label: string;
  description: string;
  /** Primary-nav items folded in on small screens where they are hidden. */
  smallScreenOnly?: boolean;
};

const resourceLinks: ResourceLink[] = [
  {
    href: "/find-workflows",
    label: "Find workflows by tools",
    description: "For people who already know which tools they use",
  },
  {
    href: "/apis",
    label: "APIs & Tools",
    description: "Reference for integrations behind the blueprints",
  },
  {
    href: "/data-sources",
    label: "Data Sources",
    description: "What business data each workflow relies on",
  },
  {
    href: "/workflow-ideas",
    label: "Workflow Ideas",
    description: "Tool combinations worth exploring",
  },
  {
    href: "/#how-it-works",
    label: "How it works",
    description: "The three steps from a business area to a blueprint",
    smallScreenOnly: true,
  },
  {
    href: "/contact",
    label: "Contact",
    description: "Suggest a workflow or report an issue",
    smallScreenOnly: true,
  },
];

export function ResourcesMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:text-sm"
      >
        Resources
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-lg border border-border/60 bg-card py-1 shadow-lg">
          <ul>
            {resourceLinks.map((link) => (
              <li
                key={link.href}
                className={link.smallScreenOnly ? "sm:hidden" : undefined}
              >
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 hover:bg-surface focus-visible:outline-none focus-visible:bg-surface"
                >
                  <span className="block text-sm font-medium text-foreground">
                    {link.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {link.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

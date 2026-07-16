"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { PublishedContent } from "./load-published";
import { createContentResolver } from "@/src/lib/resolve";

const ContentContext = createContext<PublishedContent | null>(null);

export function ContentProvider({
  content,
  children,
}: {
  content: PublishedContent;
  children: ReactNode;
}) {
  return (
    <ContentContext.Provider value={content}>{children}</ContentContext.Provider>
  );
}

export function usePublishedContent(): PublishedContent {
  const content = useContext(ContentContext);
  if (!content) {
    throw new Error("usePublishedContent must be used within ContentProvider");
  }
  return content;
}

export function useContentResolver() {
  const content = usePublishedContent();
  return useMemo(() => createContentResolver(content), [content]);
}

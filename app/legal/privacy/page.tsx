import type { Metadata } from "next";
import { EnglishLegalDocumentView } from "@/components/legal/english-legal-document";
import { englishLegalDocuments } from "@/src/lib/legal/english";

const document = englishLegalDocuments.privacy;

export const metadata: Metadata = {
  title: document.title,
  description: document.description,
  alternates: { canonical: "/legal/privacy" },
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return <EnglishLegalDocumentView document={document} />;
}

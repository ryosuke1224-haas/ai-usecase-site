import type { Metadata } from "next";
import { EnglishLegalDocumentView } from "@/components/legal/english-legal-document";
import { englishLegalDocuments } from "@/src/lib/legal/english";

const document = englishLegalDocuments.refund;

export const metadata: Metadata = {
  title: document.title,
  description: document.description,
  alternates: { canonical: "/legal/refund" },
  robots: { index: false, follow: false },
};

export default function RefundPage() {
  return <EnglishLegalDocumentView document={document} />;
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ContentProvider } from "@/src/content/content-context";
import { loadPublishedContent } from "@/src/content/load-published";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AI Use Case Hub",
    template: "%s | AI Use Case Hub",
  },
  description:
    "A structured workflow database for SMB operators — practical AI use cases mapped to data sources, APIs, and implementation paths.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const content = loadPublishedContent();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ContentProvider content={content}>
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
        </ContentProvider>
      </body>
    </html>
  );
}

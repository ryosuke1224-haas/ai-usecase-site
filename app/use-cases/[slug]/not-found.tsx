import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <p className="text-6xl font-bold text-accent/30">404</p>
      <h1 className="mt-4 text-2xl font-bold">Use case not found</h1>
      <p className="mt-2 text-muted">
        The use case you&apos;re looking for doesn&apos;t exist or may have been
        moved.
      </p>
      <Link
        href="/use-cases"
        className="mt-8 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
      >
        Browse all use cases
      </Link>
    </div>
  );
}

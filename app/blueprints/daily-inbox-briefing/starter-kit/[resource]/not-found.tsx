import Link from "next/link";
import { DAILY_INBOX_STARTER_KIT_PATH } from "@/src/lib/blueprints";

export default function StarterKitResourceNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Resource not found</h1>
      <p className="mt-3 text-sm text-muted">
        That Starter Kit resource does not exist.
      </p>
      <Link
        href={DAILY_INBOX_STARTER_KIT_PATH}
        className="mt-6 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
      >
        Back to Starter Kit
      </Link>
    </div>
  );
}

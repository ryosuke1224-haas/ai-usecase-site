import Link from "next/link";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/components/premium/shared/styles";

export function CheckoutSuccessView({
  title,
  body,
  entitled,
  confirmed,
  pending,
  openLabel,
  againLabel,
  kitPath,
  successPath,
}: {
  title: string;
  body: string;
  entitled: boolean;
  confirmed: string;
  pending: string;
  openLabel: string;
  againLabel: string;
  kitPath: string;
  successPath: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{body}</p>
      {entitled ? (
        <div className="mt-6">
          <p className="text-sm leading-relaxed text-foreground">{confirmed}</p>
          <Link href={kitPath} className={`mt-4 ${PRIMARY_BUTTON}`}>
            {openLabel}
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <p className="text-sm leading-relaxed text-foreground">{pending}</p>
          <Link href={successPath} className={`mt-4 ${SECONDARY_BUTTON}`}>
            {againLabel}
          </Link>
        </div>
      )}
    </div>
  );
}

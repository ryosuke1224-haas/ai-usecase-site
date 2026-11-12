import { CONTACT_EMAIL } from "@/src/lib/site";

export const US_BLUEPRINT_PRICE = "$49";

export const englishPurchaseLinks = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/refund", label: "Refunds" },
] as const;

export const englishPurchaseRefundNotice =
  "After access is granted, refunds for a change of mind are generally not available.";

export type EnglishLegalSection = {
  heading: string;
  body: string[];
};

export type EnglishLegalDocument = {
  slug: "terms" | "privacy" | "refund";
  title: string;
  description: string;
  sections: EnglishLegalSection[];
};

export const englishLegalDocuments: Record<EnglishLegalDocument["slug"], EnglishLegalDocument> = {
  terms: {
    slug: "terms",
    title: "Terms",
    description: "Terms for AI Use Case Atlas accounts and one-time digital Blueprints.",
    sections: [
      {
        heading: "Digital products",
        body: [
          "AI Use Case Atlas provides practical AI workflows and templates for small-business work.",
          `Premium Blueprints are one-time digital purchases. In the United States, each Premium Blueprint is ${US_BLUEPRINT_PRICE}. There is no subscription.`,
          "The price shown on the product page is the amount charged for that product. The site does not add a separate selling fee.",
        ],
      },
      {
        heading: "Account and access",
        body: [
          "You sign in with an email link. We do not collect a password.",
          "After Stripe confirms payment, access is granted to the signed-in account that paid. Nothing is shipped.",
          "The same entitlement opens the English and Japanese versions of that Blueprint. Access is for that account. Sharing or resale is not part of the purchase.",
          "You run the steps, check the numbers, and decide what to send.",
        ],
      },
      {
        heading: "AI output and your review",
        body: [
          "Blueprints provide workflows, prompts, guidance, and review suggestions. AI output may be incomplete or wrong.",
          "Review important results, including amounts, customer messages, contracts, and invoices, before you rely on them.",
          "We do not guarantee a specific sales, payment, or other business result.",
          "A product does not send email or take an external business action unless that product says it does.",
        ],
      },
      {
        heading: "Payment",
        body: [
          "Payment is completed on Stripe's payment page. Card numbers are not stored on AI Use Case Atlas servers.",
          "Refunds and cancellation are described in the refund policy.",
        ],
      },
      {
        heading: "Your responsibility",
        body: [
          "You decide whether to use an output, contact a customer, or act on a number.",
          "Where the law does not allow a limit on responsibility, that law controls.",
        ],
      },
      {
        heading: "Changes",
        body: [
          "If these terms change, the updated text will be posted on this page.",
          "Posting a change does not raise the price of access you have already purchased.",
        ],
      },
      {
        heading: "Contact",
        body: [`Questions about these terms can be sent to ${CONTACT_EMAIL}.`],
      },
    ],
  },
  privacy: {
    slug: "privacy",
    title: "Privacy",
    description: "Information AI Use Case Atlas handles for the current product.",
    sections: [
      {
        heading: "Account email",
        body: ["We use the email address you enter to send a sign-in link."],
      },
      {
        heading: "Sign-in",
        body: [
          "A signed-in session is kept with an authentication cookie.",
          "We do not collect a password. The sign-in link is sent to the email address you entered.",
        ],
      },
      {
        heading: "Purchases",
        body: [
          "We record the product you bought and whether that account has access.",
          "We do not receive your card number or security code. Stripe processes the payment.",
        ],
      },
      {
        heading: "Stripe",
        body: [
          "Stripe handles the charge, whether it succeeded, and a refund when one is issued. AI Use Case Atlas stores the product and the entitlement.",
        ],
      },
      {
        heading: "Supabase",
        body: ["Account records and entitlement records are stored in Supabase."],
      },
      {
        heading: "Operations",
        body: ["Basic access and error logs may be used to investigate abuse or fix failures."],
      },
      {
        heading: "Analytics",
        body: [
          "Google Analytics is loaded only when a measurement ID is configured.",
          "A Google ads tag is loaded only when an ads measurement ID is configured.",
          "When those IDs are not set, those scripts are not loaded.",
        ],
      },
      {
        heading: "Information we do not require",
        body: [
          "A phone number, postal address, location, or your real invoice data is not required to create an account or buy a Blueprint.",
          "Text you type into a Blueprint worksheet is used for that session. It is not collected as a customer ledger.",
        ],
      },
      {
        heading: "Contact",
        body: [`Questions about this policy can be sent to ${CONTACT_EMAIL}.`],
      },
    ],
  },
  refund: {
    slug: "refund",
    title: "Refunds",
    description: "Refunds and cancellation for one-time digital Blueprints.",
    sections: [
      {
        heading: "Before payment",
        body: ["A purchase is not final until you complete payment on Stripe. Closing that page before payment does not charge you."],
      },
      {
        heading: "After access is granted",
        body: [
          "Paid products are digital. After payment is confirmed, access is granted to the account that paid.",
          "After that access has been granted, we generally do not provide a refund because you changed your mind.",
        ],
      },
      {
        heading: "Refunds we review",
        body: [
          "The same purchase was charged more than once.",
          "A failure prevents us from delivering the access you purchased.",
          "A serious defect is not corrected within a reasonable time.",
          "Applicable law requires a refund or another remedy.",
        ],
      },
      {
        heading: "How to ask",
        body: [
          `Send a refund request to ${CONTACT_EMAIL}.`,
          "Include the email address on the account and the product name.",
        ],
      },
      {
        heading: "How a refund is returned",
        body: ["When a refund is approved, it is returned to the original payment method."],
      },
    ],
  },
};

export function englishLegalPlainText(): string {
  return Object.values(englishLegalDocuments)
    .flatMap((document) => document.sections.flatMap((section) => [section.heading, ...section.body]))
    .join("\n");
}

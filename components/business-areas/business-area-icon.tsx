import type { BusinessArea } from "@/src/lib/business-areas";

export function BusinessAreaIcon({
  area,
  className = "h-5 w-5",
}: {
  area: BusinessArea;
  className?: string;
}) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    viewBox: "0 0 24 24",
  };

  switch (area) {
    case "sales":
      return (
        <svg {...common}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 15v-3" />
          <path d="M12 15V8" />
          <path d="M16 15v-5" />
        </svg>
      );
    case "marketing":
      return (
        <svg {...common}>
          <path d="M4 12v6a2 2 0 0 0 2 2h3" />
          <path d="M20 8l-8 4-8-4 8-4 8 4z" />
          <path d="M12 12v8" />
        </svg>
      );
    case "customer-service":
      return (
        <svg {...common}>
          <path d="M4 10a8 8 0 0 1 16 0v4a3 3 0 0 1-3 3h-1" />
          <path d="M4 12v2a2 2 0 0 0 2 2h1" />
          <path d="M20 12v2a2 2 0 0 1-2 2h-1" />
          <path d="M9 19h6" />
        </svg>
      );
    case "operations":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2" />
          <path d="M12 19v2" />
          <path d="M3 12h2" />
          <path d="M19 12h2" />
          <path d="M5.6 5.6l1.4 1.4" />
          <path d="M17 17l1.4 1.4" />
          <path d="M5.6 18.4l1.4-1.4" />
          <path d="M17 7l1.4-1.4" />
        </svg>
      );
    case "finance-accounting":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 15h3" />
        </svg>
      );
    case "people-hr":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" />
          <path d="M15 19c0-2 1.5-3.5 4-3.5" />
        </svg>
      );
    case "administration":
      return (
        <svg {...common}>
          <path d="M8 4h8a2 2 0 0 1 2 2v14l-6-3-6 3V6a2 2 0 0 1 2-2z" />
          <path d="M10 9h4" />
          <path d="M10 13h4" />
        </svg>
      );
  }
}

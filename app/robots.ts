import type { MetadataRoute } from "next";
import { isComingSoonMode } from "@/src/lib/site-mode";
import { SITE_URL } from "@/src/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (isComingSoonMode()) {
    return {
      rules: {
        userAgent: "*",
        allow: ["/", "/contact"],
        disallow: [
          "/business-areas",
          "/find-workflows",
          "/use-cases",
          "/apis",
          "/data-sources",
          "/workflow-ideas",
        ],
      },
      sitemap: `${SITE_URL}/sitemap.xml`,
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

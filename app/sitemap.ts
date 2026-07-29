import type { MetadataRoute } from "next";
import {
  getAllApiSlugs,
  getAllDataSourceSlugs,
  getAllUseCaseSlugs,
} from "@/src/content/load-published";
import { BUSINESS_AREAS } from "@/src/lib/business-areas";
import { isComingSoonMode } from "@/src/lib/site-mode";
import { SITE_URL } from "@/src/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  if (isComingSoonMode()) {
    return [
      {
        url: SITE_URL,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 1,
      },
      {
        url: `${SITE_URL}/contact`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.5,
      },
    ];
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/business-areas",
    "/use-cases",
    "/find-workflows",
    "/apis",
    "/data-sources",
    "/workflow-ideas",
    "/contact",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : path === "/business-areas" ? 0.9 : 0.8,
  }));

  const businessAreaRoutes: MetadataRoute.Sitemap = BUSINESS_AREAS.map(
    (slug) => ({
      url: `${SITE_URL}/business-areas/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }),
  );

  const useCaseRoutes: MetadataRoute.Sitemap = getAllUseCaseSlugs().map(
    (slug) => ({
      url: `${SITE_URL}/use-cases/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    }),
  );

  const apiRoutes: MetadataRoute.Sitemap = getAllApiSlugs().map((slug) => ({
    url: `${SITE_URL}/apis/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const dataSourceRoutes: MetadataRoute.Sitemap = getAllDataSourceSlugs().map(
    (slug) => ({
      url: `${SITE_URL}/data-sources/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    }),
  );

  return [
    ...staticRoutes,
    ...businessAreaRoutes,
    ...useCaseRoutes,
    ...apiRoutes,
    ...dataSourceRoutes,
  ];
}

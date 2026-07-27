import type { MetadataRoute } from "next";
import {
  getAllApiSlugs,
  getAllDataSourceSlugs,
  getAllUseCaseSlugs,
} from "@/src/content/load-published";
import { SITE_URL } from "@/src/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/find-workflows",
    "/use-cases",
    "/apis",
    "/data-sources",
    "/workflow-ideas",
    "/contact",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "weekly",
    priority: path === "" ? 1 : path === "/find-workflows" ? 0.9 : 0.8,
  }));

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
    ...useCaseRoutes,
    ...apiRoutes,
    ...dataSourceRoutes,
  ];
}

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProjectDashboard } from "@/components/admin/project-dashboard";
import { adminAccessDecision, parseAdminAllowlist } from "@/src/lib/admin/access";
import { loadConsole } from "@/src/lib/admin/load-console";
import { loadOperationsDashboard } from "@/src/lib/admin/load-dashboard";
import { adminProjectHref, parseAdminSection, parseDashboardRange } from "@/src/lib/admin/range";
import { getCurrentUser } from "@/src/lib/auth";
import { authPath } from "@/src/lib/blueprints";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Operations",
  robots: { index: false, follow: false },
};

export default async function AdminProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; section?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const range = parseDashboardRange(params.range);
  const section = parseAdminSection(params.section);
  const user = await getCurrentUser();
  const decision = adminAccessDecision(user, parseAdminAllowlist(process.env.ATLAS_ADMIN_EMAILS));
  if (decision === "anonymous" || !user) redirect(authPath(adminProjectHref(section, range)));
  if (decision !== "allow") notFound();

  const [model, consoleData] = await Promise.all([
    loadOperationsDashboard({ range, viewerEmail: user.email ?? "" }),
    loadConsole(),
  ]);
  return <ProjectDashboard model={model} section={section} consoleData={consoleData} notice={params.notice ?? null} />;
}

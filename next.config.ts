import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // typedRoutes was ON in P1-01 and is OFF as of the Dev A + Dev B merge.
  //
  // It works, and it did its job: it found 7 real dangling link targets in Dev B's
  // UI (/privacy, /terms, /refund-policy, /contact, /courses, /posh-act,
  // /learn/[courseSlug]). But all 7 are routes that are *planned and unbuilt*, not
  // typos — so with three developers cross-linking into each other's lanes, the
  // only ways to keep it on are fake route stubs or a dozen `as Route` casts that
  // rot into lies. Both are worse than the check is worth mid-build.
  //
  // ⚠️ P12-02 re-enables this and requires zero dangling routes before launch.
  //    The 7 above are tracked in orchestrate/tasks.md under DANGLING ROUTES.
  // typedRoutes: true,

  // Don't advertise the framework version.
  poweredByHeader: false,

  // Dev B (P10-02 / P7-05): @react-pdf/renderer must stay out of the server
  // bundle or the certificate and invoice PDF routes fail to build.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;

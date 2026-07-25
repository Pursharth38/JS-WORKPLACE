import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Route namespacing in CLAUDE.md is a contract between three developers.
  // typedRoutes makes a typo in an href a compile error rather than a 404.
  typedRoutes: true,

  // Don't advertise the framework version.
  poweredByHeader: false,
};

export default nextConfig;

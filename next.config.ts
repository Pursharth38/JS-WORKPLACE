// ⚠️ FILE OWNER: DEV A (task P1-01). Minimal placeholder created by DEV B.
//    On merge: take Dev A's version wholesale.
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  // @react-pdf/renderer and the R2 SDK must stay external to the server bundle.
  serverExternalPackages: ['@react-pdf/renderer'],
}

export default nextConfig

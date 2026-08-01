import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: false, // registered manually in app/register-sw.tsx, scoped to when it's actually useful
  fallbacks: { document: "/offline" },
  workboxOptions: {
    // Mutable data is RLS-scoped and there's no offline mutation-queue in
    // this app — never cache API/RPC calls, only precache the Next build
    // and cache-first the static assets Workbox already discovers.
    runtimeCaching: [
      {
        urlPattern: /^\/api\/.*/,
        handler: "NetworkOnly",
      },
    ],
  },
});

const nextConfig: NextConfig = {};

export default withPWA(nextConfig);

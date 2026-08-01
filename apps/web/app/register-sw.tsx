"use client";

import { useEffect } from "react";

// Mirrors the "never block the caller" posture already used for external
// lookups (packages/intervention/src/sirene.ts): an unsupported browser or
// a registration failure should never surface to the user, it just means
// the app stays a plain website for that visit.
export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}

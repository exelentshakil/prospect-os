"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Opt out from the browser console with:
//   localStorage.setItem('disable_tracking', 'true')

export function TrafficTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem("disable_tracking") === "true") return;
      const key = `tracked:${pathname}`;
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      return;
    }

    const send = (ip?: string) => {
      fetch("/api/traffic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: pathname,
          ip,
          userAgent: navigator.userAgent,
          referrer: document.referrer,
        }),
        keepalive: true,
      }).catch(() => {});
    };

    fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(2500) })
      .then((r) => r.json())
      .then((d: { ip?: string }) => send(d.ip))
      .catch(() => send());
  }, [pathname]);

  return null;
}

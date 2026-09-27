"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { appUrl } from "@/lib/app-links";

const KEY = "operra_vid";

/** A random, first-party visitor id (per browser), or null where storage is blocked. */
function visitorId(): string | null {
  try {
    let id = localStorage.getItem(KEY);
    if (!id || !/^[a-z0-9-]{8,64}$/.test(id)) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/**
 * Reports page views to the Operra app (its control center shows visits and the sign-up funnel) and
 * adds the visitor id to links into the app, so a visit and the sign-up that follows line up.
 * No cookies, no third parties; does nothing when NEXT_PUBLIC_APP_URL isn't set.
 */
export function VisitTracker({ lang }: { lang: string }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!appUrl) return;
    const vid = visitorId();
    if (!vid) return;
    const params = new URLSearchParams(window.location.search);
    const body = JSON.stringify({
      vid,
      path: pathname,
      ref: document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : "",
      utm: params.get("utm_source") ?? "",
      lang,
    });
    try {
      navigator.sendBeacon(`${appUrl}/api/t`, new Blob([body], { type: "text/plain" }));
    } catch {
      /* best effort */
    }
  }, [pathname, lang]);

  useEffect(() => {
    if (!appUrl) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !a.href.startsWith(appUrl)) return;
      const vid = visitorId();
      if (!vid) return;
      const url = new URL(a.href);
      if (!url.searchParams.has("vid")) {
        url.searchParams.set("vid", vid);
        a.href = url.toString();
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}

"use client";

import { useEffect, useState, type ReactNode } from "react";

const PREVIEW_HIDDEN = "operra:track-hidden";

/**
 * Wraps the getting-started track. Real sessions hide it with a server action (a cookie); preview
 * sessions refuse every server action, so there it's hidden for this tab only, like the guided tour.
 */
export function TrackFrame({ preview, children }: { preview: boolean; children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    // Reading tab storage after mount keeps the server and first client render identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (preview && sessionStorage.getItem(PREVIEW_HIDDEN)) setHidden(true);
  }, [preview]);
  if (hidden) return null;
  return <div data-track-frame>{children}</div>;
}

/** "Hide" for preview sessions. */
export function PreviewHideButton({ label, className }: { label: string; className: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        sessionStorage.setItem(PREVIEW_HIDDEN, "1");
        e.currentTarget.closest("[data-track-frame]")?.remove();
      }}
    >
      {label}
    </button>
  );
}

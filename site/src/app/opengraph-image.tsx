import { ImageResponse } from "next/og";

export const alt = "Operra — Everything moving. Nothing lost. The operating system for agencies.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Deck-cover treatment from the brand system: panel ground, the Live O cropped huge off the right edge. */
// Uses the renderer's built-in sans (it can't read the site's WOFF2 files).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#121519",
          color: "#F6F6F3",
          overflow: "hidden",
        }}
      >
        <svg width="640" height="640" viewBox="0 0 64 64" style={{ position: "absolute", right: -100, top: -5 }}>
          <path d="M51.32 26.82 A20 20 0 1 1 37.18 12.68" fill="none" stroke="#262B33" strokeWidth="10" />
          <circle cx="46.14" cy="17.86" r="5" fill="#FF5A1F" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, width: "100%" }}>
          <svg width="186" height="54" viewBox="-8 4 268 78">
            <path d="M35.45 31.86 A16 16 0 1 1 24.14 20.55" fill="none" stroke="#F6F6F3" strokeWidth="8" />
            <circle cx="31.31" cy="24.69" r="4" fill="#FF5A1F" />
            <g fill="none" stroke="#F6F6F3" strokeWidth="8">
              <path d="M54 16 V74" />
              <circle cx="70" cy="36" r="16" />
              <path d="M104 36 H136 A16 16 0 1 0 132.26 46.28" />
              <path d="M154 16 V56 M154 36 A16 16 0 0 1 170 20 H175" />
              <path d="M185 16 V56 M185 36 A16 16 0 0 1 201 20 H206" />
              <circle cx="232" cy="36" r="16" />
              <path d="M248 16 V56" />
            </g>
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ fontSize: 84, fontWeight: 600, letterSpacing: -3, lineHeight: 1, maxWidth: 820 }}>
              Everything moving. Nothing lost.
            </div>
            <div style={{ fontSize: 22, letterSpacing: 3, color: "#A3A8B1" }}>
              THE OPERATING SYSTEM FOR AGENCIES
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}

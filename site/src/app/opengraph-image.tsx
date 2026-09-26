import { ImageResponse } from "next/og";

export const alt = "Operra — the operating system for modern agencies";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#0b0b0c",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="#e8dcc8" />
            <path d="M22.4 11.2A8 8 0 1 0 24 16" fill="none" stroke="#0b0b0c" strokeWidth="3.2" strokeLinecap="round" />
            <circle cx="24" cy="11.2" r="2.4" fill="#0b0b0c" />
          </svg>
          <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1.5 }}>Operra</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 76, fontWeight: 600, letterSpacing: -3, lineHeight: 1.04, maxWidth: 950 }}>
            The operating system for modern agencies.
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 26, color: "rgba(255,255,255,0.6)" }}>
            Client → Project → Module → Task → Review → Approval → Delivery
          </div>
        </div>
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";

export const alt = "Operra: Everything moving. Nothing lost. The operating system for agencies.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Share card: lapis ground, the Kashida mark large off the trailing edge, wordmark and tagline in bone. */
// Uses the renderer's built-in sans (it can't read the site's WOFF2 files).
const BARS = [1, 1, 1, 0.62, 0.3];

function Bars({ size, fill }: { size: number; fill: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <clipPath id="c">
          <circle cx="32" cy="32" r="30" />
        </clipPath>
      </defs>
      <g clipPath="url(#c)" fill={fill}>
        {BARS.map((w, i) => (
          <rect key={i} x={w === 1 ? -6 : -4.5} y={2 + i * 12.6} width={w === 1 ? 76 : 64 * w + 4.5} height="9" rx="4.5" />
        ))}
      </g>
    </svg>
  );
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#1F3FBF", color: "#F7F7F4", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -140, top: -10, display: "flex" }}>
          <Bars size={650} fill="#3D58CC" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Bars size={58} fill="#F7F7F4" />
            <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: -2 }}>operra</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            <div style={{ fontSize: 86, fontWeight: 700, letterSpacing: -3.5, lineHeight: 1, maxWidth: 820 }}>Everything moving. Nothing lost.</div>
            <div style={{ display: "flex", width: 560, height: 12, borderRadius: 6, background: "#F7F7F4" }} />
            <div style={{ fontSize: 28, color: "#C7D0FA" }}>The operating system for agencies</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}

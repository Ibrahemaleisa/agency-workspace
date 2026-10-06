import { ImageResponse } from "next/og";
import { getBrand, getLogoDataUrl } from "@/lib/brand";

/** Browser-tab icon in the agency's colours: its logo, or its initial. */
export const size = { width: 64, height: 64 };
export const contentType = "image/png";
// Re-render on request so brand changes show up without a redeploy.
export const dynamic = "force-dynamic";

export default async function Icon() {
  const brand = await getBrand();
  const logo = await getLogoDataUrl(brand.orgId);
  const raster = logo && /^data:image\/(png|jpeg);/.test(logo) ? logo : null;
  const initial = [...brand.name.en.trim()][0]?.toUpperCase() ?? "•";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          background: raster ? "white" : brand.primary,
          color: brand.accent,
          fontSize: 40,
          fontWeight: 700,
        }}
      >
        {raster ? <img src={raster} alt="" width={56} height={56} style={{ objectFit: "contain" }} /> : initial}
      </div>
    ),
    size,
  );
}

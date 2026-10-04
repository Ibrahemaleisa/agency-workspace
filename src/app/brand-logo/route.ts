import { getLogoDataUrl } from "@/lib/brand";

/**
 * GET /brand-logo?v=<hash> — the agency's uploaded logo.
 * Pages link here instead of inlining the data: URL, and the hash in the URL changes with the logo,
 * so browsers can cache it for a long time.
 */
export async function GET() {
  const logo = await getLogoDataUrl();
  const match = logo?.match(/^data:(image\/(?:png|jpeg|webp|svg\+xml));base64,(.+)$/);
  if (!match) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(match[2], "base64"), {
    headers: {
      "Content-Type": match[1],
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      // SVG logos are only ever shown via <img>; never let one run as a document.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}

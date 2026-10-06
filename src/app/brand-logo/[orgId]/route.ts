import { getLogoDataUrl } from "@/lib/brand";
import { isUuid } from "@/lib/access";

/**
 * GET /brand-logo/{orgId}?v=<hash> — an agency's uploaded logo. Pages link here instead of
 * inlining the data URL; the hash in the URL changes with the logo, so browsers cache it long.
 * Logos are public: they already appear on each agency's sign-in page.
 */
export async function GET(_req: Request, ctx: RouteContext<"/brand-logo/[orgId]">) {
  const { orgId } = await ctx.params;
  const logo = isUuid(orgId) ? await getLogoDataUrl(orgId) : null;
  const match = logo?.match(/^data:(image\/(?:png|jpeg|webp|svg\+xml));base64,(.+)$/);
  if (!match) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(match[2], "base64"), {
    headers: {
      "Content-Type": match[1],
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      // SVG logos are only shown through <img>; never let one run as a document.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}

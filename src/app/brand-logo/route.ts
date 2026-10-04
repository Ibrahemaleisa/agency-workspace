import { getBrandLogo } from "@/lib/brand";

/** The agency's logo. Pages link to it with ?v=<hash>, so it can be cached for good. */
export async function GET(req: Request) {
  const logo = await getBrandLogo();
  if (!logo) return new Response("Not found", { status: 404 });
  const versioned = new URL(req.url).searchParams.has("v");
  return new Response(new Uint8Array(logo.bytes), {
    headers: {
      "Content-Type": logo.type,
      "Cache-Control": versioned ? "public, max-age=31536000, immutable" : "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
      // (next.config.ts adds a sandboxing Content-Security-Policy for this route.)
    },
  });
}

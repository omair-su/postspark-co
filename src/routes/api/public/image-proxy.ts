/**
 * Same-origin image byte proxy.
 *
 * Canvas features in the Image Studio (watermark, brand logo lock, platform
 * export pack) need pixel access. Remote render hosts don't always send usable
 * CORS headers, which taints the canvas and makes `toDataURL()` throw — the old
 * code swallowed that and silently returned the untouched image, so users
 * thought the feature "turned itself off".
 *
 * Fetching the bytes through this route makes them same-origin, so the canvas is
 * never tainted. Security: the host must be on the allowlist below, the response
 * must be an image, and the payload is size-capped. No credentials, no user data.
 */
import { createFileRoute } from "@tanstack/react-router";
import { safeFetch, isSafePublicUrl } from "@/lib/safeFetch";

const MAX_BYTES = 20 * 1024 * 1024;

/** Hosts we ever render images from. Keeps this from being an open proxy. */
const ALLOWED_SUFFIXES = [
  ".supabase.co",
  ".supabase.in",
  "replicate.delivery",
  ".replicate.delivery",
  "oaidalleapiprodscus.blob.core.windows.net",
  "videos.openai.com",
  "images.unsplash.com",
  "images.pexels.com",
  "lovable.dev",
  ".lovable.app",
];

function hostAllowed(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return ALLOWED_SUFFIXES.some((s) => (s.startsWith(".") ? h.endsWith(s) : h === s || h.endsWith(`.${s}`)));
}

export const Route = createFileRoute("/api/public/image-proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const raw = new URL(request.url).searchParams.get("url") || "";
        if (!raw || !isSafePublicUrl(raw)) return new Response("Bad url", { status: 400 });

        let host: string;
        try {
          host = new URL(raw).hostname;
        } catch {
          return new Response("Bad url", { status: 400 });
        }
        if (!hostAllowed(host)) return new Response("Host not allowed", { status: 403 });

        let upstream: Response;
        try {
          upstream = await safeFetch(raw, { redirect: "manual" });
        } catch {
          return new Response("Fetch failed", { status: 502 });
        }
        if (!upstream.ok) return new Response("Upstream error", { status: 502 });

        const type = upstream.headers.get("content-type") || "";
        if (!type.startsWith("image/")) return new Response("Not an image", { status: 415 });

        const len = Number(upstream.headers.get("content-length") || "0");
        if (len && len > MAX_BYTES) return new Response("Image too large", { status: 413 });

        const bytes = await upstream.arrayBuffer();
        if (bytes.byteLength > MAX_BYTES) return new Response("Image too large", { status: 413 });

        return new Response(bytes, {
          headers: {
            "Content-Type": type,
            "Cache-Control": "public, max-age=3600",
            "Content-Length": String(bytes.byteLength),
          },
        });
      },
    },
  },
});

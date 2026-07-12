import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_HOSTS = new Set([
  "images.unsplash.com",
  "plus.unsplash.com",
  "unsplash.com",
  "images.pexels.com",
  "videos.pexels.com",
  "www.pexels.com",
  "pexels.com",
]);

function safeFilename(name: string, fallback: string): string {
  const clean = (name || "").replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "");
  return clean || fallback;
}

/**
 * Server-side proxy that streams a stock photo/video with
 * Content-Disposition: attachment so the browser downloads it in-app
 * instead of navigating to the provider. Only whitelisted hosts allowed.
 */
export const Route = createFileRoute("/api/public/stock-download")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const target = url.searchParams.get("url");
        const filename = url.searchParams.get("filename") || "postspark-download";
        if (!target) return new Response("Missing url", { status: 400 });

        let parsed: URL;
        try {
          parsed = new URL(target);
        } catch {
          return new Response("Invalid url", { status: 400 });
        }
        if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.hostname)) {
          return new Response("Host not allowed", { status: 403 });
        }

        const upstream = await fetch(parsed.toString(), {
          headers: { "User-Agent": "PostSpark-StockProxy/1.0" },
        });
        if (!upstream.ok || !upstream.body) {
          return new Response(`Upstream ${upstream.status}`, { status: 502 });
        }

        const contentType = upstream.headers.get("content-type") || "application/octet-stream";
        const ext =
          contentType.includes("mp4") ? "mp4"
          : contentType.includes("webm") ? "webm"
          : contentType.includes("png") ? "png"
          : contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg"
          : "bin";
        const finalName = /\.[a-z0-9]{2,4}$/i.test(filename)
          ? safeFilename(filename, `postspark.${ext}`)
          : `${safeFilename(filename, "postspark")}.${ext}`;

        return new Response(upstream.body, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${finalName}"`,
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

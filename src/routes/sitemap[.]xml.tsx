import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SITE = "https://postspark.co";

// Note: /onboarding, /reset-password, /unsubscribe, and /auth/callback are
// intentionally excluded — they are private user-flow pages disallowed in
// robots.txt and should not be indexed.
const STATIC_ROUTES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/pricing", priority: "0.9", changefreq: "monthly" },
  { path: "/gallery", priority: "0.8", changefreq: "daily" },
  { path: "/blog", priority: "0.9", changefreq: "daily" },
  { path: "/rss.xml", priority: "0.5", changefreq: "daily" },
  { path: "/features/repurpose-blog-to-social", priority: "0.8", changefreq: "monthly" },
  { path: "/features/youtube-to-tweets", priority: "0.8", changefreq: "monthly" },
  { path: "/features/linkedin-post-generator", priority: "0.8", changefreq: "monthly" },
  { path: "/for/creators", priority: "0.8", changefreq: "monthly" },
  { path: "/for/agencies", priority: "0.8", changefreq: "monthly" },
  { path: "/changelog", priority: "0.6", changefreq: "weekly" },
  { path: "/roadmap", priority: "0.6", changefreq: "weekly" },
  { path: "/signup", priority: "0.6", changefreq: "monthly" },
  { path: "/login", priority: "0.4", changefreq: "yearly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
  { path: "/refunds", priority: "0.3", changefreq: "yearly" },
];

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === "'" ? "&apos;" : "&quot;"
  );
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = new Date().toISOString().slice(0, 10);

        const urls: string[] = STATIC_ROUTES.map(
          (r) =>
            `<url><loc>${SITE}${r.path}</loc><lastmod>${today}</lastmod><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`
        );

        try {
          const { data: jobs } = await supabaseAdmin
            .from("repurpose_jobs")
            .select("public_slug, created_at")
            .eq("is_public", true)
            .not("public_slug", "is", null)
            .order("created_at", { ascending: false })
            .limit(1000);

          for (const j of jobs || []) {
            if (!j.public_slug) continue;
            const lastmod = (j.created_at || new Date().toISOString()).slice(0, 10);
            urls.push(
              `<url><loc>${SITE}/gallery/${escapeXml(j.public_slug)}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`
            );
          }
        } catch (e) {
          console.error("sitemap: gallery fetch failed", e);
        }

        try {
          const { data: posts } = await supabaseAdmin
            .from("blog_posts")
            .select("slug, updated_at, published_at")
            .eq("status", "published")
            .order("published_at", { ascending: false })
            .limit(1000);

          for (const p of posts || []) {
            const lastmod = (p.updated_at || p.published_at || new Date().toISOString()).slice(0, 10);
            urls.push(
              `<url><loc>${SITE}/blog/${escapeXml(p.slug)}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`
            );
          }

          const { data: cats } = await supabaseAdmin.from("blog_categories").select("slug");
          for (const c of cats || []) {
            urls.push(
              `<url><loc>${SITE}/blog/category/${escapeXml(c.slug)}</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>`
            );
          }
        } catch (e) {
          console.error("sitemap: blog fetch failed", e);
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

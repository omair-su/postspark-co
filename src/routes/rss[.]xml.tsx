import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SITE = "https://postspark.co";

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === "'" ? "&apos;" : "&quot;"
  );
}

export const Route = createFileRoute("/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { data: posts } = await supabaseAdmin
          .from("blog_posts")
          .select("slug, title, excerpt, published_at, author:blog_authors(name)")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(50);

        const items = (posts || [])
          .map((p) => {
            const link = `${SITE}/blog/${p.slug}`;
            const pubDate = p.published_at ? new Date(p.published_at).toUTCString() : new Date().toUTCString();
            const author = (p.author as unknown as { name: string } | null)?.name ?? "PostSpark Team";
            return `<item>
  <title>${escapeXml(p.title)}</title>
  <link>${link}</link>
  <guid>${link}</guid>
  <pubDate>${pubDate}</pubDate>
  <description>${escapeXml(p.excerpt)}</description>
  <author>hello@postspark.co (${escapeXml(author)})</author>
</item>`;
          })
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>PostSpark Blog</title>
  <link>${SITE}/blog</link>
  <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
  <description>Frameworks, tutorials, and case studies on AI content repurposing.</description>
  <language>en-us</language>
${items}
</channel>
</rss>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

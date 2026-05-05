import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

/**
 * Render markdown to HTML.
 *
 * Blog post content is authored by admins only (RLS allows insert via
 * supabaseAdmin / migrations only — no user-generated input), so we trust
 * the markdown source. We still strip <script> tags and inline event
 * handlers as a defense-in-depth measure.
 */
export function renderMarkdown(md: string): string {
  const rawHtml = marked.parse(md, { async: false }) as string;
  return rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

// Tags fully removed (including their content)
const FORBIDDEN_TAGS_WITH_CONTENT = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "noscript",
  "template",
  "form",
];

// Tags whose opening/closing tags are stripped but inner content kept
const FORBIDDEN_TAGS_KEEP_CONTENT = ["base", "meta", "link"];

/**
 * Render markdown to HTML.
 *
 * Blog post content is authored by admins only (RLS allows insert via
 * supabaseAdmin / migrations only — no user-generated input). This
 * sanitizer is defense-in-depth against future regressions where user
 * input might reach the renderer.
 */
export function renderMarkdown(md: string): string {
  const rawHtml = marked.parse(md, { async: false }) as string;
  let html = rawHtml;

  // Strip forbidden tags + their content
  for (const tag of FORBIDDEN_TAGS_WITH_CONTENT) {
    html = html.replace(
      new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}\\s*>`, "gi"),
      ""
    );
    // Self-closing/unclosed variants
    html = html.replace(new RegExp(`<${tag}\\b[^>]*/?>`, "gi"), "");
  }

  // Strip forbidden tags but keep content
  for (const tag of FORBIDDEN_TAGS_KEEP_CONTENT) {
    html = html.replace(new RegExp(`</?${tag}\\b[^>]*>`, "gi"), "");
  }

  // Remove ALL event handler attributes (quoted, single-quoted, and unquoted)
  html = html
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "");

  // Block dangerous URL schemes in href/src/xlink:href/formaction/srcdoc
  html = html.replace(
    /\s(href|src|xlink:href|formaction|srcdoc|action)\s*=\s*("|')\s*(javascript|vbscript|data)\s*:[^"']*\2/gi,
    ""
  );
  html = html.replace(
    /\s(href|src|xlink:href|formaction|srcdoc|action)\s*=\s*(javascript|vbscript|data):[^\s>]*/gi,
    ""
  );

  return html;
}

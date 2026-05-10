import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

marked.setOptions({ gfm: true, breaks: false });

/**
 * Render markdown to safe HTML using DOMPurify with a strict allowlist.
 * Blocks <script>, <iframe>, <object>, <embed>, <base>, event handlers,
 * and javascript:/data: URLs (except safe images).
 */
export function renderMarkdown(md: string): string {
  const rawHtml = marked.parse(md, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "iframe", "object", "embed", "base", "form"],
    FORBID_ATTR: ["style", "srcdoc", "formaction"],
  });
}

import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

marked.setOptions({ gfm: true, breaks: false });

/**
 * Render markdown to sanitized HTML.
 *
 * Blog post content is admin-authored only, but we still pass the rendered
 * HTML through DOMPurify with an explicit allowlist as defense-in-depth.
 * The previous regex-based sanitizer was bypassable via tag/attribute
 * separators like `<svg/onload=...>` and missed SVG event vectors.
 */
const ALLOWED_TAGS = [
  "a", "abbr", "b", "blockquote", "br", "code", "em", "h1", "h2", "h3", "h4",
  "h5", "h6", "hr", "i", "img", "li", "ol", "p", "pre", "s", "small", "span",
  "strong", "sub", "sup", "table", "tbody", "td", "th", "thead", "tr", "u", "ul",
  "figure", "figcaption",
];

const ALLOWED_ATTR = [
  "href", "title", "alt", "src", "width", "height", "target", "rel",
  "class", "id", "colspan", "rowspan", "align",
];

export function renderMarkdown(md: string): string {
  const rawHtml = marked.parse(md, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form", "svg", "math"],
    FORBID_ATTR: ["style", "onerror", "onload", "onclick"],
  });
}

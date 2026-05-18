import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

marked.setOptions({ gfm: true, breaks: false });

/**
 * Render markdown to sanitized HTML.
 *
 * Blog post content is admin-authored only, but the rendered HTML is still
 * passed through sanitize-html with an explicit allowlist as
 * defense-in-depth. The previous regex sanitizer was bypassable via
 * `<svg/onload=...>` and similar tag/attr separator tricks.
 */
export function renderMarkdown(md: string): string {
  const rawHtml = marked.parse(md, { async: false }) as string;
  return sanitizeHtml(rawHtml, {
    allowedTags: [
      "a", "abbr", "b", "blockquote", "br", "code", "em", "h1", "h2", "h3",
      "h4", "h5", "h6", "hr", "i", "img", "li", "ol", "p", "pre", "s",
      "small", "span", "strong", "sub", "sup", "table", "tbody", "td", "th",
      "thead", "tr", "u", "ul", "figure", "figcaption",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      "*": ["class", "id"],
      td: ["colspan", "rowspan", "align"],
      th: ["colspan", "rowspan", "align"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https"] },
    disallowedTagsMode: "discard",
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  });
}

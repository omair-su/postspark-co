export interface ImportResult {
  text: string;
  title?: string;
  source?: string;
  error?: string;
}

/** Strip HTML to plain text without external deps. Worker-safe. */
function stripHtml(html: string): { text: string; title?: string } {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch?.[1]?.trim();

  // Remove script, style, nav, footer, header, aside
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ");

  // Try to grab <article> or <main> if present
  const articleMatch = cleaned.match(/<article[\s\S]*?<\/article>/i);
  const mainMatch = cleaned.match(/<main[\s\S]*?<\/main>/i);
  const body = articleMatch?.[0] || mainMatch?.[0] || cleaned;

  // Block-level newlines
  const withBreaks = body
    .replace(/<\/(p|div|li|h[1-6]|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

  const text = withBreaks
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();

  return { text, title };
}

/** Block private, loopback, link-local, and cloud metadata hosts to prevent SSRF. */
export function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".internal") ||
    h.endsWith(".local")
  ) return true;
  // IPv6 loopback / unspecified / link-local / unique-local
  if (h === "::1" || h === "::" || h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
  // IPv4 dotted
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)];
    if (a === 0) return true;                          // 0.0.0.0/8
    if (a === 10) return true;                         // 10.0.0.0/8
    if (a === 127) return true;                        // loopback
    if (a === 169 && b === 254) return true;           // link-local + AWS/GCP/Azure metadata
    if (a === 172 && b >= 16 && b <= 31) return true;  // 172.16.0.0/12
    if (a === 192 && b === 168) return true;           // 192.168.0.0/16
    if (a >= 224) return true;                         // multicast / reserved
  }
  return false;
}

export async function scrapeUrl(url: string): Promise<ImportResult> {
  try {
    // Special handling for YouTube — page HTML is heavily JS-rendered and bot-blocked.
    // Use oEmbed for title/author + try to fetch transcript metadata via the watch page.
    const ytId = extractYouTubeId(url);
    if (ytId) {
      const yt = await fetchYouTube(ytId, url);
      if (yt.text) return yt;
      // fall through to normal scraping if YouTube returned nothing useful
    }

    let currentUrl = url;
    let res: Response | null = null;

    // Manually follow redirects, re-validating the host on each hop to prevent SSRF.
    for (let hop = 0; hop < 5; hop++) {
      const u = new URL(currentUrl);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return { text: "", error: "Only http/https URLs are supported." };
      }
      if (isBlockedHost(u.hostname)) {
        return { text: "", error: "URL not allowed." };
      }

      res = await fetch(currentUrl, {
        headers: {
          // Real browser UA — many sites (Medium, Substack, news sites) block bot UAs.
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "manual",
      });

      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) return { text: "", error: "Redirect without Location header." };
        currentUrl = new URL(loc, currentUrl).toString();
        continue;
      }
      break;
    }

    if (!res) return { text: "", error: "Failed to fetch URL." };

    if (!res.ok) {
      return { text: "", error: `Site returned ${res.status}. It may block scrapers — try pasting the text directly.` };
    }

    const ct = (res.headers.get("content-type") || "").toLowerCase();
    // Be permissive — many sites return text/plain or omit content-type.
    if (ct && !ct.includes("text/") && !ct.includes("xml") && !ct.includes("html") && !ct.includes("json")) {
      return { text: "", error: "URL did not return text content." };
    }

    const html = await res.text();
    const { text, title } = stripHtml(html);

    if (text.length < 50) {
      return { text: "", error: "Could not extract readable content from this page." };
    }

    // Cap to keep prompts manageable
    const capped = text.length > 40000 ? text.slice(0, 40000) + "\n\n[…truncated]" : text;

    return { text: capped, title, source: url };
  } catch (err) {
    console.error("scrapeUrl error:", err);
    return { text: "", error: "Failed to fetch URL." };
  }
}

/** Pull a YouTube video ID from any common URL form, or null. */
function extractYouTubeId(input: string): string | null {
  try {
    const u = new URL(input);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(embed|shorts|v|live)\/([^/?#]+)/);
      if (m) return m[2];
    }
  } catch {}
  return null;
}

/**
 * Fetch metadata + best-effort transcript for a YouTube video.
 * - oEmbed gives us title + author (always works, no API key).
 * - Try the timedtext endpoint for an auto-generated English transcript.
 *   When unavailable, we still return a useful summary (title + channel + URL)
 *   so the user can repurpose the video idea instead of failing outright.
 */
async function fetchYouTube(videoId: string, originalUrl: string): Promise<ImportResult> {
  let title = "";
  let author = "";
  let description = "";

  try {
    const oembed = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${videoId}`,
      )}&format=json`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
    );
    if (oembed.ok) {
      const j: any = await oembed.json();
      title = j.title || "";
      author = j.author_name || "";
    }
  } catch (e) {
    console.warn("YouTube oEmbed failed:", e);
  }

  // Attempt transcript via public timedtext endpoint.
  let transcript = "";
  for (const lang of ["en", "en-US", "en-GB"]) {
    try {
      const r = await fetch(
        `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}`,
        { headers: { "User-Agent": "Mozilla/5.0" } },
      );
      if (r.ok) {
        const xml = await r.text();
        if (xml && xml.includes("<text")) {
          transcript = xml
            .replace(/<text[^>]*>/g, "\n")
            .replace(/<\/text>/g, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&nbsp;/g, " ")
            .replace(/[ \t]+/g, " ")
            .replace(/\n\s*\n+/g, "\n")
            .trim();
          if (transcript.length > 100) break;
        }
      }
    } catch {}
  }

  if (!title && !transcript) {
    return { text: "", error: "Could not fetch this YouTube video. Try pasting the transcript or description directly." };
  }

  const parts: string[] = [];
  if (title) parts.push(`Video title: ${title}`);
  if (author) parts.push(`Channel: ${author}`);
  parts.push(`URL: ${originalUrl}`);
  if (transcript) {
    parts.push("");
    parts.push("Transcript:");
    parts.push(transcript.length > 38000 ? transcript.slice(0, 38000) + "\n\n[…truncated]" : transcript);
  } else {
    parts.push("");
    parts.push("(No transcript available — repurpose based on the title and channel context.)");
  }
  if (description) parts.push(description);

  return {
    text: parts.join("\n"),
    title: title || `YouTube video ${videoId}`,
    source: originalUrl,
  };
}

export interface TranscriptionResult {
  text: string;
  provider: "elevenlabs" | "gemini";
  error?: string;
}

/** Transcribe audio via ElevenLabs Scribe (preferred when secret present). */
export async function transcribeWithElevenLabs(
  audioBase64: string,
  mimeType: string,
): Promise<TranscriptionResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return { text: "", provider: "elevenlabs", error: "ElevenLabs not configured" };

  try {
    // Convert base64 -> Uint8Array -> Blob
    const bin = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([bin], { type: mimeType });

    const form = new FormData();
    form.append("file", blob, `audio.${mimeType.split("/")[1] || "webm"}`);
    form.append("model_id", "scribe_v2");
    form.append("tag_audio_events", "false");
    form.append("diarize", "false");

    const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: form,
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("ElevenLabs STT error:", res.status, t);
      return { text: "", provider: "elevenlabs", error: "ElevenLabs transcription failed." };
    }

    const data = await res.json();
    return { text: data.text || "", provider: "elevenlabs" };
  } catch (err) {
    console.error("ElevenLabs transcription error:", err);
    return { text: "", provider: "elevenlabs", error: "ElevenLabs transcription failed." };
  }
}

/** Transcribe audio via Lovable AI Gemini (multimodal). */
export async function transcribeWithGemini(
  audioBase64: string,
  mimeType: string,
): Promise<TranscriptionResult> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) {
    return { text: "", provider: "gemini", error: "AI service not configured" };
  }

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Transcribe this audio verbatim. Return ONLY the transcribed text, no commentary or formatting. Preserve the speaker's wording, punctuation, and paragraph breaks where natural pauses occur.",
              },
              {
                type: "input_audio",
                input_audio: {
                  data: audioBase64,
                  format: mimeType.includes("mp3") ? "mp3" : mimeType.includes("wav") ? "wav" : "webm",
                },
              },
            ],
          },
        ],
      }),
    });

    if (res.status === 429) return { text: "", provider: "gemini", error: "Rate limit reached. Try again shortly." };
    if (res.status === 402) return { text: "", provider: "gemini", error: "AI credits exhausted." };
    if (!res.ok) {
      const t = await res.text();
      console.error("Gemini STT error:", res.status, t);
      return { text: "", provider: "gemini", error: "Audio transcription failed." };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { text: "", provider: "gemini", error: "No transcription returned." };
    return { text: typeof content === "string" ? content.trim() : "", provider: "gemini" };
  } catch (err) {
    console.error("Gemini transcription error:", err);
    return { text: "", provider: "gemini", error: "Failed to transcribe audio." };
  }
}

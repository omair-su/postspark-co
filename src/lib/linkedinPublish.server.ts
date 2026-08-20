/**
 * Server-only LinkedIn publisher used by the scheduler cron.
 * Mirrors the logic in publishToLinkedIn but works with an admin client and
 * an explicit user id (no request context available in cron).
 */
import {
  commentOnLinkedInPost,
  humanizeLinkedInError,
  isLinkedInError,
  linkedInFetch,
  uploadLinkedInDocument,
  uploadLinkedInImage,
  uploadLinkedInVideo,
} from "@/lib/linkedinMedia.server";
import { safeFetch } from "@/lib/safeFetch";

const BUCKET = "post-media";

export interface LinkedInScheduleInput {
  content: string;
  mediaPaths: string[]; // storage paths or absolute URLs
  mediaType: string | null; // images | video | document | article | none
  firstComment?: string | null;
  visibility?: "PUBLIC" | "CONNECTIONS";
}

export async function publishLinkedInForUser(
  admin: any,
  userId: string,
  input: LinkedInScheduleInput,
): Promise<{ postId?: string; url?: string; error?: string; commentError?: string }> {
  const { data: acct } = await admin
    .from("social_accounts")
    .select("access_token, token_expires_at, platform_user_id")
    .eq("user_id", userId)
    .eq("platform", "linkedin")
    .maybeSingle();

  if (!acct?.access_token) return { error: "LinkedIn not connected." };
  if (acct.token_expires_at && new Date(acct.token_expires_at) < new Date()) {
    return { error: "LinkedIn access expired — reconnect required." };
  }
  const token = acct.access_token as string;
  const authorUrn = String(acct.platform_user_id).startsWith("urn:")
    ? String(acct.platform_user_id)
    : `urn:li:person:${acct.platform_user_id}`;

  async function readBytes(ref: string): Promise<ArrayBuffer | null> {
    if (/^https?:\/\//i.test(ref)) {
      try {
        const res = await safeFetch(ref);
        return res.ok ? await res.arrayBuffer() : null;
      } catch {
        return null;
      }
    }
    const { data: blob, error } = await admin.storage.from(BUCKET).download(ref);
    if (error || !blob) return null;
    return await blob.arrayBuffer();
  }

  let content: any = undefined;
  const kind = input.mediaType || "none";
  const refs = input.mediaPaths.filter(Boolean);

  if (kind === "images" && refs.length) {
    const images: { id: string; altText: string }[] = [];
    for (const ref of refs.slice(0, 9)) {
      const bytes = await readBytes(ref);
      if (!bytes) return { error: "Could not read a scheduled image." };
      const up = await uploadLinkedInImage(token, authorUrn, bytes);
      if (isLinkedInError(up)) return { error: up.error };
      images.push({ id: up.urn, altText: "" });
    }
    content = images.length === 1 ? { media: { id: images[0].id } } : { multiImage: { images } };
  } else if (kind === "video" && refs[0]) {
    const bytes = await readBytes(refs[0]);
    if (!bytes) return { error: "Could not read the scheduled video." };
    const up = await uploadLinkedInVideo(token, authorUrn, bytes);
    if (isLinkedInError(up)) return { error: up.error };
    content = { media: { id: up.urn, title: "Video" } };
  } else if (kind === "document" && refs[0]) {
    const bytes = await readBytes(refs[0]);
    if (!bytes) return { error: "Could not read the scheduled document." };
    const up = await uploadLinkedInDocument(token, authorUrn, bytes);
    if (isLinkedInError(up)) return { error: up.error };
    content = { media: { id: up.urn, title: "Document" } };
  } else if (kind === "article" && refs[0]) {
    content = { article: { source: refs[0] } };
  }

  const body: any = {
    author: authorUrn,
    commentary: input.content,
    visibility: input.visibility || "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };
  if (content) body.content = content;

  const res = await linkedInFetch("https://api.linkedin.com/rest/posts", token, {
    body: JSON.stringify(body),
  });
  if (!res.ok && res.status !== 201) {
    const txt = await res.text().catch(() => "");
    return { error: humanizeLinkedInError(res.status, txt) };
  }

  const postId = res.headers.get("x-restli-id") || res.headers.get("x-linkedin-id") || undefined;
  const url = postId ? `https://www.linkedin.com/feed/update/${encodeURIComponent(postId)}/` : undefined;

  let commentError: string | undefined;
  if (input.firstComment?.trim() && postId) {
    const c = await commentOnLinkedInPost(token, authorUrn, postId, input.firstComment.trim());
    if (isLinkedInError(c)) commentError = c.error;
  }

  return { postId, url, commentError };
}

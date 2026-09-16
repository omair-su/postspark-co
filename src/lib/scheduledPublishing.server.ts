import { publishTweetForUser } from "@/lib/xPublish.server";
import { publishLinkedInForUser } from "@/lib/linkedinPublish.server";
import { getIgAccount, publishIgFlow, refreshIgTokenIfNeeded } from "@/lib/instagram.server";

const MAX_ERROR_LENGTH = 500;

type ScheduledRow = {
  id: string; user_id: string; platform: string; title: string; content: string;
  media_url: string | null; media_urls: unknown; media_type: string | null;
  first_comment: string | null; attempts?: number | null;
};

/** The queue stores "image" (singular); publishers expect "images". */
function normalizeMediaType(kind: string | null | undefined, count: number) {
  const value = (kind || "").toLowerCase();
  if (value === "image" || value === "photo") return "images";
  if (value) return value;
  return count ? "images" : "none";
}

function mediaFor(row: ScheduledRow) {
  const stored = Array.isArray(row.media_urls)
    ? row.media_urls.filter((value): value is string => typeof value === "string" && value.length > 0)
    : [];
  return Array.from(new Set([...(row.media_url ? [row.media_url] : []), ...stored]));
}

function xParts(content: string) {
  if (content.length <= 280) return [content];
  const words = content.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const word of words) {
    if (`${current} ${word}`.trim().length > 265 && current) { chunks.push(current); current = word; }
    else current = `${current} ${word}`.trim();
  }
  if (current) chunks.push(current);
  return chunks.map((chunk, index) => `${chunk} ${index + 1}/${chunks.length}`.slice(0, 280));
}

async function enqueueScheduledEmail(admin: any, row: ScheduledRow) {
  const { data: authUser } = await admin.auth.admin.getUserById(row.user_id);
  const recipient = authUser?.user?.email;
  if (!recipient) return { error: "No email address is available for this account." };
  const messageId = `scheduled-post-${row.id}`;
  const { data: existing } = await admin.from("email_send_log").select("id").eq("message_id", messageId).maybeSingle();
  if (existing) return { id: messageId };
  const escaped = row.content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />");
  const { error } = await admin.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId, to: recipient.toLowerCase(), from: "PostSpark <noreply@postspark.co>",
      sender_domain: "hello.postspark.co", subject: row.title,
      html: `<main style="font-family:Arial,sans-serif;line-height:1.6;max-width:680px;margin:auto">${escaped}</main>`,
      text: row.content, purpose: "transactional", label: "scheduled-content",
      idempotency_key: messageId, queued_at: new Date().toISOString(),
    },
  });
  return error ? { error: error.message } : { id: messageId };
}

async function publishRow(admin: any, row: ScheduledRow) {
  const media = mediaFor(row);
  if (row.platform === "twitter") {
    let replyTo: string | undefined; let firstId: string | undefined; let firstUrl: string | null | undefined;
    for (const [index, part] of xParts(row.content).entries()) {
      const result = await publishTweetForUser(admin, row.user_id, {
        text: part, mediaUrls: index === 0 ? media.slice(0, 4) : [],
        ...(replyTo ? { inReplyToTweetId: replyTo } : {}), scheduledPostId: row.id,
      });
      if (result.error) {
        // Earlier tweets are already public: never mark the whole row failed,
        // or a retry would post the thread twice.
        if (index > 0) {
          return {
            id: firstId, url: firstUrl ?? undefined, partial: true,
            error: `Thread partly sent (${index} of ${xParts(row.content).length} posts). Remaining posts were not sent: ${result.error}`,
          };
        }
        return { error: result.error };
      }
      replyTo = result.tweetId;
      if (index === 0) { firstId = result.tweetId; firstUrl = result.url; }
    }
    return { id: firstId, url: firstUrl ?? undefined };
  }
  if (row.platform === "linkedin") {
    const result = await publishLinkedInForUser(admin, row.user_id, {
      content: row.content, mediaPaths: media,
      mediaType: media.length > 1 ? "images" : normalizeMediaType(row.media_type, media.length),
      firstComment: row.first_comment,
    });
    return result.error ? { error: result.error } : { id: result.postId, url: result.url };
  }
  if (row.platform === "instagram") {
    if (!media.length) return { error: "Instagram requires at least one attached visual." };
    const account = await getIgAccount(admin, row.user_id);
    if (!account) return { error: "Instagram is not connected." };
    const refreshed = await refreshIgTokenIfNeeded(account);
    const result = await publishIgFlow(refreshed, {
      type: media.length > 1 ? "CAROUSEL" : row.media_type === "video" ? "REELS" : "IMAGE",
      caption: row.content, mediaUrl: media[0], mediaUrls: media, firstComment: row.first_comment || undefined,
    });
    return result.ok ? { id: result.mediaId } : { error: result.error };
  }
  if (row.platform === "email") return enqueueScheduledEmail(admin, row);
  return { error: `${row.platform} scheduled publishing is not supported yet.` };
}

type PublishResult = { id?: string; url?: string; error?: string };

export async function processScheduledPosts(admin: any, platform?: string) {
  let query = admin.from("scheduled_posts")
    .select("id,user_id,platform,title,content,media_url,media_urls,media_type,first_comment,attempts")
    .in("platform", ["twitter", "linkedin", "instagram", "email"])
    .eq("status", "scheduled").lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true }).limit(20);
  if (platform) query = query.eq("platform", platform);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const summary = { found: data?.length ?? 0, published: 0, failed: 0, skipped: 0 };
  for (const row of (data ?? []) as ScheduledRow[]) {
    const { data: claimed } = await admin.from("scheduled_posts")
      .update({ status: "publishing", attempts: (row.attempts ?? 0) + 1, publish_error: null })
      .eq("id", row.id).eq("status", "scheduled").select("id").maybeSingle();
    if (!claimed) { summary.skipped += 1; continue; }
    try {
      const result: PublishResult = await publishRow(admin, row);
      if (result.error) {
        summary.failed += 1;
        await admin.from("scheduled_posts").update({ status: "failed", publish_error: result.error.slice(0, MAX_ERROR_LENGTH) }).eq("id", row.id);
      } else {
        summary.published += 1;
        await admin.from("scheduled_posts").update({
          status: "published", published_at: new Date().toISOString(), platform_post_id: result.id ?? null,
          platform_post_url: result.url ?? null, publish_error: null,
        }).eq("id", row.id);
      }
    } catch (error) {
      summary.failed += 1;
      const message = error instanceof Error ? error.message : "Scheduled publish failed.";
      await admin.from("scheduled_posts").update({ status: "failed", publish_error: message.slice(0, MAX_ERROR_LENGTH) }).eq("id", row.id);
    }
  }
  return summary;
}
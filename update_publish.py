import re

def update_file(file_path, old_pattern, new_code):
    with open(file_path, 'r') as f:
        content = f.read()
    
    new_content = re.sub(old_pattern, new_code, content, flags=re.DOTALL)
    
    with open(file_path, 'w') as f:
        f.write(new_content)

# Update publishToX in socialPublish.functions.ts
publishToX_old = r'export const publishToX = createServerFn\(\{ method: "POST" \}\)\n  \.middleware\(\[requireSupabaseAuth\]\)\n  \.inputValidator\(\n    z\.object\(\{\n      text: z\.string\(\)\.min\(1\)\.max\(4000\),\n      mediaUrls: z\.array\(z\.string\(\)\.url\(\)\)\.max\(4\)\.default\(\[\]\),\n      inReplyToTweetId: z\.string\(\)\.max\(40\)\.optional\(\),\n      repurposeJobId: z\.string\(\)\.uuid\(\)\.optional\(\),\n    \}\)\.parse,\n  \)\n  \.handler\(async \(\{ data, context \}\) => \{.*?\}\);'

publishToX_new = '''export const publishToX = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      text: z.string().min(1).max(4000),
      mediaUrls: z.array(z.string().url()).max(4).default([]),
      inReplyToTweetId: z.string().max(40).optional(),
      repurposeJobId: z.string().uuid().optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;

      if (!data.inReplyToTweetId) {
        const gate = await checkFreeTierXLimit(supabase, userId);
        if (gate.blocked) {
          return {
            error: `Free plan limit reached (${gate.used}/${gate.limit} X posts this month). Upgrade to Pro for unlimited posting.`,
            code: "LIMIT_REACHED",
          };
        }
      }

      let attempt = 0;
      let lastError = "";

      while (attempt < 2) {
        const { accessToken, error: refreshErr } = await refreshXTokenIfNeeded(supabase, userId, attempt > 0);
        if (refreshErr || !accessToken) {
          return { error: refreshErr === "NOT_CONNECTED" ? "X not connected. Connect in Settings." : refreshErr };
        }

        const mediaIds: string[] = [];
        for (const url of data.mediaUrls) {
          const r = await fetch(url);
          if (!r.ok) return { error: `Could not fetch media at ${url.slice(0, 80)}` };
          const buf = await r.arrayBuffer();
          const mimeType = r.headers.get("content-type") || "image/jpeg";
          const up = await uploadMediaToX(accessToken, buf, mimeType);
          if (up.error || !up.mediaId) return { error: up.error || "X media upload failed" };
          mediaIds.push(up.mediaId);
        }

        const body: any = { text: data.text.slice(0, 4000) };
        if (mediaIds.length) body.media = { media_ids: mediaIds };
        if (data.inReplyToTweetId) body.reply = { in_reply_to_tweet_id: data.inReplyToTweetId };

        const postRes = await fetch("https://api.x.com/2/tweets", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        const postJson: any = await postRes.json().catch(() => ({}));
        
        if (!postRes.ok) {
          if ((postRes.status === 401 || postRes.status === 403) && attempt === 0) {
            attempt++;
            continue;
          }
          const rawMsg = postJson?.detail || postJson?.title || `X publish failed (${postRes.status})`;
          const isAuthErr = /not permitted|forbidden|unauthorized/i.test(rawMsg) || postRes.status === 403 || postRes.status === 401;
          const msg = isAuthErr
            ? "X rejected this publish (Error 403/261). This usually means your X developer app is missing write permissions or has been suspended. Please reconnect X in Settings and ensure 'Read and write' is enabled in your X Developer Portal."
            : rawMsg;
          return { error: msg };
        }

        const tweetId = postJson?.data?.id as string | undefined;
        const { data: acctRow } = await supabase.from("social_accounts").select("platform_username").eq("user_id", userId).eq("platform", "twitter").maybeSingle();
        const uname = (acctRow?.platform_username || "i").replace(/^@/, "");
        const tweetUrl = tweetId ? `https://x.com/${uname}/status/${tweetId}` : null;

        await supabase.from("scheduled_posts").insert({
          user_id: userId,
          platform: "twitter",
          status: "published",
          published_at: new Date().toISOString(),
          content: data.text.slice(0, 3000),
          title: data.text.slice(0, 80),
          platform_post_id: tweetId,
          media_url: tweetUrl || data.mediaUrls[0] || null,
          media_type: data.mediaUrls[0] ? "image" : null,
          repurpose_job_id: data.repurposeJobId,
          scheduled_for: new Date().toISOString(),
        } as any);

        return { ok: true, tweetId, url: tweetUrl };
      }
      return { error: "X publish failed after retry" };
    } catch (e: any) {
      console.error("[publishToX] error:", e);
      return { error: e?.message || "Failed to publish to X" };
    }
  });'''

# For src/lib/xPublish.server.ts
publishTweetForUser_old = r'export async function publishTweetForUser\(.*?\) \{.*?\}'

publishTweetForUser_new = '''export async function publishTweetForUser(
  supabase: AdminClient,
  userId: string,
  args: { text: string; mediaUrls: string[]; inReplyToTweetId?: string },
): Promise<{ tweetId?: string; url?: string | null; error?: string }> {
  let attempt = 0;
  while (attempt < 2) {
    const { accessToken, error: refreshErr } = await refreshXTokenForUser(supabase, userId, attempt > 0);
    if (!accessToken) return { error: refreshErr || "NOT_CONNECTED" };

    const mediaIds: string[] = [];
    for (const url of args.mediaUrls) {
      const r = await fetch(url);
      if (!r.ok) return { error: `fetch media ${r.status}` };
      const buf = await r.arrayBuffer();
      if (buf.byteLength > 15 * 1024 * 1024) return { error: "media > 15MB" };
      const mimeType = r.headers.get("content-type") || "image/jpeg";
      const up = await uploadMediaToX(accessToken, buf, mimeType);
      if (up.error || !up.mediaId) return { error: up.error || "media upload failed" };
      mediaIds.push(up.mediaId);
    }

    const body: any = { text: args.text.slice(0, 4000) };
    if (mediaIds.length) body.media = { media_ids: mediaIds };
    if (args.inReplyToTweetId) body.reply = { in_reply_to_tweet_id: args.inReplyToTweetId };

    const postRes = await fetch("https://api.x.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const postJson: any = await postRes.json().catch(() => ({}));
    if (!postRes.ok) {
      if ((postRes.status === 401 || postRes.status === 403) && attempt === 0) {
        attempt++;
        continue;
      }
      const rawMsg = postJson?.detail || postJson?.title || `publish ${postRes.status}`;
      const isAuthErr = /not permitted|forbidden|unauthorized/i.test(rawMsg) || postRes.status === 403 || postRes.status === 401;
      const msg = isAuthErr
        ? "X rejected this scheduled publish (Error 403/261). Reconnect X in Settings after enabling Read and write permissions and confirming the app has posting access."
        : rawMsg;
      return { error: msg };
    }
    const tweetId = postJson?.data?.id as string | undefined;

    const { data: acctRow } = await supabase
      .from("social_accounts")
      .select("platform_username")
      .eq("user_id", userId)
      .eq("platform", "twitter")
      .maybeSingle();
    const uname = (acctRow?.platform_username || "i").replace(/^@/, "");
    const url = tweetId ? `https://x.com/${uname}/status/${tweetId}` : null;
    return { tweetId, url };
  }
  return { error: "X publish failed after retry" };
}'''

update_file('src/lib/socialPublish.functions.ts', publishToX_old, publishToX_new)
update_file('src/lib/xPublish.server.ts', publishTweetForUser_old, publishTweetForUser_new)

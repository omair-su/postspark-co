/**
 * Server-only LinkedIn media upload state machines (Versioned REST API).
 *
 * Images     : /rest/images?action=initializeUpload  -> PUT bytes
 * Videos     : /rest/videos?action=initializeUpload  -> PUT parts -> finalizeUpload
 * Documents  : /rest/documents?action=initializeUpload -> PUT bytes
 *
 * Every call must carry the LinkedIn-Version header.
 */

/**
 * LinkedIn only supports a rolling ~12-month window of versions, so a pinned
 * constant silently expires and every call starts returning 426. We resolve the
 * version at call time (env override → last completed month) and retry with
 * older months if LinkedIn rejects one.
 */
function monthStamp(offsetMonths: number): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + offsetMonths);
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function resolveLinkedInVersion(): string {
  const env = (process.env.LINKEDIN_API_VERSION || "").trim();
  return /^\d{6}$/.test(env) ? env : monthStamp(-1);
}

/** Candidate versions tried in order when LinkedIn answers 426. */
export function linkedInVersionCandidates(): string[] {
  const first = resolveLinkedInVersion();
  const rest = [-1, -2, -3, -4, -6].map(monthStamp);
  return Array.from(new Set([first, ...rest]));
}

/** @deprecated use resolveLinkedInVersion() */
export const LINKEDIN_API_VERSION = resolveLinkedInVersion();

export function linkedInHeaders(accessToken: string, version?: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "LinkedIn-Version": version || resolveLinkedInVersion(),
    "X-Restli-Protocol-Version": "2.0.0",
  };
}

/**
 * Fetch a LinkedIn REST endpoint, automatically retrying with older API
 * versions when LinkedIn answers 426 (Upgrade Required / version retired).
 */
export async function linkedInFetch(
  url: string,
  accessToken: string,
  init: { method?: string; body?: string } = {},
): Promise<Response> {
  let last: Response | null = null;
  for (const version of linkedInVersionCandidates()) {
    const res = await fetch(url, {
      method: init.method || "POST",
      headers: linkedInHeaders(accessToken, version),
      body: init.body,
    });
    if (res.status !== 426) return res;
    console.warn(`[linkedin] version ${version} rejected (426), trying an older version`);
    last = res;
  }
  return last as Response;
}


export interface LinkedInError {
  error: string;
}

export function isLinkedInError(v: unknown): v is LinkedInError {
  return !!v && typeof v === "object" && typeof (v as any).error === "string";
}

/** Map raw LinkedIn HTTP failures into messages a user can act on. */
export function humanizeLinkedInError(status: number, body: string): string {
  const snippet = body.slice(0, 300);
  switch (status) {
    case 401:
      return "LinkedIn rejected your access token. Please reconnect LinkedIn in Settings → Integrations.";
    case 403:
      return "LinkedIn denied this action. Your connection is missing the posting permission (w_member_social). Disconnect and reconnect LinkedIn to grant it.";
    case 404:
      return "LinkedIn could not find that resource. Reconnect your account and try again.";
    case 422:
      return `LinkedIn rejected the post content: ${snippet}`;
    case 426:
      return "LinkedIn API version is out of date. We've been notified — please try again shortly.";
    case 429:
      return "LinkedIn rate limit reached. Wait a few minutes and try again.";
    default:
      return `LinkedIn request failed (${status}): ${snippet}`;
  }
}

async function fail(res: Response, fallbackContext: string): Promise<LinkedInError> {
  const txt = await res.text().catch(() => "");
  console.error(`[linkedin] ${fallbackContext} failed`, res.status, txt);
  return { error: humanizeLinkedInError(res.status, txt || fallbackContext) };
}

/** Upload a single image, returns the image URN. */
export async function uploadLinkedInImage(
  accessToken: string,
  ownerUrn: string,
  bytes: ArrayBuffer,
): Promise<{ urn: string } | LinkedInError> {
  const headers = linkedInHeaders(accessToken);
  const initRes = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
    method: "POST",
    headers,
    body: JSON.stringify({ initializeUploadRequest: { owner: ownerUrn } }),
  });
  if (!initRes.ok) return fail(initRes, "image initializeUpload");

  const init = await initRes.json();
  const uploadUrl: string | undefined = init?.value?.uploadUrl;
  const urn: string | undefined = init?.value?.image;
  if (!uploadUrl || !urn) return { error: "LinkedIn did not return an image upload URL." };

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: bytes,
  });
  if (!putRes.ok) return fail(putRes, "image upload");
  return { urn };
}

/** Upload a PDF/document, returns the document URN. */
export async function uploadLinkedInDocument(
  accessToken: string,
  ownerUrn: string,
  bytes: ArrayBuffer,
): Promise<{ urn: string } | LinkedInError> {
  const headers = linkedInHeaders(accessToken);
  const initRes = await fetch("https://api.linkedin.com/rest/documents?action=initializeUpload", {
    method: "POST",
    headers,
    body: JSON.stringify({ initializeUploadRequest: { owner: ownerUrn } }),
  });
  if (!initRes.ok) return fail(initRes, "document initializeUpload");

  const init = await initRes.json();
  const uploadUrl: string | undefined = init?.value?.uploadUrl;
  const urn: string | undefined = init?.value?.document;
  if (!uploadUrl || !urn) return { error: "LinkedIn did not return a document upload URL." };

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: bytes,
  });
  if (!putRes.ok) return fail(putRes, "document upload");
  return { urn };
}

/**
 * Multipart video upload. LinkedIn returns one upload instruction per byte
 * range; each PUT responds with an ETag that must be echoed back on finalize.
 */
export async function uploadLinkedInVideo(
  accessToken: string,
  ownerUrn: string,
  bytes: ArrayBuffer,
): Promise<{ urn: string } | LinkedInError> {
  const headers = linkedInHeaders(accessToken);
  const fileSizeBytes = bytes.byteLength;

  const initRes = await fetch("https://api.linkedin.com/rest/videos?action=initializeUpload", {
    method: "POST",
    headers,
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: ownerUrn,
        fileSizeBytes,
        uploadCaptions: false,
        uploadThumbnail: false,
      },
    }),
  });
  if (!initRes.ok) return fail(initRes, "video initializeUpload");

  const init = await initRes.json();
  const value = init?.value || {};
  const urn: string | undefined = value.video;
  const uploadToken: string = value.uploadToken ?? "";
  const instructions: Array<{ uploadUrl: string; firstByte: number; lastByte: number }> =
    value.uploadInstructions || [];
  if (!urn || instructions.length === 0) {
    return { error: "LinkedIn did not return video upload instructions." };
  }

  const partIds: string[] = [];
  for (const step of instructions) {
    const chunk = bytes.slice(step.firstByte, step.lastByte + 1);
    const putRes = await fetch(step.uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
      },
      body: chunk,
    });
    if (!putRes.ok) return fail(putRes, "video part upload");
    const etag = putRes.headers.get("etag") || putRes.headers.get("ETag");
    if (etag) partIds.push(etag.replace(/"/g, ""));
  }

  const finalizeRes = await fetch("https://api.linkedin.com/rest/videos?action=finalizeUpload", {
    method: "POST",
    headers,
    body: JSON.stringify({
      finalizeUploadRequest: { video: urn, uploadToken, uploadedPartIds: partIds },
    }),
  });
  if (!finalizeRes.ok) return fail(finalizeRes, "video finalizeUpload");

  return { urn };
}

/** Post a comment on an existing post (used for the link-in-first-comment play). */
export async function commentOnLinkedInPost(
  accessToken: string,
  actorUrn: string,
  postUrn: string,
  text: string,
): Promise<{ ok: true } | LinkedInError> {
  const res = await fetch(
    `https://api.linkedin.com/rest/socialActions/${encodeURIComponent(postUrn)}/comments`,
    {
      method: "POST",
      headers: linkedInHeaders(accessToken),
      body: JSON.stringify({ actor: actorUrn, object: postUrn, message: { text } }),
    },
  );
  if (!res.ok) return fail(res, "first comment");
  return { ok: true };
}

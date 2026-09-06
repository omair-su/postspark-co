/**
 * Turns any render failure into an honest, actionable error state.
 *
 * Every failure used to surface as the same bare "Generation failed" toast, so
 * a quota block, a billing block, a blocked prompt and an upstream timeout were
 * indistinguishable — and none of them offered a way forward.
 */

export type StudioErrorKind =
  | "limit"
  | "billing"
  | "moderation"
  | "timeout"
  | "rate"
  | "auth"
  | "network"
  | "image-access"
  | "unknown";

export type StudioError = {
  kind: StudioErrorKind;
  title: string;
  message: string;
  /** Re-running the exact same request can plausibly succeed. */
  canRetry: boolean;
  /** Another engine is likely to succeed where this one didn't. */
  canSwitchModel: boolean;
  /** Show the upgrade path. */
  showUpgrade: boolean;
};

function raw(e: unknown): string {
  if (!e) return "";
  if (typeof e === "string") return e;
  if (e instanceof Error) return `${e.name}: ${e.message}`;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export function classifyImageError(e: unknown): StudioError {
  const text = raw(e);
  const t = text.toLowerCase();

  if (t.includes("limit_reached") || t.includes("monthly") || t.includes("quota"))
    return {
      kind: "limit",
      title: "You've used this month's images",
      message: "Your image allowance for this billing period is spent. Upgrade for more headroom, or come back next cycle.",
      canRetry: false,
      canSwitchModel: false,
      showUpgrade: true,
    };

  if (t.includes("pro feature") || t.includes("upgrade") || t.includes("402") || t.includes("credit"))
    return {
      kind: "billing",
      title: "This render needs a Pro plan",
      message: text.replace(/^error:\s*/i, "") || "Upgrade to unlock this engine and unlimited renders.",
      canRetry: false,
      canSwitchModel: false,
      showUpgrade: true,
    };

  if (
    t.includes("content_policy") ||
    t.includes("moderation") ||
    t.includes("safety") ||
    t.includes("blocked") ||
    t.includes("nsfw")
  )
    return {
      kind: "moderation",
      title: "The prompt was blocked",
      message:
        "The engine refused this description. Rephrase it without named people, brands or characters — describe the look instead — or try a different engine.",
      canRetry: false,
      canSwitchModel: true,
      showUpgrade: false,
    };

  if (t.includes("timeout") || t.includes("timed out") || t.includes("504") || t.includes("aborted by the server"))
    return {
      kind: "timeout",
      title: "The engine took too long",
      message: "The render didn't finish in time. Nothing was charged — try again, or switch to the faster engine.",
      canRetry: true,
      canSwitchModel: true,
      showUpgrade: false,
    };

  if (t.includes("429") || t.includes("rate limit") || t.includes("too many requests"))
    return {
      kind: "rate",
      title: "Too many renders at once",
      message: "The engine is rate limiting us for a moment. Wait a few seconds and try again.",
      canRetry: true,
      canSwitchModel: true,
      showUpgrade: false,
    };

  if (t.includes("unauthorized") || t.includes("401") || t.includes("sign in"))
    return {
      kind: "auth",
      title: "Your session expired",
      message: "Sign in again to keep rendering.",
      canRetry: false,
      canSwitchModel: false,
      showUpgrade: false,
    };

  if (t.includes("imageaccesserror") || t.includes("locked by its host") || t.includes("could not be opened"))
    return {
      kind: "image-access",
      title: "This image can't be edited here",
      message: "We couldn't read the image's pixels. Download it, then re-upload it to apply a watermark or export pack.",
      canRetry: true,
      canSwitchModel: false,
      showUpgrade: false,
    };

  if (t.includes("failed to fetch") || t.includes("network") || t.includes("no_frames") || t.includes("502") || t.includes("503"))
    return {
      kind: "network",
      title: "The connection dropped",
      message: "The render never reached us. Nothing was charged — try again.",
      canRetry: true,
      canSwitchModel: true,
      showUpgrade: false,
    };

  return {
    kind: "unknown",
    title: "The render didn't finish",
    message: text ? text.slice(0, 220) : "Something went wrong on the way to the engine. Try again or pick another engine.",
    canRetry: true,
    canSwitchModel: true,
    showUpgrade: false,
  };
}

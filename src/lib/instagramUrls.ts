/**
 * Client-safe Instagram integration URLs (the exact values to paste into the
 * Meta app dashboard for the PostSpark-IG app).
 */
export const IG_SITE = "https://postspark.co";

export const IG_OAUTH_REDIRECT_URL = `${IG_SITE}/auth/instagram/callback`;
export const IG_WEBHOOK_URL = `${IG_SITE}/api/public/webhooks/instagram`;
export const IG_DEAUTHORIZE_URL = `${IG_SITE}/api/public/webhooks/instagram/delete`;
export const IG_DATA_DELETION_URL = `${IG_SITE}/api/public/webhooks/instagram/delete`;

export type IgSetupUrl = { label: string; field: string; url: string; hint?: string };

export const IG_SETUP_URLS: IgSetupUrl[] = [
  {
    label: "OAuth redirect (callback) URL",
    field: "Instagram → API setup with Instagram login → Business login settings",
    url: IG_OAUTH_REDIRECT_URL,
  },
  {
    label: "Webhook callback URL",
    field: "Instagram → Webhooks → Callback URL",
    url: IG_WEBHOOK_URL,
    hint: "Verify token = the INSTAGRAM_WEBHOOK_VERIFY_TOKEN saved in PostSpark.",
  },
  {
    label: "Deauthorize callback URL",
    field: "Business login settings → Deauthorize callback URL",
    url: IG_DEAUTHORIZE_URL,
  },
  {
    label: "Data deletion request URL",
    field: "Business login settings → Data deletion request URL",
    url: IG_DATA_DELETION_URL,
  },
];
